// Auditoría visual: abre el sitio local en Chrome/Edge sin interfaz y guarda capturas reales.
// Uso: con el servidor corriendo (npm start), ejecutar: node scripts/qa-screens.mjs
// Crea un usuario temporal de QA con contraseña aleatoria y lo elimina al terminar.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright-core';
import { db } from '../server/db/index.js';
import { hashPassword } from '../server/lib/auth.js';

const BASE = process.env.QA_URL || 'http://localhost:3001';
const OUT = path.resolve('docs/capturas');
fs.mkdirSync(OUT, { recursive: true });
const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/opt/pw-browsers/chromium',
].find((p) => fs.existsSync(p));

const qaEmail = `qa-${crypto.randomBytes(4).toString('hex')}@qa.local`;
const qaPass = `Qa${crypto.randomBytes(12).toString('base64url')}9`;
await db('users').insert({ email: qaEmail, name: 'QA temporal', role: 'owner', password_hash: await hashPassword(qaPass) });

const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shoot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  report.push(name);
}

try {
  for (const [label, ctxOpts] of [
    ['escritorio', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
    ['movil', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ]) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await wait(5500);
    await shoot(page, `${label}-01-inicio-hero`);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const stops = label === 'escritorio' ? [0.9, 1.9, 3.2, 4.4, 5.6, 6.8, 8, 9.2] : [1, 2, 3, 4.2, 5.4, 6.6, 7.8, 9];
    let i = 2;
    for (const s of stops) {
      const y = Math.min(h, Math.round(s * ctxOpts.viewport.height));
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await wait(900);
      await shoot(page, `${label}-${String(i++).padStart(2, '0')}-inicio-scroll`);
      if (y >= h - ctxOpts.viewport.height) break;
    }

    await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
    await wait(1200);
    await shoot(page, `${label}-20-catalogo`);
    const first = await page.$('.v-card a.title');
    const href = first ? await first.getAttribute('href') : null;
    if (href) {
      await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' });
      await wait(1000);
      await shoot(page, `${label}-21-ficha-vehiculo`);
      await page.evaluate(() => window.scrollTo(0, 900));
      await wait(700);
      await shoot(page, `${label}-22-ficha-vehiculo-specs`);
    }
    await page.goto(`${BASE}/financiamiento`, { waitUntil: 'networkidle' });
    await wait(1200);
    await shoot(page, `${label}-23-simulador`);
    await page.evaluate(() => document.querySelector('.panel form')?.scrollIntoView());
    await wait(500);
    await shoot(page, `${label}-24-formulario-financiamiento`);
    await page.goto(`${BASE}/contacto`, { waitUntil: 'networkidle' });
    await wait(800);
    await page.click('form button.btn-primary');
    await wait(800);
    await shoot(page, `${label}-25-formulario-validacion`);

    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
    await wait(600);
    await shoot(page, `${label}-30-admin-login`);
    await page.fill('#email', qaEmail);
    await page.fill('#password', qaPass);
    await page.click('button.btn-primary');
    await wait(1500);
    await shoot(page, `${label}-31-admin-resumen`);
    await page.goto(`${BASE}/admin/vehiculos`, { waitUntil: 'networkidle' });
    await wait(1000);
    await shoot(page, `${label}-32-admin-vehiculos`);
    if (label === 'escritorio') {
      await page.click('.tbl a');
      await wait(1500);
      await shoot(page, `${label}-33-admin-editor`);
      await page.goto(`${BASE}/admin/contenido`, { waitUntil: 'networkidle' });
      await wait(1000);
      await shoot(page, `${label}-34-admin-contenido`);
      await page.goto(`${BASE}/admin/clientes`, { waitUntil: 'networkidle' });
      await wait(1000);
      await shoot(page, `${label}-35-admin-clientes`);
    }
    report.push(`${label}: errores de consola = ${errors.length}${errors.length ? '\n  ' + [...new Set(errors)].slice(0, 8).join('\n  ') : ''}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  await db('sessions').whereIn('user_id', db('users').select('id').where({ email: qaEmail })).del();
  await db('users').where({ email: qaEmail }).del();
  await db.destroy();
}
console.log(report.join('\n'));
