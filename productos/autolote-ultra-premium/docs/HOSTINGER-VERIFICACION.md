# Verificación de Hostinger (solo lectura) — 20/10/2026

Todas las consultas se hicieron con el MCP de Hostinger conectado a Claude Code. No se creó, compró, publicó ni modificó nada.

| Punto | Resultado verificado | Fuente |
|---|---|---|
| 1. MCP conectado | Sí. Responde con la cuenta de Diego. | llamadas `hosting_orders_list`, `hosting_websites_list` |
| 2. Herramientas disponibles | Hosting (sitios, Node.js: compilar, desplegar, variables de entorno, registros), bases de datos MySQL, Git, archivos, dominios, DNS, correo, WordPress, Horizons. | búsqueda de operaciones del MCP |
| 3. Plan | Pedido activo `1010203015`, plan interno **`hostinger_unlimited_v6`**, creado el 17/10/2026. | `hosting_orders_list` |
| Sitios existentes | **0** sitios, **0** sitios Horizons, sin plan Agency. | `hosting_websites_list`, `horizons_websites_list`, `agency-hosting_orders_list` |
| 4. Node.js | **No confirmado.** La propia documentación de la API indica que las funciones Node.js están "disponibles en planes Business y Cloud". El nombre `hostinger_unlimited_v6` no figura en la oferta actual de Hostinger, así que no puedo afirmar si incluye "Node.js Web App" sin crear un sitio. | descripción de `hosting_nodejs_list-vulnerabilities`; búsqueda web de planes |
| 5. MySQL | La API permite crear bases de datos (`hosting_databases_create`), pero requiere que exista un sitio. Desde la app se conecta por `127.0.0.1:3306`. | instrucciones del MCP |
| 6. Despliegue | Dos vías oficiales: **Git** (conectar GitHub una vez en hPanel; hoy hay **0** instalaciones Git) o **archivo comprimido** subido y compilado con `hosting_nodejs_start-build`. | `hosting_git_list-installations`, `hosting_nodejs_start-build` |
| 7. Recursos | Centros de datos disponibles para el pedido (EE. UU. Boston, Carolina del Norte y Arizona; Brasil; Europa; Asia). Para Honduras, el más cercano es EE. UU. La API no expone cuotas de disco/CPU para este tipo de plan. | `hosting_datacenters_list` |
| 8. Imágenes con IA | La única generación de imágenes del MCP es `wordpress_ai-content_generate-images` y **exige una instalación de WordPress**. No hay herramienta para AI Builder/Horizons por MCP ni consulta de créditos. No se consumió ningún crédito. | búsqueda de operaciones |

## Qué necesito que usted confirme en hPanel (2 minutos)
1. **Sitios web › Agregar sitio web**: ¿aparece la opción **"Node.js Web App"**? Si aparece, el plan es compatible y seguimos con Hostinger tal como está diseñado.
2. Si **no** aparece, hay una limitación real del plan. Opciones (requieren su decisión, no se hará nada sin autorización): cambiar a un plan con Node.js (Business/Cloud) o que yo adapte el backend a PHP + MySQL, que sí corre en hosting compartido.

## Imágenes con IA: proceso propuesto
- Recomendado: fotografías reales de cada unidad (obligatorio para el inventario).
- Para fondos y marca: el AI Builder de Hostinger desde hPanel (manual), exportar las imágenes y subirlas por el panel del sitio (Contenido o Vehículos). No se pueden generar desde Claude Code sin crear un WordPress.
