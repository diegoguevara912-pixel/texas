---
name: interacciones-premium
description: "Añade animaciones, efectos 3D y funcionalidades especiales al sitio cuando aportan al concepto. Usar con /interacciones-premium, \"agrega animaciones\", \"efecto 3D\", \"hazlo más premium\"."
---

# Interacciones premium

Añade un momento interactivo memorable sin perjudicar rendimiento ni accesibilidad.

## Criterio
- Un solo momento orquestado (una entrada de página, un reveal, una escena 3D) vale más que efectos repartidos en cada sección.
- Toda animación responde al concepto o a una acción del visitante; nada decorativo por defecto.
- Respetar `prefers-reduced-motion` con una versión estática equivalente.
- Presupuesto: el sitio debe seguir cargando rápido en un teléfono de gama media con datos móviles.

## Opciones, de más ligera a más pesada
1. CSS puro: transiciones, `@keyframes`, scroll-driven animations donde haya soporte.
2. JavaScript ligero: IntersectionObserver para revelar, contador, comparador, filtro de catálogo.
3. Librerías por CDN con versión fija: GSAP, Lenis, Three.js (solo si el 3D es el elemento central).
4. Skills de AnimatedWebs si están disponibles y conectados (héroe con video, componentes animados).

## Pasos
1. Proponer a Diego 1–3 interacciones con su impacto en peso y rendimiento.
2. Implementar la elegida en `sitio/assets/js/` y probar con `/vista-previa` en móvil y escritorio.
3. Medir que la página sigue cumpliendo los objetivos de `/optimizar-web`.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
