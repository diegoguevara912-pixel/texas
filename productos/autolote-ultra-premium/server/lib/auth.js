import bcrypt from 'bcryptjs';
import { isProd } from '../config.js';
import { ipHash, randomToken, safeEqual, sha256 } from './security.js';
import { audit } from './audit.js';

const COOKIE = isProd ? '__Host-al_session' : 'al_session';
const SESSION_HOURS = 8;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const DUMMY_HASH = bcrypt.hashSync(randomToken(), 12);

export const ROLES = {
  owner: ['*'],
  admin: ['vehicles', 'leads', 'appointments', 'financing', 'content', 'audit', 'reservations'],
  sales: ['vehicles:read', 'leads', 'appointments', 'financing'],
};

export function can(user, perm) {
  const granted = ROLES[user?.role] || [];
  if (granted.includes('*')) return true;
  const [area, action] = perm.split(':');
  return granted.includes(area) || (action === 'read' && granted.includes(`${area}:read`));
}

export const hashPassword = (pw) => bcrypt.hash(pw, 12);

export function validatePasswordStrength(pw) {
  if (typeof pw !== 'string' || pw.length < 12) return 'La contraseña debe tener al menos 12 caracteres.';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return 'Use mayúsculas, minúsculas y números.';
  return null;
}

export function authRoutes(router, db) {
  router.post('/login', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const generic = { error: 'Correo o contraseña incorrectos.' };
    const user = await db('users').where({ email }).first();
    if (!user || !user.active) {
      await bcrypt.compare(password, DUMMY_HASH); // mismo costo que un usuario real
      return res.status(401).json(generic);
    }
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ error: 'Cuenta bloqueada temporalmente por intentos fallidos. Intente más tarde.' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const failed = user.failed_logins + 1;
      await db('users').where({ id: user.id }).update({
        failed_logins: failed,
        locked_until: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      });
      await audit(db, req, 'login_failed', 'user', user.id, null, null);
      return res.status(401).json(generic);
    }
    const token = randomToken();
    const csrf = randomToken(24);
    await db('sessions').insert({
      id: sha256(token),
      user_id: user.id,
      csrf,
      ip_hash: ipHash(req),
      user_agent: String(req.get('user-agent') || '').slice(0, 250),
      expires_at: new Date(Date.now() + SESSION_HOURS * 3600_000),
    });
    await db('users').where({ id: user.id }).update({ failed_logins: 0, locked_until: null, last_login_at: new Date() });
    await audit(db, req, 'login', 'user', user.id, null, user.id);
    res.cookie(COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_HOURS * 3600_000,
    });
    res.json({ user: publicUser(user), csrf });
  });

  router.post('/logout', requireAuth(db), async (req, res) => {
    await db('sessions').where({ id: req.sessionId }).del();
    await audit(db, req, 'logout', 'user', req.user.id, null, req.user.id);
    res.clearCookie(COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  router.get('/me', requireAuth(db), (req, res) => res.json({ user: publicUser(req.user), csrf: req.csrf }));
}

export const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role });

export function requireAuth(db) {
  return async (req, res, next) => {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'Sesión requerida' });
    const id = sha256(token);
    const session = await db('sessions').where({ id }).first();
    if (!session || new Date(session.expires_at) < new Date()) {
      if (session) await db('sessions').where({ id }).del();
      return res.status(401).json({ error: 'Sesión expirada' });
    }
    const user = await db('users').where({ id: session.user_id }).first();
    if (!user || !user.active) return res.status(401).json({ error: 'Sesión inválida' });
    // Protección CSRF: toda petición que modifica datos debe enviar el token de la sesión.
    if (!['GET', 'HEAD'].includes(req.method) && !safeEqual(req.get('x-csrf-token') || '', session.csrf)) {
      return res.status(403).json({ error: 'Token de seguridad inválido. Recargue la página.' });
    }
    req.user = user;
    req.sessionId = id;
    req.csrf = session.csrf;
    next();
  };
}

export function requirePerm(perm) {
  return (req, res, next) => (can(req.user, perm) ? next() : res.status(403).json({ error: 'No tiene permiso para esta acción' }));
}
