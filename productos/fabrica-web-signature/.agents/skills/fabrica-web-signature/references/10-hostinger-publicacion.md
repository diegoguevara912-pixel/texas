# Módulo 20 · Publicación mediante Hostinger

**Prohibición absoluta:** no publicar, eliminar, reemplazar, transferir ni modificar sitios,
dominios, DNS o archivos de producción sin autorización explícita de Diego. No comprar dominios, ni
contratar planes, ni activar servicios de pago sin aprobación.

## Cuatro niveles, siempre distintos
1. **Desarrollo local** — archivos, código, recursos y pruebas en `clients/<slug>/`.
2. **Vista previa** — revisión local (Studio o `vista-previa`) o una vista privada; nunca en el
   dominio del cliente.
3. **Preparación de producción** — `python core/fabrica.py preparar-produccion <slug> --dominio https://…`
   (exige aprobación registrada y QA sin fallos críticos ni `[PENDIENTE]`; genera zip, manifiesto
   con sha256 y `entrega/deploy/CHECKLIST-PUBLICACION.md`). No publica.
4. **Publicación** — operación sobre Hostinger, solo con confirmación explícita.

## Conexión
- En las sesiones de Claude (app y nube) la conexión es el **conector "Hostinger" de claude.ai**.
  Sus herramientas son `search` (buscar operaciones), `execute` y `multi-execute`. Si aparecen en tus
  herramientas, está conectado.
- Alternativa en Claude Code por terminal: `claude mcp add --transport http hostinger https://mcp.hostinger.com`
  (pide iniciar sesión por OAuth en el navegador; lo hace Diego).
- Nunca guardar tokens o contraseñas en el proyecto.

## Compatibilidad
- Sitios estáticos (lo que produce la fábrica por defecto): cualquier plan web/cloud de Hostinger.
- Node.js (Astro SSR, Next.js): solo planes con Node.js (`hosting_nodejs_*`); confirmar antes.
- WordPress: no usar este flujo.
- Agency Plan: operaciones `agency-hosting_*` (otro flujo de subida).

## Procedimiento de publicación (cuando Diego aprueba)
1. **Comprobar destino** (solo lectura): buscar con `search` "list websites" y ejecutar la operación
   de listado para encontrar `username` y `domain`. Confirmar con Diego que es el sitio correcto.
2. **Tipo de alojamiento**: verificar el plan y que admite el tipo de proyecto.
3. **Pruebas + preparación**: `preparar-produccion` (si no se hizo ya con la versión actual).
4. **Respaldo**: listar los archivos actuales (`hosting_files_list-website-and-directories`) y
   respaldar lo existente (descarga desde hPanel por Diego o lectura de archivos clave).
5. **Pedir confirmación** con un resumen: dominio, versión, qué se reemplaza, cómo volver atrás.
   Esperar un "sí" explícito del tipo "Autorizo publicar <slug> v<n> en <dominio>".
6. **Publicar**:
   a. `hosting_files_generate-upload-url` (username, domain) → `url`, `auth_key`, `rest_auth_key`.
   b. Subir el zip con `curl.exe` (protocolo TUS): POST con `Upload-Length` y luego PATCH con
      `--data-binary @archivo.zip` (los comandos exactos están en la descripción de la operación).
      No imprimir ni guardar las claves temporales.
   c. `hosting_websites_deploy-static-site-archive` (username, domain, archive_path) —
      **reemplaza el contenido del sitio**.
   d. Las operaciones son asíncronas: consultar el estado hasta terminar; no reenviar la escritura.
7. **Comprobar** el dominio: HTTPS, páginas, WhatsApp, formularios, móvil, `robots.txt`.
8. **Registrar**: `python core/fabrica.py registrar-publicacion <slug> --dominio … --aprobado "<frase de Diego>"`.
9. **Reversión**: desplegar el zip de la versión anterior (en `entrega/deploy/`) con el mismo
   procedimiento; anotarlo en el historial.

Sin conector: guiar a Diego para subir el zip en hPanel → Administrador de archivos → `public_html/`
→ Extraer, y luego registrar la publicación igual.
