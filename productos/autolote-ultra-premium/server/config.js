import 'dotenv/config';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const env = process.env;
export const isProd = env.NODE_ENV === 'production';

let secret = env.APP_SECRET;
if (!secret || secret.length < 32) {
  if (isProd) throw new Error('APP_SECRET es obligatorio en producción (64+ caracteres aleatorios).');
  // Solo desarrollo: secreto efímero, las sesiones se invalidan al reiniciar.
  secret = crypto.randomBytes(48).toString('hex');
}

export const config = {
  port: Number(env.PORT || 3001),
  publicUrl: (env.PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, ''),
  secret,
  uploadDir: path.resolve(ROOT, env.UPLOAD_DIR || 'uploads'),
  uploadMaxMb: Number(env.UPLOAD_MAX_MB || 8),
  db:
    (env.DB_CLIENT || 'sqlite') === 'mysql'
      ? {
          client: 'mysql2',
          connection: {
            host: env.DB_HOST || '127.0.0.1',
            port: Number(env.DB_PORT || 3306),
            database: env.DB_NAME,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            charset: 'utf8mb4',
          },
          pool: { min: 0, max: 5 },
        }
      : {
          client: 'better-sqlite3',
          connection: { filename: path.resolve(ROOT, env.SQLITE_FILE || 'data/autolote.sqlite') },
          useNullAsDefault: true,
        },
};
