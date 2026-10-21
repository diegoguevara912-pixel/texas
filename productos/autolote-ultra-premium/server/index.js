import { config } from './config.js';
import { db } from './db/index.js';
import { migrate } from './db/migrate.js';
import { createApp } from './app.js';
import { hashPassword, validatePasswordStrength } from './lib/auth.js';

// Las migraciones se aplican al iniciar: es idempotente y simplifica el despliegue en Hostinger.
await migrate(db);
await db('sessions').where('expires_at', '<', new Date()).del();
await bootstrapOwner();

// Primera cuenta en hosting sin terminal: si no hay usuarios y existen ADMIN_BOOTSTRAP_EMAIL y
// ADMIN_BOOTSTRAP_PASSWORD, se crea la cuenta propietaria una sola vez. Luego borre esas variables.
async function bootstrapOwner() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) return;
  if (await db('users').first('id')) return console.warn('[admin] Ya existen usuarios: elimine ADMIN_BOOTSTRAP_* de las variables de entorno.');
  const weak = validatePasswordStrength(password);
  if (weak) return console.error('[admin] Contraseña inicial rechazada:', weak);
  await db('users').insert({ email, name: 'Propietario', role: 'owner', password_hash: await hashPassword(password) });
  console.log('[admin] Cuenta propietaria creada. Elimine ADMIN_BOOTSTRAP_* de las variables de entorno.');
}

const app = createApp(db);
const server = app.listen(config.port, () => console.log(`API lista en http://localhost:${config.port}`));

const shutdown = () => server.close(() => db.destroy().then(() => process.exit(0)));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
