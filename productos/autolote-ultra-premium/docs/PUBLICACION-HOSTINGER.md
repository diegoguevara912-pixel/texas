# Procedimiento de publicación en Hostinger

> Nada de esto se ha ejecutado. Cada paso que crea recursos o publica requiere la confirmación explícita de Diego.

## 0. Antes de empezar
- [ ] Confirmar en hPanel que el plan ofrece **Node.js Web App** (ver `HOSTINGER-VERIFICACION.md`).
- [ ] Completar datos del negocio en el panel local o en `config/business.json`.
- [ ] Quitar los vehículos demo: `npm run seed:demo -- --remove`.
- [ ] Decidir dominio. **No se cambian dominios ni DNS sin autorización**; para la vista previa se usa el subdominio temporal que asigna Hostinger.
- [ ] Confirmar la identidad de Git (nombre y correo) antes de subir a GitHub.

## 1. Crear el sitio Node.js (vista previa)
hPanel › Sitios web › Agregar › **Node.js Web App** (o por MCP `hosting_websites_create`, con autorización). Esperar a que la configuración termine.

## 2. Base de datos MySQL
hPanel › Bases de datos › Crear (o MCP `hosting_databases_create`). Anote nombre, usuario y contraseña **fuera del repositorio**.

## 3. Variables de entorno (hPanel › Node.js › Variables, o MCP `hosting_nodejs_replace-environment-variables`)
```
NODE_ENV=production
PUBLIC_URL=https://<subdominio-o-dominio>
DB_CLIENT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=<u123_autolote>
DB_USER=<u123_autolote>
DB_PASSWORD=<contraseña>
APP_SECRET=<64+ caracteres aleatorios>
UPLOAD_DIR=/home/<usuario>/autolote-uploads
ADMIN_BOOTSTRAP_EMAIL=<correo del dueño>
ADMIN_BOOTSTRAP_PASSWORD=<contraseña temporal fuerte>
```
- `UPLOAD_DIR` **fuera** de `public_html`: cada despliegue reemplaza el contenido del sitio y borraría las fotos.
- Tras el primer inicio, borre `ADMIN_BOOTSTRAP_*` y cambie la contraseña desde el panel.
- Genere `APP_SECRET` con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

## 4. Código: dos vías
**A. GitHub (recomendada):** crear repositorio privado, subir el proyecto (sin `.env`, `data/`, `uploads/`), conectar GitHub una vez en hPanel › Git, y elegir el repositorio.
**B. Archivo:** `npm run build`, comprimir el proyecto sin `node_modules`, subirlo (MCP genera la URL de subida) y compilar.

Ajustes de compilación (`hosting_nodejs_start-build`):
| Campo | Valor |
|---|---|
| Versión Node | 22 o 24 |
| Tipo | `express` |
| Directorio raíz | `.` |
| Script de compilación | `build` |
| Archivo de entrada | `server/index.js` |
| Gestor | `npm` |

Las migraciones se aplican solas al iniciar. `better-sqlite3` es opcional: si no compila en el servidor, no afecta (se usa MySQL).

## 5. Verificación de la vista previa
- [ ] `/api/health` responde `{"ok":true}`.
- [ ] Inicio, catálogo, ficha, simulador y formularios cargan; un envío de prueba aparece en el panel.
- [ ] Inicio de sesión del panel y cambio de contraseña.
- [ ] HTTPS activo (Hostinger emite el certificado automáticamente).
- [ ] `sitemap.xml` con el dominio correcto.

## 6. Publicación definitiva (solo con aprobación)
Apuntar el dominio al sitio (cambio de DNS **solo con autorización**), actualizar `PUBLIC_URL`, reiniciar, enviar el sitemap a Search Console.

## 7. Respaldo y mantenimiento
- Copias automáticas de Hostinger + exportación mensual de la base de datos.
- Respaldo de la carpeta `UPLOAD_DIR`.
- Revisar `hosting_nodejs_list-vulnerabilities` periódicamente.
