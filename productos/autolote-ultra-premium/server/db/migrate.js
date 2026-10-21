import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { db } from './index.js';
import { ROOT } from '../config.js';
import { ensureSettings } from '../lib/settings.js';

export async function migrate(knex = db) {
  const [, applied] = await knex.migrate.latest();
  const business = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/business.json'), 'utf8'));
  await ensureSettings(knex, business);
  return applied;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  migrate()
    .then((applied) => {
      console.log(applied.length ? `Migraciones aplicadas: ${applied.join(', ')}` : 'Base de datos al día.');
      return db.destroy();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
