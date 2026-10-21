// Pruebas del repositorio: estructura de empresa, enlaces de la portada y que no se suban
// secretos, bases de datos ni datos personales. Sin dependencias: node --test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const IGNORAR = new Set(['.git', 'node_modules', 'dist', '__pycache__', '.venv']);
const TEXTO = new Set(['.md', '.js', '.mjs', '.jsx', '.json', '.html', '.css', '.py', '.ps1', '.cmd', '.yml', '.yaml', '.txt', '.svg', '.example', '.jsonl', '']);

function archivos(dir = RAIZ, lista = []) {
  for (const nombre of readdirSync(dir)) {
    if (IGNORAR.has(nombre)) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) archivos(ruta, lista);
    else lista.push(relative(RAIZ, ruta).split('\\').join('/'));
  }
  return lista;
}
const TODOS = archivos();
const deTexto = TODOS.filter((f) => TEXTO.has(extname(f)) && !f.includes('/vendor/') && !f.endsWith('package-lock.json'));
const leer = (f) => readFileSync(join(RAIZ, f), 'utf8');

test('tiene los archivos de una empresa establecida', () => {
  for (const f of ['README.md', 'CLAUDE.md', 'AGENTS.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md',
    'index.html', 'privacidad/index.html', 'docs/README.md', 'docs/estado-de-proyectos.md', 'docs/licencias.md',
    '.gitignore', '.github/workflows/pruebas.yml', '.github/pull_request_template.md', 'clientes/README.md']) {
    assert.ok(existsSync(join(RAIZ, f)), `falta ${f}`);
  }
});

test('cada producto tiene README, instrucciones para Claude y pruebas', () => {
  for (const p of readdirSync(join(RAIZ, 'productos'))) {
    for (const f of ['README.md', 'tests']) assert.ok(existsSync(join(RAIZ, 'productos', p, f)), `productos/${p} sin ${f}`);
  }
  assert.ok(existsSync(join(RAIZ, 'productos/fabrica-web-signature/CLAUDE.md')));
});

test('los ADR están numerados sin huecos', () => {
  const adr = readdirSync(join(RAIZ, 'docs/adr')).filter((f) => f.endsWith('.md')).sort();
  adr.forEach((f, i) => assert.ok(f.startsWith(String(i + 1).padStart(4, '0') + '-'), `ADR fuera de orden: ${f}`));
});

test('no hay archivos de secretos, bases de datos ni subidas', () => {
  const prohibidos = TODOS.filter((f) =>
    /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example') ||
    /\.(sqlite3?|db|pem|key)$/.test(f) ||
    /(^|\/)uploads\/(?!\.gitkeep$)/.test(f) ||
    /productos\/fabrica-web-signature\/clients\//.test(f) ||
    /(^|\/)motor\/2\d{7}-/.test(f));
  assert.deepEqual(prohibidos, []);
});

test('.env.example no trae valores secretos', () => {
  for (const f of TODOS.filter((x) => x.endsWith('.env.example'))) {
    for (const linea of leer(f).split('\n')) {
      const m = linea.match(/^(\w*(SECRET|PASSWORD|TOKEN|KEY)\w*)=(.*)$/);
      if (m) assert.equal(m[3].trim(), '', `${f}: ${m[1]} debe ir vacío`);
    }
  }
});

test('no hay claves ni tokens escritos en el código', () => {
  const patrones = [
    /sk-(ant|proj|live)?-?[A-Za-z0-9_-]{24,}/, /ghp_[A-Za-z0-9]{30,}/, /github_pat_[A-Za-z0-9_]{30,}/,
    /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/, /service_role/,
  ];
  const hallazgos = [];
  for (const f of deTexto) {
    if (f === 'tests/repositorio.test.js' || f.endsWith('SECURITY.md') || f.endsWith('CLAUDE.md')) continue;
    const t = leer(f);
    for (const p of patrones) if (p.test(t)) hallazgos.push(`${f}: ${p}`);
  }
  assert.deepEqual(hallazgos, []);
});

test('no aparece el correo personal de Diego ni rutas de su equipo', () => {
  const personal = ['diegoguevara912' + '@', 'cristhianj' + '.hernandez'];
  const hallazgos = deTexto.filter((f) => f !== 'tests/repositorio.test.js' && personal.some((p) => leer(f).includes(p)));
  assert.deepEqual(hallazgos, []);
});

test('los enlaces e imágenes de la portada y de los README existen', () => {
  const rotos = [];
  const revisar = (f, enlaces) => {
    for (const e of enlaces) {
      if (/^(https?:|mailto:|#)/.test(e)) continue;
      const destino = join(RAIZ, dirname(f), decodeURIComponent(e.split('#')[0]));
      if (!existsSync(destino)) rotos.push(`${f} → ${e}`);
    }
  };
  for (const f of ['index.html', 'privacidad/index.html']) {
    revisar(f, [...leer(f).matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]));
  }
  for (const f of ['README.md', 'docs/README.md', 'clientes/README.md', 'docs/adr/0001-monorepo.md']) {
    revisar(f, [...leer(f).matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]));
  }
  assert.deepEqual(rotos, []);
});

test('las demos de empresas reales llevan aviso y noindex', () => {
  // Hoy solo hay clientes ficticios. Si se agrega una demo de una empresa real, su index.html
  // debe decir «Propuesta de demostración no oficial» y tener noindex.
  for (const c of readdirSync(join(RAIZ, 'clientes')).filter((d) => statSync(join(RAIZ, 'clientes', d)).isDirectory())) {
    const brief = join(RAIZ, 'clientes', c, 'brief.md');
    if (!existsSync(brief) || /FICTICI/i.test(readFileSync(brief, 'utf8'))) continue;
    const index = readFileSync(join(RAIZ, 'clientes', c, 'sitio', 'index.html'), 'utf8');
    assert.match(index, /noindex/, `${c} sin noindex`);
    assert.match(index, /demostraci[oó]n no oficial/i, `${c} sin aviso de demo no oficial`);
  }
});

test('la portada no carga nada de terceros', () => {
  const t = leer('index.html');
  assert.doesNotMatch(t, /<(script|link)[^>]+(src|href)="https?:/);
  assert.match(t, /Content-Security-Policy/);
});
