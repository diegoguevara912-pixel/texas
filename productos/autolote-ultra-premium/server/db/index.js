import fs from 'node:fs';
import path from 'node:path';
import knexFactory from 'knex';
import { config, ROOT } from '../config.js';

export function createDb(overrides) {
  const cfg = { ...config.db, ...overrides };
  if (cfg.client === 'better-sqlite3' && cfg.connection.filename !== ':memory:') {
    fs.mkdirSync(path.dirname(cfg.connection.filename), { recursive: true });
  }
  return knexFactory({
    ...cfg,
    migrations: { directory: path.join(ROOT, 'server/db/migrations'), loadExtensions: ['.js'] },
  });
}

export const db = createDb();

// Columnas JSON guardadas como texto para que funcione igual en MySQL y SQLite.
export const toJson = (v) => (v === undefined ? undefined : JSON.stringify(v ?? null));
export const fromJson = (v, fallback = null) => {
  if (v == null || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};
