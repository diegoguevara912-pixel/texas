import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { config } from '../config.js';
import { toJson } from '../db/index.js';
import { audit } from '../lib/audit.js';
import { authRoutes, can, hashPassword, publicUser, requireAuth, requirePerm, validatePasswordStrength } from '../lib/auth.js';
import { limits } from '../lib/security.js';
import { getBusiness, pendingFields, saveBusiness } from '../lib/settings.js';
import { attachMedia, serializeVehicle, slugify } from '../lib/vehicles.js';

const str = (max) => z.string().trim().max(max).optional().nullable().transform((v) => (v === '' ? null : v));
const num = z.union([z.coerce.number(), z.literal('').transform(() => null), z.null()]).optional();

const vehicleSchema = z.object({
  inventoryCode: z.string().trim().min(2).max(40),
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  version: str(120),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 2),
  price: num,
  currency: z.string().length(3).default('HNL'),
  priceVisible: z.boolean().default(true),
  mileage: num,
  mileageUnit: z.enum(['km', 'mi']).default('km'),
  transmission: str(30),
  fuel: str(30),
  engine: str(80),
  drivetrain: str(30),
  bodyType: str(30),
  colorExt: str(60),
  colorInt: str(60),
  condition: str(30),
  features: z.array(z.string().trim().max(120)).max(60).default([]),
  equipment: z.array(z.object({ group: z.string().max(60), items: z.array(z.string().max(120)).max(60) })).max(20).default([]),
  videos: z.array(z.string().url().max(500)).max(10).default([]),
  model3dUrl: str(500),
  description: str(5000),
  notesPublic: str(2000),
  notesInternal: str(5000),
  status: z.enum(['available', 'reserved', 'sold', 'unpublished']).default('unpublished'),
  featured: z.boolean().default(false),
  showInHistory: z.boolean().default(false),
});

const toRow = (d) => ({
  inventory_code: d.inventoryCode, brand: d.brand, model: d.model, version: d.version, year: d.year,
  price: d.price, currency: d.currency, price_visible: d.priceVisible, mileage: d.mileage, mileage_unit: d.mileageUnit,
  transmission: d.transmission, fuel: d.fuel, engine: d.engine, drivetrain: d.drivetrain, body_type: d.bodyType,
  color_ext: d.colorExt, color_int: d.colorInt, condition: d.condition, features: toJson(d.features),
  equipment: toJson(d.equipment), videos: toJson(d.videos), model3d_url: d.model3dUrl, description: d.description,
  notes_public: d.notesPublic, notes_internal: d.notesInternal, status: d.status, featured: d.featured,
  show_in_history: d.showInHistory,
});

// Campos cuyo cambio queda en el historial del vehículo. El valor indica si el cambio es visible al público.
const TRACKED = { price: false, status: true, mileage: false, inventory_code: false, price_visible: false };

function validate(schema, body, res) {
  const r = schema.safeParse(body);
  if (!r.success) {
    const fields = {};
    for (const i of r.error.issues) fields[i.path.join('.')] ??= i.message;
    res.status(422).json({ error: 'Revise los campos marcados.', fields });
    return null;
  }
  return r.data;
}

// Solo imágenes reales: se verifica la firma binaria, no solo la extensión que envía el navegador.
const SIGNATURES = [
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', test: (b) => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', test: (b) => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' },
  { ext: 'avif', test: (b) => b.slice(4, 12).toString() === 'ftypavif' },
  { ext: 'glb', test: (b) => b.slice(0, 4).toString() === 'glTF' },
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.uploadMaxMb * 1024 * 1024, files: 12 },
});

