import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

export const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

// La IP nunca se guarda en claro: solo un hash con secreto (sirve para límites y abuso).
export const ipHash = (req) => crypto.createHmac('sha256', config.secret).update(req.ip || '').digest('hex');

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const limiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message },
  });

export const limits = {
  api: limiter(60_000, 240, 'Demasiadas solicitudes. Intente de nuevo en un minuto.'),
  forms: limiter(15 * 60_000, 12, 'Ha enviado varias solicitudes seguidas. Intente más tarde o escríbanos por WhatsApp.'),
  login: limiter(15 * 60_000, 10, 'Demasiados intentos de inicio de sesión. Espere 15 minutos.'),
};

// Formularios públicos: campo trampa invisible (se responde OK sin guardar nada).
export function antiSpam(req, res, next) {
  if (req.body?.website) return res.status(200).json({ ok: true, reference: 'C-00000' });
  next();
}

// Tiempo mínimo de llenado: se evalúa después de validar, para que una persona
// que envía el formulario vacío vea los campos marcados y no un error genérico.
export function tooFast(req) {
  const elapsed = Date.now() - Number(req.body?.startedAt || 0);
  return !Number.isFinite(elapsed) || elapsed < 2500;
}

// Peticiones que cambian estado deben venir del propio sitio.
export function sameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin') || req.get('referer');
  if (!origin) return res.status(403).json({ error: 'Origen no permitido' });
  try {
    const o = new URL(origin);
    const allowed = new URL(config.publicUrl);
    const host = req.get('host');
    if (o.host === allowed.host || o.host === host) return next();
  } catch {
    /* cae al rechazo */
  }
  return res.status(403).json({ error: 'Origen no permitido' });
}
