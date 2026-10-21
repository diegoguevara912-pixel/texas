# Estado de funciones — versión 0.1 (20/10/2026)

**Completo** = implementado y verificado (prueba automática o captura real).
**Necesita información** = funciona, pero muestra marcadores hasta que el negocio dé datos.
**Necesita integración/autorización** = la arquitectura existe; falta un proveedor, una decisión o un permiso.

| # | Entregable | Estado | Notas |
|---|---|---|---|
| 1 | Proyecto web funcional | Completo | `npm start` sirve sitio + API. 35 pruebas pasan. |
| 2 | Identidad visual | Completo (v1) | Concepto "Atelier Nocturno", tokens con contraste verificado. Logotipo: necesita información. |
| 3 | Hero cinematográfico | Completo | Intro de cámara 2.6 s una vez por sesión, titular animado, respeta movimiento reducido. |
| 4 | Experiencia 3D | Completo (v1) | Vehículo conceptual hecho por código, rotar/acercar, 5 vistas, 4 puntos informativos, carga diferida, imagen alternativa sin WebGL, pausa fuera de pantalla. El modelo es estilizado: para realismo de agencia se necesita un `.glb` con licencia comercial. |
| 5 | Catálogo dinámico | Completo | Filtros (marca, tipo, precio, año, transmisión, combustible, disponibilidad), búsqueda, orden, comparador de 3, galería de vendidos opcional. |
| 6 | Página de vehículo | Completo | Galería con ampliación, ficha técnica, equipamiento, video, simulador con su precio, WhatsApp con mensaje prellenado, cotización, cita, compartir. Visor 3D si se sube un `.glb`. Vista 360°: necesita integración (fotos en secuencia). |
| 7 | Formularios de clientes | Completo | Validación cliente+servidor, anti-spam (campo trampa + tiempo mínimo + límite por IP), consentimiento, referencia de recepción. Envío de aviso por correo/WhatsApp al dueño: necesita integración. |
| 8 | Ubicación opcional | Completo | País/departamento/ciudad opcionales; nunca GPS. |
| 9 | Solicitud de financiamiento | Completo | Sin datos bancarios sensibles. Bancos aliados: necesita información. |
| 10 | Simulador configurable | Completo | Fórmula verificada con valores de referencia (PMT). Modos: deshabilitado, ilustrativo (actual, 12 % de ejemplo rotulado), tasa autorizada. |
| 11 | Solicitudes y reservas | Completo (citas) / Arquitectura (reservas) | Citas con estados y confirmación. Tabla de reservas con estados de pago; flujo público de reserva no activado. |
| 12 | Pagos seguros | Necesita integración y autorización | Escenario A (transferencias) configurable solo con cuentas marcadas como verificadas. Escenario B (pasarela) sin proveedor elegido; nunca se guardan tarjetas. |
| 13 | Panel protegido | Completo | Sesiones con cookie httpOnly, CSRF, bloqueo tras 5 intentos, roles propietario/administrador/ventas, registro de acciones, sesiones activas. |
| 14 | Base de datos compatible | Completo | Migraciones Knex para MySQL; probado en SQLite local. Conexión real a MySQL de Hostinger: pendiente de autorización. |
| 15 | WhatsApp | Necesita información | Botón flotante, barra móvil y por vehículo; se activan al configurar el número. |
| 16 | Animaciones | Completo | GSAP + ScrollTrigger: intro, revelado de texto por scroll, galería horizontal anclada, contadores del simulador. |
| 17 | Móvil | Completo | Barra inferior de pulgar, filtros en panel, 3D adaptativo (menos resolución en gama media), capturas verificadas a 390 px. |
| 18 | SEO | Completo | Títulos/descripciones/Open Graph y JSON-LD por página desde el servidor, URLs legibles, sitemap.xml, robots.txt. GA4/Meta Pixel: preparados, apagados hasta tener consentimiento. |
| 19 | Pruebas | Completo | `npm test`: fórmula, contraste WCAG, API pública, permisos, CSRF, bloqueo, inyección SQL, archivos falsos, CSV. |
| 20 | Capturas verificadas | Completo | `docs/capturas/` (escritorio y móvil) generadas con Chrome real. |
| 21 | Manual | Completo | `docs/MANUAL-ADMINISTRACION.md`. |
| 22 | Publicación Hostinger | Preparado, no ejecutado | Ver `docs/PUBLICACION-HOSTINGER.md`. Requiere confirmar Node.js en el plan y su autorización. |

## Limitaciones conocidas
- El paquete 3D pesa ~360 kB comprimido; se carga después del contenido y solo si el dispositivo lo soporta.
- La declaración de privacidad es un borrador base: debe revisarla el negocio (idealmente un asesor legal en Honduras).
- Los vehículos DEMO y sus precios son ficticios; deben eliminarse antes de publicar (`npm run seed:demo -- --remove`).
- No hay correo/WhatsApp automático al recibir solicitudes (requiere proveedor: SMTP de Hostinger o WhatsApp Business API).
