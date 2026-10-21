// Crea la cuenta del propietario de forma interactiva (la contraseña no queda en el historial de la terminal).
// Uso: npm run admin:create
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { db } from '../db/index.js';
import { migrate } from '../db/migrate.js';
import { hashPassword, validatePasswordStrength } from '../lib/auth.js';

await migrate(db);
const rl = readline.createInterface({ input: stdin, output: stdout });
const email = (await rl.question('Correo del administrador: ')).trim().toLowerCase();
const name = (await rl.question('Nombre: ')).trim();
const role = ((await rl.question('Rol [owner/admin/sales] (owner): ')).trim() || 'owner');
const password = await rl.question('Contraseña (mín. 12, mayúsculas, minúsculas y números): ');
rl.close();

const weak = validatePasswordStrength(password);
if (!email.includes('@') || !name || !['owner', 'admin', 'sales'].includes(role) || weak) {
  console.error(weak || 'Datos inválidos.');
  process.exit(1);
}
const existing = await db('users').where({ email }).first();
if (existing) {
  await db('users').where({ id: existing.id }).update({ name, role, password_hash: await hashPassword(password), active: true, failed_logins: 0, locked_until: null });
  console.log('Usuario actualizado.');
} else {
  await db('users').insert({ email, name, role, password_hash: await hashPassword(password) });
  console.log('Usuario creado.');
}
await db.destroy();
