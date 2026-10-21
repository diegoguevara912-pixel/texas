import express from 'express';
import { z } from 'zod';
import { getBusiness, publicBusiness } from '../lib/settings.js';
import { PUBLIC_STATUSES, SORTS, applyCatalogFilters, attachMedia, serializeVehicle } from '../lib/vehicles.js';
import { antiSpam, ipHash, limits, tooFast } from '../lib/security.js';

export const PRIVACY_VERSION = '2026-10';

const phone = z.string().trim().min(7, 'Ingrese un teléfono válido').max(30).regex(/^[+\d\s()-]+$/, 'Use solo números, espacios y +');
const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

const leadSchema = z.object({
  kind: z.enum(['info', 'quote', 'visit', 'test_drive', 'reservation', 'inspection', 'service', 'other']).default('info'),
  name: z.string().trim().min(3, 'Ingrese su nombre completo').max(120),
  phone,
  whatsapp: phone.optional().or(z.literal('').transform(() => undefined)),
  email: z.string().trim().email('Correo no válido').max(190).optional().or(z.literal('').transform(() => undefined)),
  vehicleId: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  message: optionalText(2000),
  country: optionalText(60),
  region: optionalText(80),
  city: optionalText(80),
  consentPrivacy: z.literal(true, { errorMap: () => ({ message: 'Debe aceptar la declaración de privacidad' }) }),
  consentMarketing: z.boolean().optional().default(false),
});

const appointmentSchema = z.object({
  type: z.enum(['visit', 'test_drive', 'inspection']).default('visit'),
  name: z.string().trim().min(3, 'Ingrese su nombre completo').max(120),
  phone,
  vehicleId: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleccione una fecha'),
  preferredSlot: z.enum(['manana', 'tarde']),
  message: optionalText(1000),
  consentPrivacy: z.literal(true, { errorMap: () => ({ message: 'Debe aceptar la declaración de privacidad' }) }),
});

const financingSchema = z.object({
  name: z.string().trim().min(3, 'Ingrese su nombre').max(120),
  contactMethod: z.enum(['whatsapp', 'phone', 'email']),
  contactValue: z.string().trim().min(5, 'Ingrese su medio de contacto').max(190),
  vehicleId: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  vehiclePrice: z.coerce.number().positive().max(1e9).optional().or(z.literal('').transform(() => undefined)),
  downPayment: z.coerce.number().min(0).max(1e9).optional().or(z.literal('').transform(() => undefined)),
  termMonths: z.coerce.number().int().min(6).max(120).optional().or(z.literal('').transform(() => undefined)),
  preferredBank: optionalText(120),
  region: optionalText(80),
  consentContact: z.literal(true, { errorMap: () => ({ message: 'Debe autorizar que le contactemos' }) }),
});

function parse(schema, body, res, req) {
  const r = schema.safeParse(body);
  if (!r.success) {
    const fields = {};
    for (const i of r.error.issues) fields[i.path.join('.')] ??= i.message;
    res.status(422).json({ error: 'Revise los campos marcados.', fields });
    return null;
  }
  if (req && tooFast(req)) {
    res.status(400).json({ error: 'No pudimos validar el envío. Espere unos segundos e inténtelo de nuevo.' });
    return null;
  }
  return r.data;
}

async function validVehicleId(db, id) {
  if (!id) return null;
  const v = await db('vehicles').where({ id, archived: false }).whereNot({ status: 'unpublished' }).first('id');
  return v ? v.id : null;
}

