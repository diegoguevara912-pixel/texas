# WEBS (repositorio texas) — instrucciones para Claude Code

Monorepo de WEBS, la empresa de soluciones digitales de Diego Guevara (Honduras). Dueño: Diego Guevara.
Diego es principiante técnico: responde en español sencillo, corto y claro. Si una petición tiene un error o un riesgo, dilo.

## Flujo de trabajo (obligatorio)
1. Primero revisa `git status` y `git log origin/main..HEAD --oneline`. Si hay cambios o commits sin subir, detente y avísale a Diego. No los borres ni los mezcles.
2. Solo con todo limpio: `git checkout main && git pull`.
3. Crea una rama nueva con nombre descriptivo que no exista (`git branch -a`). Nunca hagas commit ni push a `main`.
4. Corre las pruebas antes y después de cada cambio (ver abajo). Todas deben pasar.
5. Al terminar: push de la rama, PR y un resumen corto de qué cambió y cuántas pruebas pasan. La unión a `main` la hace Diego.

## Identidad de commits
`Diego Guevara <335656306+diegoguevara912-pixel@users.noreply.github.com>`
Nunca uses ni escribas el correo personal de Diego en el repo (hay una prueba que lo verifica).

## Pruebas
- Repositorio: `npm test` (estructura, enlaces, secretos y datos personales).
- Fábrica: `npm run test:fabrica` (= `python -m unittest discover -s tests` dentro de `productos/fabrica-web-signature`).
- Autolote: `npm run test:autolote` (instala dependencias y corre `vitest`).

## Dónde va cada cosa
- `productos/<producto>/`: código de cada producto. Cada uno tiene su propio README, CLAUDE.md y pruebas; léelos antes de tocarlo.
- `clientes/<slug>/`: un proyecto por cliente, nunca mezclados. La fábrica los encuentra con la variable `FABRICA_CLIENTES` (ver `clientes/README.md`).
- `docs/adr/`: toda decisión importante se registra como ADR numerado. `docs/estado-de-proyectos.md` se actualiza al cerrar un trabajo.
- `CHANGELOG.md`: una línea por cambio visible.

## Reglas que no se rompen
- Nunca publicar en Hostinger, activar GitHub Pages, tocar dominios o DNS, comprar o gastar créditos sin la autorización explícita de Diego.
- No contactar a empresas reales ni presentar como oficial una demo. Toda demo de empresa real lleva el aviso «Propuesta de demostración no oficial» y `noindex`.
- No inventar datos (precios, tasas, testimonios, vehículos, cuentas bancarias, datos de clientes). Lo no confirmado se marca `PENDIENTE` o ficticio.
- Nada de secretos: ni `.env`, ni contraseñas, ni llaves, ni bases de datos (`*.sqlite`, `*.db`), ni datos personales. Solo `.env.example` con valores vacíos.
- Ningún proyecto con base de datos se publica sin seguridad por filas (RLS) o control de acceso equivalente.
- El autolote es independiente: no usa la Fábrica Web Signature ni Signature Studio.
- Cuidar el consumo de tokens: no regenerar sitios completos si basta un cambio localizado.
