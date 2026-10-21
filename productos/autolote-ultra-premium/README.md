# Autolote Ultra Premium — Showroom digital 3D

Proyecto independiente (no usa Fábrica Web Signature ni Signature Studio).
Sitio público con showroom 3D, catálogo, fichas de vehículo, simulador y formularios, más un panel administrativo privado. Backend Node.js + MySQL, pensado para Hostinger.

## Arranque local (Windows)

```bash
npm install
npm run seed:demo      # opcional: 7 vehículos FICTICIOS marcados DEMO
npm run admin:create   # crea su cuenta propietaria (pide correo y contraseña)
npm run build
npm start              # http://localhost:3001  · panel: http://localhost:3001/admin
```

Desarrollo con recarga: `npm run dev` (web en http://localhost:5173, API en :3001).
Pruebas: `npm test` (35 pruebas). Capturas reales: con el servidor corriendo, `npm run qa:capturas` → `docs/capturas/`.

## Estructura

| Carpeta | Contenido |
|---|---|
| `config/business.json` | Datos iniciales del negocio con marcadores `PENDIENTE`. Después se editan desde el panel. |
| `client/` | React + Vite. `src/three/` showroom 3D (React Three Fiber + Drei), `src/admin/` panel. |
| `server/` | Express: API pública, API admin, sesiones, seguridad, SEO del lado del servidor. |
| `server/db/migrations/` | Migraciones Knex (MySQL en Hostinger, SQLite en local). |
| `shared/finance.js` | Fórmula del simulador (usada por web y pruebas). |
| `docs/` | Dirección artística, verificación de Hostinger, manual, publicación, estado de funciones, capturas. |

## Documentos
- [Dirección artística](docs/DIRECCION-ARTISTICA.md)
- [Verificación de Hostinger](docs/HOSTINGER-VERIFICACION.md)
- [Estado de funciones](docs/ESTADO-DE-FUNCIONES.md)
- [Manual para administrar vehículos](docs/MANUAL-ADMINISTRACION.md)
- [Procedimiento de publicación en Hostinger](docs/PUBLICACION-HOSTINGER.md)
