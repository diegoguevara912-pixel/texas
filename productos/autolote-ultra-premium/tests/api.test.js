import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createDb, toJson } from '../server/db/index.js';
import { migrate } from '../server/db/migrate.js';
import { createApp } from '../server/app.js';
import { hashPassword } from '../server/lib/auth.js';
import { saveBusiness, getBusiness } from '../server/lib/settings.js';

// Base de datos en memoria: las pruebas nunca tocan datos reales.
const db = createDb({ client: 'better-sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true, pool: { min: 1, max: 1 } });
let app;
const ORIGIN = 'http://localhost:5173';
const PASS = 'PruebaSegura2026';
const past = () => Date.now() - 10_000;

async function login(email, password = PASS) {
  const agent = request.agent(app);
  const r = await agent.post('/api/admin/login').set('Origin', ORIGIN).send({ email, password });
  return { agent, csrf: r.body.csrf, status: r.status };
}

beforeAll(async () => {
  await migrate(db);
  app = createApp(db);
  await db('users').insert([
    { email: 'duena@test.local', name: 'Propietaria', role: 'owner', password_hash: await hashPassword(PASS) },
    { email: 'ventas@test.local', name: 'Ventas', role: 'sales', password_hash: await hashPassword(PASS) },
    { email: 'bloqueo@test.local', name: 'Bloqueo', role: 'admin', password_hash: await hashPassword(PASS) },
  ]);
  const base = { currency: 'HNL', price_visible: true, show_in_history: false, mileage_unit: 'km', features: toJson([]), equipment: toJson([]), videos: toJson([]) };
  await db('vehicles').insert([
    { ...base, slug: 'publicado', inventory_code: 'T-1', brand: 'Marca', model: 'Uno', year: 2022, price: 500000, status: 'available', notes_internal: 'SECRETO' },
    { ...base, slug: 'borrador', inventory_code: 'T-2', brand: 'Marca', model: 'Dos', year: 2021, price: 400000, status: 'unpublished' },
    { ...base, slug: 'vendido', inventory_code: 'T-3', brand: 'Marca', model: 'Tres', year: 2020, price: 300000, status: 'sold' },
  ]);
  const b = await getBusiness(db);
  b.payments.transfer = { enabled: true, accounts: [{ bank: 'Banco X', number: '123', verified: false }, { bank: 'Banco Y', number: '456', verified: true }] };
  await saveBusiness(db, b, null);
});

afterAll(() => db.destroy());

describe('API pública', () => {
  it('la configuración pública no expone cuentas no verificadas', async () => {
    const r = await request(app).get('/api/site');
    expect(r.status).toBe(200);
    const accounts = r.body.business.payments.transfer.accounts;
    expect(accounts).toHaveLength(1);
    expect(accounts[0].bank).toBe('Banco Y');
    expect(r.body.business.pending.length).toBeGreaterThan(0);
  });

  it('solo lista vehículos publicados y nunca notas internas', async () => {
    const r = await request(app).get('/api/vehicles');
    expect(r.body.items.map((v) => v.slug)).toEqual(['publicado']);
    expect(JSON.stringify(r.body)).not.toContain('SECRETO');
    expect((await request(app).get('/api/vehicles/borrador')).status).toBe(404);
    expect((await request(app).get('/api/vehicles/vendido')).status).toBe(404);
  });

  it('los filtros resisten intentos de inyección SQL', async () => {
    const r = await request(app).get('/api/vehicles').query({ q: "x' OR 1=1 --", brand: "Marca' OR '1'='1", sort: 'price desc; DROP TABLE vehicles' });
    expect(r.status).toBe(200);
    expect(r.body.total).toBe(0);
    expect((await request(app).get('/api/vehicles')).body.total).toBe(1);
  });

  it('rechaza envíos desde otro origen', async () => {
    const r = await request(app).post('/api/leads').set('Origin', 'https://sitio-malicioso.example').send({});
    expect(r.status).toBe(403);
  });

  it('valida campos y exige consentimiento de privacidad', async () => {
    const r = await request(app).post('/api/leads').set('Origin', ORIGIN).send({ name: 'A', phone: 'abc', startedAt: past() });
    expect(r.status).toBe(422);
    expect(r.body.fields).toHaveProperty('name');
    expect(r.body.fields).toHaveProperty('phone');
    expect(r.body.fields).toHaveProperty('consentPrivacy');
  });

  it('bloquea envíos demasiado rápidos (bots)', async () => {
    const r = await request(app).post('/api/leads').set('Origin', ORIGIN).send({ name: 'Ana Pérez', phone: '+504 9999 0000', consentPrivacy: true, startedAt: Date.now() });
    expect(r.status).toBe(400);
  });

  it('el campo trampa responde OK pero no guarda nada', async () => {
    const before = (await db('leads').count({ c: '*' }).first()).c;
    const r = await request(app).post('/api/leads').set('Origin', ORIGIN).send({ website: 'spam', name: 'Bot', phone: '1', startedAt: past() });
    expect(r.status).toBe(200);
    expect((await db('leads').count({ c: '*' }).first()).c).toBe(before);
  });

  it('guarda una consulta válida, con ubicación opcional y sin IP en claro', async () => {
    const r = await request(app).post('/api/leads').set('Origin', ORIGIN).send({
      name: 'Ana Pérez', phone: '+504 9999 0000', email: '', consentPrivacy: true, consentMarketing: false, region: 'Francisco Morazán', startedAt: past(),
    });
    expect(r.status).toBe(201);
    expect(r.body.reference).toMatch(/^C-\d{5}$/);
    const lead = await db('leads').orderBy('id', 'desc').first();
    expect(lead.region).toBe('Francisco Morazán');
    expect(lead.city).toBeNull();
    expect(lead.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(lead.consent_marketing).toBeFalsy();
  });

  it('no acepta una prima mayor o igual al precio en financiamiento', async () => {
    const r = await request(app).post('/api/financing').set('Origin', ORIGIN).send({
      name: 'Luis', contactMethod: 'whatsapp', contactValue: '+50499990000', vehiclePrice: 100000, downPayment: 100000, consentContact: true, startedAt: past(),
    });
    expect(r.status).toBe(422);
  });

  it('una cita queda en estado solicitada y valida la fecha', async () => {
    const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
    const ok = await request(app).post('/api/appointments').set('Origin', ORIGIN).send({ name: 'Marta Ruiz', phone: '+504 3333 2222', preferredDate: tomorrow, preferredSlot: 'manana', consentPrivacy: true, startedAt: past() });
    expect(ok.status).toBe(201);
    expect(ok.body.status).toBe('requested');
    const bad = await request(app).post('/api/appointments').set('Origin', ORIGIN).send({ name: 'Marta Ruiz', phone: '+504 3333 2222', preferredDate: '2001-01-01', preferredSlot: 'manana', consentPrivacy: true, startedAt: past() });
    expect(bad.status).toBe(422);
  });

  it('una prueba de manejo desactivada se rechaza', async () => {
    const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
    const r = await request(app).post('/api/appointments').set('Origin', ORIGIN).send({ type: 'test_drive', name: 'Marta Ruiz', phone: '+504 3333 2222', preferredDate: tomorrow, preferredSlot: 'tarde', consentPrivacy: true, startedAt: past() });
    expect(r.status).toBe(409);
  });
});

describe('Panel administrativo', () => {
  // Una sola sesión de propietaria: el límite de 10 intentos de login por IP también aplica en las pruebas.
  let owner;
  beforeAll(async () => { owner = await login('duena@test.local'); });
  it('exige sesión en el servidor (no solo en el frontend)', async () => {
    expect((await request(app).get('/api/admin/vehicles')).status).toBe(401);
    expect((await request(app).get('/api/admin/leads')).status).toBe(401);
  });

  it('bloquea la cuenta tras 5 intentos fallidos', async () => {
    for (let i = 0; i < 5; i++) expect((await login('bloqueo@test.local', 'mala')).status).toBe(401);
    expect((await login('bloqueo@test.local')).status).toBe(423);
  });

  it('exige token CSRF para modificar datos', async () => {
    const { agent, csrf } = owner;
    const body = { inventoryCode: 'T-9', brand: 'Nueva', model: 'X', year: 2024, status: 'unpublished' };
    expect((await agent.post('/api/admin/vehicles').set('Origin', ORIGIN).send(body)).status).toBe(403);
    const ok = await agent.post('/api/admin/vehicles').set('Origin', ORIGIN).set('X-CSRF-Token', csrf).send(body);
    expect(ok.status).toBe(201);
  });

  it('registra cambios de precio y estado en el historial y en auditoría', async () => {
    const { agent, csrf } = owner;
    const v = await db('vehicles').where({ slug: 'publicado' }).first();
    const r = await agent.put(`/api/admin/vehicles/${v.id}`).set('Origin', ORIGIN).set('X-CSRF-Token', csrf)
      .send({ inventoryCode: 'T-1', brand: 'Marca', model: 'Uno', year: 2022, price: 480000, status: 'reserved' });
    expect(r.status).toBe(200);
    const hist = await db('vehicle_history').where({ vehicle_id: v.id });
    expect(hist.map((h) => h.field).sort()).toEqual(['price', 'status']);
    expect(await db('audit_log').where({ action: 'vehicle_update' }).first()).toBeTruthy();
  });

  it('el rol ventas no puede editar vehículos ni gestionar usuarios', async () => {
    const { agent, csrf } = await login('ventas@test.local');
    expect((await agent.get('/api/admin/vehicles')).status).toBe(200);
    expect((await agent.post('/api/admin/vehicles').set('Origin', ORIGIN).set('X-CSRF-Token', csrf).send({})).status).toBe(403);
    expect((await agent.get('/api/admin/users')).status).toBe(403);
    expect((await agent.put('/api/admin/settings').set('Origin', ORIGIN).set('X-CSRF-Token', csrf).send({ business: {} })).status).toBe(403);
  });

  it('rechaza archivos que no son imágenes reales aunque digan .jpg', async () => {
    const { agent, csrf } = owner;
    const v = await db('vehicles').where({ slug: 'publicado' }).first();
    const r = await agent.post(`/api/admin/vehicles/${v.id}/media`).set('Origin', ORIGIN).set('X-CSRF-Token', csrf)
      .attach('files', Buffer.from('<?php echo "x"; ?>'), { filename: 'foto.jpg', contentType: 'image/jpeg' });
    expect(r.status).toBe(415);
  });

  it('la exportación CSV neutraliza fórmulas de hoja de cálculo', async () => {
    await db('leads').insert({ name: '=HYPERLINK("http://x")', phone: '+5040000000', consent_privacy: true });
    const { agent } = owner;
    const r = await agent.get('/api/admin/leads-export.csv');
    expect(r.status).toBe(200);
    expect(r.text).toContain(`"'=HYPERLINK`);
    expect(r.text).not.toContain('ip_hash');
  });

  it('no permite contraseñas débiles para nuevos usuarios', async () => {
    const { agent, csrf } = owner;
    const r = await agent.post('/api/admin/users').set('Origin', ORIGIN).set('X-CSRF-Token', csrf).send({ email: 'x@test.local', name: 'X', role: 'sales', password: '123456' });
    expect(r.status).toBe(422);
  });

  it('cerrar sesión invalida la cookie en el servidor', async () => {
    const { agent, csrf } = owner;
    expect((await agent.post('/api/admin/logout').set('Origin', ORIGIN).set('X-CSRF-Token', csrf)).status).toBe(200);
    expect((await agent.get('/api/admin/me')).status).toBe(401);
  });
});