export function adminRouter(db) {
  const r = express.Router();
  r.use('/login', limits.login);
  authRoutes(r, db);
  r.use(requireAuth(db));

  const pager = (req) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 25));
    return { page, perPage, offset: (page - 1) * perPage };
  };

  // ---------- Resumen ----------
  r.get('/summary', async (req, res) => {
    const count = async (t, w) => Number((await db(t).where(w || {}).count({ c: '*' }).first()).c);
    const b = await getBusiness(db);
    res.json({
      vehicles: {
        available: await count('vehicles', { status: 'available', archived: false }),
        reserved: await count('vehicles', { status: 'reserved', archived: false }),
        sold: await count('vehicles', { status: 'sold', archived: false }),
        unpublished: await count('vehicles', { status: 'unpublished', archived: false }),
      },
      leadsNew: can(req.user, 'leads') ? await count('leads', { status: 'new' }) : null,
      appointmentsRequested: can(req.user, 'appointments') ? await count('appointments', { status: 'requested' }) : null,
      financingNew: can(req.user, 'financing') ? await count('financing_requests', { status: 'new' }) : null,
      pending: pendingFields(b),
    });
  });

  // ---------- Vehículos ----------
  r.get('/vehicles', requirePerm('vehicles:read'), async (req, res) => {
    const { page, perPage, offset } = pager(req);
    const base = () => {
      const q = db('vehicles').where({ archived: req.query.archived === '1' });
      if (req.query.status) q.where({ status: String(req.query.status) });
      if (req.query.q) {
        const t = `%${String(req.query.q).slice(0, 60).replace(/[%_\\]/g, ' ')}%`;
        q.where((w) => w.where('brand', 'like', t).orWhere('model', 'like', t).orWhere('inventory_code', 'like', t));
      }
      return q;
    };
    const total = Number((await base().count({ c: '*' }).first()).c);
    const rows = await base().orderBy('updated_at', 'desc').limit(perPage).offset(offset);
    const media = await attachMedia(db, rows);
    res.json({ total, page, perPage, items: rows.map((v) => serializeVehicle(v, media.get(v.id) || [], { internal: true })) });
  });

  r.get('/vehicles/:id', requirePerm('vehicles:read'), async (req, res) => {
    const v = await db('vehicles').where({ id: Number(req.params.id) }).first();
    if (!v) return res.status(404).json({ error: 'No encontrado' });
    const media = await db('vehicle_media').where({ vehicle_id: v.id }).orderBy('sort');
    const history = await db('vehicle_history as h')
      .leftJoin('users as u', 'u.id', 'h.user_id')
      .where('h.vehicle_id', v.id)
      .orderBy('h.created_at', 'desc')
      .limit(100)
      .select('h.field', 'h.old_value', 'h.new_value', 'h.public', 'h.created_at', 'u.name as user');
    res.json({ vehicle: serializeVehicle(v, media, { internal: true }), history });
  });

  r.post('/vehicles', requirePerm('vehicles'), async (req, res) => {
    const d = validate(vehicleSchema, req.body, res);
    if (!d) return;
    if (await db('vehicles').where({ inventory_code: d.inventoryCode }).first()) {
      return res.status(409).json({ error: 'Ya existe un vehículo con ese código de inventario.', fields: { inventoryCode: 'Código repetido' } });
    }
    let slug = slugify(`${d.brand} ${d.model} ${d.version || ''} ${d.year} ${d.inventoryCode}`);
    const [id] = await db('vehicles').insert({ ...toRow(d), slug, sold_at: d.status === 'sold' ? new Date() : null });
    const vid = id?.id ?? id;
    await audit(db, req, 'vehicle_create', 'vehicle', vid, { code: d.inventoryCode });
    res.status(201).json({ id: vid, slug });
  });

  r.put('/vehicles/:id', requirePerm('vehicles'), async (req, res) => {
    const id = Number(req.params.id);
    const current = await db('vehicles').where({ id }).first();
    if (!current) return res.status(404).json({ error: 'No encontrado' });
    const d = validate(vehicleSchema, req.body, res);
    if (!d) return;
    const dup = await db('vehicles').where({ inventory_code: d.inventoryCode }).whereNot({ id }).first();
    if (dup) return res.status(409).json({ error: 'Código de inventario repetido.', fields: { inventoryCode: 'Código repetido' } });
    const row = toRow(d);
    const changes = [];
    for (const [field, isPublic] of Object.entries(TRACKED)) {
      const before = current[field] == null ? null : String(Number.isNaN(Number(current[field])) ? current[field] : Number(current[field]));
      const after = row[field] == null ? null : String(Number.isNaN(Number(row[field])) ? row[field] : Number(row[field]));
      if (before !== after) changes.push({ vehicle_id: id, user_id: req.user.id, field, old_value: before, new_value: after, public: isPublic });
    }
    if (current.status !== 'sold' && d.status === 'sold') row.sold_at = new Date();
    if (d.status !== 'sold') row.sold_at = null;
    row.updated_at = new Date();
    await db.transaction(async (trx) => {
      await trx('vehicles').where({ id }).update(row);
      if (changes.length) await trx('vehicle_history').insert(changes);
    });
    await audit(db, req, 'vehicle_update', 'vehicle', id, { changed: changes.map((c) => c.field) });
    res.json({ ok: true });
  });

  // Archivar (reversible) en lugar de borrar; borrar definitivo solo propietario.
  r.post('/vehicles/:id/archive', requirePerm('vehicles'), async (req, res) => {
    const id = Number(req.params.id);
    const archived = req.body?.archived !== false;
    await db('vehicles').where({ id }).update({ archived, updated_at: new Date() });
    await audit(db, req, archived ? 'vehicle_archive' : 'vehicle_unarchive', 'vehicle', id);
    res.json({ ok: true });
  });

  r.delete('/vehicles/:id', requirePerm('users'), async (req, res) => {
    const id = Number(req.params.id);
    const v = await db('vehicles').where({ id }).first();
    if (!v) return res.status(404).json({ error: 'No encontrado' });
    if (!v.archived) return res.status(409).json({ error: 'Archive el vehículo antes de eliminarlo definitivamente.' });
    const media = await db('vehicle_media').where({ vehicle_id: id });
    await db('vehicles').where({ id }).del();
    for (const m of media) removeUpload(m.url);
    await audit(db, req, 'vehicle_delete', 'vehicle', id, { code: v.inventory_code });
    res.json({ ok: true });
  });

  r.post('/vehicles/:id/media', requirePerm('vehicles'), upload.array('files', 12), async (req, res) => {
    const id = Number(req.params.id);
    if (!(await db('vehicles').where({ id }).first())) return res.status(404).json({ error: 'No encontrado' });
    const kind = req.body.kind === 'model3d' ? 'model3d' : req.body.kind === 'spin360' ? 'spin360' : 'image';
    const dir = path.join(config.uploadDir, 'vehicles', String(id));
    fs.mkdirSync(dir, { recursive: true });
    const maxSort = Number((await db('vehicle_media').where({ vehicle_id: id }).max({ m: 'sort' }).first()).m ?? -1);
    const saved = [];
    for (const [i, f] of (req.files || []).entries()) {
      const sig = SIGNATURES.find((s) => s.test(f.buffer));
      if (!sig || (kind === 'model3d') !== (sig.ext === 'glb')) {
        return res.status(415).json({ error: `Archivo no permitido: ${f.originalname}. Use JPG, PNG, WebP o AVIF (o GLB para modelos 3D).` });
      }
      const name = `${crypto.randomBytes(12).toString('hex')}.${sig.ext}`;
      fs.writeFileSync(path.join(dir, name), f.buffer, { flag: 'wx' });
      const url = `/uploads/vehicles/${id}/${name}`;
      saved.push({ vehicle_id: id, kind, url, alt: String(req.body.alt || '').slice(0, 200) || null, sort: maxSort + 1 + i });
    }
    if (saved.length) await db('vehicle_media').insert(saved);
    if (kind === 'model3d' && saved[0]) await db('vehicles').where({ id }).update({ model3d_url: saved[0].url });
    await audit(db, req, 'media_upload', 'vehicle', id, { count: saved.length, kind });
    res.status(201).json({ ok: true, count: saved.length });
  });

  r.put('/vehicles/:id/media/order', requirePerm('vehicles'), async (req, res) => {
    const ids = z.array(z.number().int()).max(100).safeParse(req.body?.ids);
    if (!ids.success) return res.status(422).json({ error: 'Orden inválido' });
    await db.transaction(async (trx) => {
      for (const [i, mid] of ids.data.entries()) await trx('vehicle_media').where({ id: mid, vehicle_id: Number(req.params.id) }).update({ sort: i });
    });
    res.json({ ok: true });
  });

  r.patch('/media/:mid', requirePerm('vehicles'), async (req, res) => {
    await db('vehicle_media').where({ id: Number(req.params.mid) }).update({ alt: String(req.body?.alt || '').slice(0, 200) });
    res.json({ ok: true });
  });

  r.delete('/media/:mid', requirePerm('vehicles'), async (req, res) => {
    const m = await db('vehicle_media').where({ id: Number(req.params.mid) }).first();
    if (!m) return res.status(404).json({ error: 'No encontrado' });
    await db('vehicle_media').where({ id: m.id }).del();
    removeUpload(m.url);
    await audit(db, req, 'media_delete', 'vehicle', m.vehicle_id);
    res.json({ ok: true });
  });

  // ---------- Bandejas: clientes, citas, financiamiento ----------
  const inbox = (table, perm, statuses, select) => {
    r.get(`/${perm}`, requirePerm(perm), async (req, res) => {
      const { page, perPage, offset } = pager(req);
      const base = () => {
        const q = db(`${table} as t`).leftJoin('vehicles as v', 'v.id', 't.vehicle_id');
        if (req.query.status) q.where('t.status', String(req.query.status));
        if (req.query.vehicleId) q.where('t.vehicle_id', Number(req.query.vehicleId));
        return q;
      };
      const total = Number((await base().count({ c: '*' }).first()).c);
      const items = await base()
        .orderBy('t.created_at', 'desc')
        .limit(perPage)
        .offset(offset)
        .select(...select.map((c) => `t.${c}`), 'v.brand as vehicle_brand', 'v.model as vehicle_model', 'v.year as vehicle_year', 'v.inventory_code as vehicle_code');
      res.json({ total, page, perPage, items });
    });

    r.patch(`/${perm}/:id`, requirePerm(perm), async (req, res) => {
      const id = Number(req.params.id);
      const status = req.body?.status;
      const patch = {};
      if (status !== undefined) {
        if (!statuses.includes(status)) return res.status(422).json({ error: 'Estado inválido' });
        patch.status = status;
      }
      if (table === 'appointments' && req.body?.confirmedFor !== undefined) {
        const dt = req.body.confirmedFor ? new Date(req.body.confirmedFor) : null;
        if (dt && Number.isNaN(dt.getTime())) return res.status(422).json({ error: 'Fecha inválida' });
        patch.confirmed_for = dt;
      }
      if (!Object.keys(patch).length) return res.status(422).json({ error: 'Nada que actualizar' });
      patch.updated_at = new Date();
      const n = await db(table).where({ id }).update(patch);
      if (!n) return res.status(404).json({ error: 'No encontrado' });
      await audit(db, req, `${perm}_update`, perm, id, patch);
      res.json({ ok: true });
    });

    r.get(`/${perm}/:id/notes`, requirePerm(perm), async (req, res) => {
      const notes = await db('notes as n').leftJoin('users as u', 'u.id', 'n.user_id')
        .where({ 'n.entity': perm, 'n.entity_id': Number(req.params.id) })
        .orderBy('n.created_at', 'desc')
        .select('n.id', 'n.body', 'n.created_at', 'u.name as user');
      res.json({ notes });
    });

    r.post(`/${perm}/:id/notes`, requirePerm(perm), async (req, res) => {
      const body = String(req.body?.body || '').trim().slice(0, 4000);
      if (!body) return res.status(422).json({ error: 'Escriba una nota' });
      await db('notes').insert({ entity: perm, entity_id: Number(req.params.id), user_id: req.user.id, body });
      res.status(201).json({ ok: true });
    });
  };

  inbox('leads', 'leads', ['new', 'contacted', 'qualified', 'won', 'lost', 'archived'],
    ['id', 'kind', 'name', 'phone', 'whatsapp', 'email', 'vehicle_id', 'message', 'country', 'region', 'city', 'consent_marketing', 'status', 'source', 'created_at']);
  inbox('appointments', 'appointments', ['requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show'],
    ['id', 'type', 'name', 'phone', 'vehicle_id', 'preferred_date', 'preferred_slot', 'confirmed_for', 'status', 'message', 'created_at']);
  inbox('financing_requests', 'financing', ['new', 'in_review', 'sent_to_entity', 'approved_by_entity', 'declined_by_entity', 'withdrawn'],
    ['id', 'name', 'contact_method', 'contact_value', 'vehicle_id', 'vehicle_price', 'down_payment', 'term_months', 'currency', 'preferred_bank', 'region', 'status', 'created_at']);

  // Exportación CSV: solo datos de contacto autorizados; sin hash de IP ni notas internas.
  r.get('/leads-export.csv', requirePerm('leads'), async (req, res) => {
    const rows = await db('leads as l').leftJoin('vehicles as v', 'v.id', 'l.vehicle_id').orderBy('l.created_at', 'desc')
      .select('l.id', 'l.created_at', 'l.kind', 'l.status', 'l.name', 'l.phone', 'l.whatsapp', 'l.email', 'l.region', 'l.city', 'l.consent_marketing', 'v.inventory_code');
    const head = ['id', 'fecha', 'tipo', 'estado', 'nombre', 'telefono', 'whatsapp', 'correo', 'departamento', 'ciudad', 'acepta_comunicaciones', 'vehiculo'];
    const esc = (v) => {
      let s = v == null ? '' : String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // evita inyección de fórmulas en Excel
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [head.join(','), ...rows.map((r0) => Object.values(r0).map(esc).join(','))].join('\r\n');
    await audit(db, req, 'leads_export', 'leads', null, { rows: rows.length });
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="clientes-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + csv);
  });

  // ---------- Contenido ----------
  r.get('/settings', requirePerm('content'), async (req, res) => {
    const b = await getBusiness(db);
    res.json({ business: b, pending: pendingFields(b) });
  });

  r.put('/settings', requirePerm('content'), async (req, res) => {
    const incoming = req.body?.business;
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return res.status(422).json({ error: 'Formato inválido' });
    const size = JSON.stringify(incoming).length;
    if (size > 200_000) return res.status(413).json({ error: 'Configuración demasiado grande' });
    const f = incoming.financing || {};
    if (f.mode && !['disabled', 'illustrative', 'authorized'].includes(f.mode)) return res.status(422).json({ error: 'Modo de financiamiento inválido' });
    if (f.mode === 'authorized' && !(Number(f.authorizedAnnualRate) >= 0)) return res.status(422).json({ error: 'Ingrese la tasa autorizada' });
    if (incoming.payments?.gateway?.enabled && incoming.payments?.gateway?.testMode === false && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Solo el propietario puede activar pagos reales.' });
    }
    for (const u of [incoming.mapEmbedUrl, incoming.logoUrl, ...Object.values(incoming.social || {})]) {
      if (u && !/^(https:\/\/|\/uploads\/)/.test(String(u))) return res.status(422).json({ error: 'Los enlaces deben empezar con https://' });
    }
    await saveBusiness(db, incoming, req.user.id);
    await audit(db, req, 'settings_update', 'settings', 'business');
    res.json({ ok: true, pending: pendingFields(incoming) });
  });

  r.post('/settings/logo', requirePerm('content'), upload.single('file'), async (req, res) => {
    const f = req.file;
    const sig = f && SIGNATURES.find((s) => s.ext !== 'glb' && s.test(f.buffer));
    if (!sig) return res.status(415).json({ error: 'Use una imagen JPG, PNG, WebP o AVIF.' });
    const dir = path.join(config.uploadDir, 'brand');
    fs.mkdirSync(dir, { recursive: true });
    const name = `logo-${crypto.randomBytes(6).toString('hex')}.${sig.ext}`;
    fs.writeFileSync(path.join(dir, name), f.buffer);
    res.status(201).json({ url: `/uploads/brand/${name}` });
  });

  r.get('/faqs', requirePerm('content'), async (req, res) => res.json({ items: await db('faqs').orderBy('sort') }));
  r.post('/faqs', requirePerm('content'), async (req, res) => {
    const q = String(req.body?.question || '').trim().slice(0, 255);
    const a = String(req.body?.answer || '').trim().slice(0, 4000);
    if (!q || !a) return res.status(422).json({ error: 'Pregunta y respuesta son obligatorias' });
    const [id] = await db('faqs').insert({ question: q, answer: a, sort: Number(req.body?.sort) || 0, published: req.body?.published !== false });
    res.status(201).json({ id: id?.id ?? id });
  });
  r.put('/faqs/:id', requirePerm('content'), async (req, res) => {
    await db('faqs').where({ id: Number(req.params.id) }).update({
      question: String(req.body?.question || '').trim().slice(0, 255),
      answer: String(req.body?.answer || '').trim().slice(0, 4000),
      sort: Number(req.body?.sort) || 0,
      published: req.body?.published !== false,
      updated_at: new Date(),
    });
    res.json({ ok: true });
  });
  r.delete('/faqs/:id', requirePerm('content'), async (req, res) => {
    await db('faqs').where({ id: Number(req.params.id) }).del();
    res.json({ ok: true });
  });

  // ---------- Administración ----------
  r.get('/users', requirePerm('users'), async (req, res) => {
    const users = await db('users').orderBy('id').select('id', 'email', 'name', 'role', 'active', 'last_login_at', 'created_at');
    res.json({ users });
  });

  r.post('/users', requirePerm('users'), async (req, res) => {
    const s = z.object({ email: z.string().email().max(190), name: z.string().trim().min(2).max(120), role: z.enum(['owner', 'admin', 'sales']), password: z.string() });
    const d = validate(s, req.body, res);
    if (!d) return;
    const weak = validatePasswordStrength(d.password);
    if (weak) return res.status(422).json({ error: weak, fields: { password: weak } });
    if (await db('users').where({ email: d.email.toLowerCase() }).first()) return res.status(409).json({ error: 'Ese correo ya existe' });
    const [id] = await db('users').insert({ email: d.email.toLowerCase(), name: d.name, role: d.role, password_hash: await hashPassword(d.password) });
    await audit(db, req, 'user_create', 'user', id?.id ?? id, { role: d.role });
    res.status(201).json({ id: id?.id ?? id });
  });

  r.patch('/users/:id', requirePerm('users'), async (req, res) => {
    const id = Number(req.params.id);
    const patch = {};
    if (req.body?.role) {
      if (!['owner', 'admin', 'sales'].includes(req.body.role)) return res.status(422).json({ error: 'Rol inválido' });
      patch.role = req.body.role;
    }
    if (typeof req.body?.active === 'boolean') patch.active = req.body.active;
    if (id === req.user.id && (patch.active === false || (patch.role && patch.role !== 'owner'))) {
      return res.status(409).json({ error: 'No puede quitarse su propio acceso de propietario.' });
    }
    if (req.body?.password) {
      const weak = validatePasswordStrength(req.body.password);
      if (weak) return res.status(422).json({ error: weak });
      patch.password_hash = await hashPassword(req.body.password);
    }
    await db('users').where({ id }).update({ ...patch, updated_at: new Date() });
    if (patch.active === false || patch.password_hash) await db('sessions').where({ user_id: id }).del();
    await audit(db, req, 'user_update', 'user', id, { role: patch.role, active: patch.active, password: !!patch.password_hash });
    res.json({ ok: true });
  });

  r.get('/sessions', async (req, res) => {
    const q = db('sessions as s').join('users as u', 'u.id', 's.user_id').where('s.expires_at', '>', new Date());
    if (!can(req.user, 'users')) q.where('s.user_id', req.user.id);
    const items = await q.select('s.id', 's.user_agent', 's.created_at', 's.expires_at', 'u.name', 'u.email');
    res.json({ items: items.map((s) => ({ ...s, id: s.id.slice(0, 10), current: s.id === req.sessionId })) });
  });

  r.post('/sessions/revoke-others', async (req, res) => {
    await db('sessions').where({ user_id: req.user.id }).whereNot({ id: req.sessionId }).del();
    await audit(db, req, 'sessions_revoke', 'user', req.user.id);
    res.json({ ok: true });
  });

  r.get('/audit', requirePerm('audit'), async (req, res) => {
    const { page, perPage, offset } = pager(req);
    const items = await db('audit_log as a').leftJoin('users as u', 'u.id', 'a.user_id')
      .orderBy('a.created_at', 'desc').limit(perPage).offset(offset)
      .select('a.id', 'a.action', 'a.entity', 'a.entity_id', 'a.meta', 'a.created_at', 'u.name as user');
    res.json({ items, page, perPage });
  });

  r.get('/me/permissions', (req, res) => {
    const areas = ['vehicles', 'leads', 'appointments', 'financing', 'content', 'users', 'audit'];
    res.json({ user: publicUser(req.user), can: Object.fromEntries(areas.map((a) => [a, can(req.user, a) || can(req.user, `${a}:read`)])) });
  });

  return r;
}

function removeUpload(url) {
  if (!url?.startsWith('/uploads/')) return;
  const file = path.resolve(config.uploadDir, url.replace(/^\/uploads\//, ''));
  if (!file.startsWith(config.uploadDir)) return; // nunca fuera de la carpeta de subidas
  fs.rm(file, { force: true }, () => {});
}
