# Módulo 12 · Interacciones premium y funcionalidades inteligentes

## Animación e interactividad

> **Signature 2.0:** usa el motor de movimiento de la fábrica (`16-motor-de-movimiento.md`):
> `sitio/base/motion/` y, si la dirección lo pide, GSAP/Lenis/three.js locales en `sitio/base/vendor/`.
> Ya no hace falta CDN para GSAP. anime.js sigue permitido si un proyecto ya lo usa, sin duplicar con GSAP.
La animación mejora la experiencia o no se usa. Un momento orquestado vale más que efectos
repartidos. Opciones según el concepto:
- Apariciones y transiciones entre secciones, movimiento coordinado con el scroll,
  animación tipográfica, profundidad/parallax moderado, microinteracciones, iconos animados,
  menús animados, gráficos interactivos, 3D y modelos interactivos, narrativa visual,
  transiciones de producto, cursor personalizado solo cuando el concepto lo pide.

Herramientas, de más ligera a más pesada (elegir la mínima suficiente):
1. CSS (transiciones, `@keyframes`, `animation-timeline: view()` con alternativa).
2. JS ligero propio (IntersectionObserver de `base/signature-motion.js`).
3. SVG/Canvas animados. Para 2 o 3 detalles de marca (logo que se dibuja, contadores de datos
   reales, apariciones al hacer scroll) usar **anime.js v4 (licencia MIT)**: copiar solo los módulos
   necesarios a `sitio/assets/js/vendor/` (archivo local, sin CDN), respetar
   `prefers-reduced-motion` y revisar la velocidad en celular. Solo en el camino a medida; nunca en
   el modo ficha ni en código insertado en el constructor de Hostinger.
4. GSAP + ScrollTrigger (CDN con versión exacta) para coreografías complejas.
5. Three.js / WebGL solo si el 3D es el elemento central y hay material adecuado.
6. Skills de AnimatedWebs si están disponibles y conectados.

Reglas: respetar `prefers-reduced-motion` con una versión estática equivalente; no animar
propiedades que causen relayout (usar `transform`/`opacity`); presupuesto móvil de gama media con
datos; nada que impida leer, hacer clic o navegar con teclado.

## Funcionalidades: cada una debe justificar su utilidad
Ejemplos de posibilidades (no obligatorias):
- Inmobiliaria: catálogo con filtros, mapa, solicitud de visita.
- Clínica: agendamiento, especialistas, formularios.
- Constructora: galería de proyectos, cotización preliminar.
- Servicios: evaluador interactivo, solicitud de presupuesto.
- Restaurante: menú interactivo, reservas, pedidos si existe infraestructura.
- Industria: explorador de soluciones, fichas técnicas, simuladores con reglas reales.
- Tienda: catálogo, carrito, pagos e inventario según integraciones disponibles.

Reglas:
- Nada de chatbot por novedad. Nada de calculadora sin reglas válidas del cliente.
- **Nunca** inventar cotizaciones, rendimientos, resultados médicos, indicadores financieros ni
  cálculos técnicos presentados como verificados. Un cotizador sin tarifas reales se convierte en
  "solicitud de cotización".
- Ningún formulario sin funcionamiento se presenta como terminado. Si necesita backend, base de
  datos, API o integración, impleméntalo o documenta exactamente qué falta en `ESTADO`.
- Datos de catálogos en `assets/data/*.json` para que el cliente/Diego los actualice sin tocar código.
- Lo que sea demostración se rotula como tal en la propia interfaz.
