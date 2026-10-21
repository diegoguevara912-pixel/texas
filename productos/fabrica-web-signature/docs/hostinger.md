# Hostinger: integración preparada

## Estado comprobado (14/10/2026)
- El **conector "Hostinger" de claude.ai está conectado** en las sesiones de Claude de Diego: sus
  herramientas `search`, `execute` y `multi-execute` responden. Se consultó solo el catálogo de
  operaciones (sin leer datos de la cuenta).
- Operaciones disponibles relevantes, confirmadas en el catálogo:
  - `hosting_files_list-website-and-directories` (lectura) — ver archivos del sitio.
  - `hosting_files_website-content` (lectura) — leer un archivo.
  - `hosting_files_generate-upload-url` — credenciales temporales para subir un archivo (TUS).
  - `hosting_websites_deploy-static-site-archive` — **destructiva**: reemplaza el contenido del sitio con un zip.
  - `hosting_git_deploy-website-repository` — desplegar desde un repositorio (alternativa futura).
  - `hosting_websites_create` — crear un sitio en un plan (no se usa sin permiso).
- **Pendiente con tu permiso:** leer tu cuenta (planes, sitios, dominios) para confirmar el plan y la
  compatibilidad. Es solo lectura, pero es acceso a tu cuenta, por eso se pide antes.
- El plugin oficial **Hostinger Connector** para Claude Code no está instalado como plugin local; no
  hace falta mientras el conector de claude.ai funcione.

## Otra forma de conectar (Claude Code por terminal)
```
claude mcp add --transport http hostinger https://mcp.hostinger.com
```
Abre un inicio de sesión de Hostinger en el navegador (OAuth); lo completas tú. No se guardan
credenciales en la fábrica.

## Compatibilidad
| Proyecto | Plan necesario |
|---|---|
| Sitio estático (por defecto) | Cualquier plan web o cloud |
| Formulario PHP | Cualquier plan web (PHP incluido) |
| Node.js / Next.js / Astro SSR | Planes con Node.js (Business o Cloud); confirmar antes |
| WordPress | No usar este flujo |

## Flujo de publicación
1. Desarrollo local → 2. Vista previa → 3. `preparar-produccion` (zip + checklist) →
4. Publicación con confirmación explícita. Paso a paso completo en
`.claude/skills/fabrica-web-signature/references/10-hostinger-publicacion.md`.

**Nunca** sin tu autorización: publicar, reemplazar o borrar archivos, tocar dominios o DNS,
comprar dominios o planes, activar servicios de pago.

## Reversión
Cada versión preparada queda en `clients/<id>/entrega/deploy/` y cada estado de `sitio/` en
`respaldos/`. Volver atrás = desplegar el zip anterior con el mismo procedimiento.
