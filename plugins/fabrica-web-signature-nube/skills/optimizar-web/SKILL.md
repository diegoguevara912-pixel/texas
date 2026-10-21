---
name: optimizar-web
description: "Mejora SEO, rendimiento, accesibilidad y compatibilidad móvil del sitio. Usar con /optimizar-web, \"optimiza la web\", \"SEO\", \"que cargue más rápido\", \"accesibilidad\"."
---

# Optimizar web

Deja el sitio listo para buscadores, teléfonos y todas las personas. Resultado en `entrega/optimizacion.md`.

## SEO
- `<title>` y meta description únicos por página con las palabras clave de `analisis.md`.
- Un `h1` por página, jerarquía de encabezados correcta, URLs legibles.
- Open Graph para compartir en WhatsApp y redes.
- Datos estructurados JSON-LD (`LocalBusiness` con datos reales confirmados; nada inventado).
- `sitemap.xml`, `robots.txt`, `canonical`, favicon.
- Sugerir crear o actualizar el perfil de Google Business (lo hace el cliente).

## Rendimiento
- Imágenes en WebP/AVIF con `srcset`, `loading="lazy"` excepto la primera.
- CSS crítico pequeño, JS diferido, fuentes con `font-display: swap` y solo los pesos usados.
- Objetivo orientativo: LCP < 2.5 s, CLS < 0.1 en móvil. Medir con Lighthouse si hay navegador disponible.

## Accesibilidad
- Contraste AA, `alt` en imágenes, etiquetas en formularios, foco visible, navegación por teclado, `lang="es"`.

## Móvil
- Probar en 360, 768 y 1280 px; botones de al menos 44 px; sin scroll horizontal.

Registrar antes/después de cada métrica medida; si no se pudo medir, decirlo.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
