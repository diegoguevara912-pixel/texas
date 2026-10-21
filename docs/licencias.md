# Licencias de terceros

El código propio de WEBS es © Diego Guevara, todos los derechos reservados. Esto es lo que viene de terceros:

## Bibliotecas incluidas en el repositorio (Fábrica, `design-system/vendor/`)
| Biblioteca | Versión | Licencia |
|---|---|---|
| GSAP (con ScrollTrigger, SplitText, Flip, DrawSVG, MotionPath, CustomEase) | 3.15.0 | Licencia estándar «sin costo» de GSAP/Webflow: uso gratis, también comercial; no se permite usarla en una herramienta que compita con Webflow |
| Lenis | 1.3.26 | MIT (archivo `LICENSE` incluido) |
| three.js | 0.186.1 | MIT (archivo `LICENSE` incluido) |

Las sumas SHA-256 de cada archivo están en `design-system/vendor/MANIFIESTO.json`.

## Dependencias de npm (Autolote, no incluidas: se instalan con `npm install`)
React, React Router, Vite, three.js, React Three Fiber, Drei, Express, Helmet, Knex, mysql2, better-sqlite3, bcryptjs, multer, zod, GSAP y fuentes de Fontsource (Bodoni Moda, Manrope, JetBrains Mono, SIL OFL 1.1). Cada una conserva su licencia; la lista exacta está en `package-lock.json`.

## Fuentes
Todas las del catálogo de la fábrica (`templates/brief/catalogo-fuentes.json`) tienen licencia libre (SIL OFL 1.1 o Apache 2.0). Sonrisa Norte usa Fraunces y Figtree (OFL).

## Fotografías
Las de cada cliente están acreditadas en `clientes/<slug>/recursos/licencias.md` y en la página de créditos del sitio. Las del piloto de Sonrisa Norte son CC0 (Openverse) y están rotuladas como ilustrativas.

## Antes de vender un sitio
Revisar que cada foto, fuente y biblioteca permita uso comercial para ese cliente, y que el vehículo 3D (si se usa un `.glb`) tenga licencia comercial.
