# Bibliotecas locales de animación (sin CDN)

Descargadas el 2026-10-18 desde el registro oficial de npm (`npm pack`) en versiones con más de dos
semanas de publicadas. Las huellas sha256 de cada archivo están en `MANIFIESTO.json`.
El motor las copia a `sitio/base/vendor/` **solo si el sitio las usa** (se decide en la dirección).

| Biblioteca | Versión | Licencia | Para qué | Peso aprox. |
|---|---|---|---|---|
| GSAP (núcleo, ScrollTrigger, SplitText, Flip, DrawSVG, CustomEase, MotionPath) | 3.15.0 | GSAP Standard "No Charge" License (gratis también para uso comercial; prohíbe usarla dentro de una herramienta visual sin código que compita con Webflow, que no es nuestro caso: se usa en sitios de clientes) — https://gsap.com/standard-license | Coreografías complejas, escenas fijadas con scroll, texto dividido | 196 KB todo; normalmente 70–110 KB |
| Lenis | 1.3.26 | MIT | Desplazamiento suave (solo si el concepto lo pide; nunca con movimiento reducido) | 19 KB |
| three.js (`three.module.js` + `three.core.js`) | 0.186.1 | MIT | Escenas 3D/WebGL cuando el 3D es el elemento central | 2 MB sin comprimir (≈450 KB con gzip) |

Orden de preferencia (de más ligero a más pesado):
1. CSS + `design-system/motion/signature-motion.js` (propio, sin dependencias, 0 descargas) — cubre
   revelados, texto por líneas/palabras, máscaras, parallax, escenas por progreso de scroll, trazos SVG,
   contadores, botones magnéticos, cambio de fondo por sección y transiciones entre páginas.
2. GSAP + ScrollTrigger cuando la coreografía necesita líneas de tiempo encadenadas.
3. three.js solo para 3D real; siempre con imagen de respaldo y desactivado en equipos modestos.
anime.js v4 (MIT) sigue permitido para 2–3 detalles si ya está en un proyecto; no se duplica con GSAP
en el mismo sitio.