export function publicRouter(db) {
  const r = express.Router();

  r.get('/site', async (req, res) => {
    const b = await getBusiness(db);
    const faqs = await db('faqs').where({ published: true }).orderBy('sort').select('id', 'question', 'answer');
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ business: publicBusiness(b), faqs, privacyVersion: PRIVACY_VERSION });
  });

  r.get('/vehicles', async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(48, Math.max(1, Number(req.query.perPage) || 24));
    const history = req.query.history === '1';
    const base = () => {
      const q = db('vehicles').where({ archived: false });
      if (history) q.where({ status: 'sold', show_in_history: true });
      else {
        const st = [].concat(req.query.status || []).filter((s) => PUBLIC_STATUSES.includes(s));
        q.whereIn('status', st.length ? st : PUBLIC_STATUSES);
      }
      if (req.query.featured === '1') q.where({ featured: true });
      return applyCatalogFilters(q, req.query);
    };
    const [{ count }] = await base().count({ count: '*' });
    const q = base();
    for (const [col, dir] of SORTS[req.query.sort] || SORTS.recent) q.orderBy(col, dir);
    const rows = await q.limit(perPage).offset((page - 1) * perPage);
    const media = await attachMedia(db, rows);
    res.json({ total: Number(count), page, perPage, items: rows.map((v) => serializeVehicle(v, media.get(v.id) || [])) });
  });

  r.get('/vehicles/facets', async (req, res) => {
    const base = () => db('vehicles').where({ archived: false }).whereIn('status', PUBLIC_STATUSES);
    const distinct = async (col) => (await base().distinct(col).whereNotNull(col).orderBy(col)).map((x) => x[col]);
    const [brands, bodies, transmissions, fuels, ranges] = await Promise.all([
      distinct('brand'),
      distinct('body_type'),
      distinct('transmission'),
      distinct('fuel'),
      base().min({ minPrice: 'price', minYear: 'year' }).max({ maxPrice: 'price', maxYear: 'year' }).first(),
    ]);
    res.json({ brands, bodies, transmissions, fuels, ...ranges });
  });

  r.get('/vehicles/:slug', async (req, res) => {
    const v = await db('vehicles').where({ slug: String(req.params.slug), archived: false }).first();
    const visible = v && (PUBLIC_STATUSES.includes(v.status) || (v.status === 'sold' && v.show_in_history));
    if (!visible) return res.status(404).json({ error: 'Vehículo no encontrado' });
    const media = await db('vehicle_media').where({ vehicle_id: v.id }).orderBy('sort');
    const history = await db('vehicle_history').where({ vehicle_id: v.id, public: true }).orderBy('created_at', 'desc').select('field', 'new_value', 'created_at');
    res.json({ vehicle: { ...serializeVehicle(v, media), publicHistory: history } });
  });

  r.post('/leads', limits.forms, antiSpam, async (req, res) => {
    const d = parse(leadSchema, req.body, res, req);
    if (!d) return;
    const [id] = await db('leads').insert({
      kind: d.kind,
      name: d.name,
      phone: d.phone,
      whatsapp: d.whatsapp,
      email: d.email,
      vehicle_id: await validVehicleId(db, d.vehicleId),
      message: d.message,
      country: d.country,
      region: d.region,
      city: d.city,
      consent_privacy: true,
      consent_marketing: !!d.consentMarketing,
      privacy_version: PRIVACY_VERSION,
      source: 'web',
      ip_hash: ipHash(req),
    });
    res.status(201).json({ ok: true, reference: `C-${String(id?.id ?? id).padStart(5, '0')}` });
  });

  r.post('/appointments', limits.forms, antiSpam, async (req, res) => {
    const d = parse(appointmentSchema, req.body, res, req);
    if (!d) return;
    const b = await getBusiness(db);
    const serviceKey = { visit: 'visit', test_drive: 'testDrive', inspection: 'inspection' }[d.type];
    if (!b.services?.[serviceKey]?.enabled) return res.status(409).json({ error: 'Este servicio no está disponible en este momento.' });
    const date = new Date(`${d.preferredDate}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today || date - today > 120 * 86400_000) return res.status(422).json({ error: 'Revise los campos marcados.', fields: { preferredDate: 'Elija una fecha dentro de los próximos 4 meses' } });
    const vehicleId = await validVehicleId(db, d.vehicleId);
    const [leadId] = await db('leads').insert({
      kind: d.type, name: d.name, phone: d.phone, vehicle_id: vehicleId, message: d.message,
      consent_privacy: true, privacy_version: PRIVACY_VERSION, source: 'web-cita', ip_hash: ipHash(req),
    });
    const [id] = await db('appointments').insert({
      lead_id: leadId?.id ?? leadId, vehicle_id: vehicleId, type: d.type, name: d.name, phone: d.phone,
      preferred_date: d.preferredDate, preferred_slot: d.preferredSlot, message: d.message,
    });
    res.status(201).json({ ok: true, reference: `V-${String(id?.id ?? id).padStart(5, '0')}`, status: 'requested' });
  });

  r.post('/financing', limits.forms, antiSpam, async (req, res) => {
    const d = parse(financingSchema, req.body, res, req);
    if (!d) return;
    const b = await getBusiness(db);
    if (!b.services?.financing?.enabled) return res.status(409).json({ error: 'La solicitud de financiamiento no está disponible.' });
    if (d.vehiclePrice && d.downPayment != null && d.downPayment >= d.vehiclePrice) {
      return res.status(422).json({ error: 'Revise los campos marcados.', fields: { downPayment: 'La prima debe ser menor que el precio' } });
    }
    const [id] = await db('financing_requests').insert({
      name: d.name, contact_method: d.contactMethod, contact_value: d.contactValue,
      vehicle_id: await validVehicleId(db, d.vehicleId), vehicle_price: d.vehiclePrice, down_payment: d.downPayment,
      term_months: d.termMonths, currency: b.currency?.code || 'HNL', preferred_bank: d.preferredBank, region: d.region,
      consent_contact: true, privacy_version: PRIVACY_VERSION, ip_hash: ipHash(req),
    });
    res.status(201).json({ ok: true, reference: `F-${String(id?.id ?? id).padStart(5, '0')}` });
  });

  return r;
}
