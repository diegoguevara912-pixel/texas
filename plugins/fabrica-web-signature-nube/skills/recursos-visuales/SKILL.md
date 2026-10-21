---
name: recursos-visuales
description: "Gestiona imágenes, ilustraciones, íconos y fuentes del sitio con licencias autorizadas. Usar con /recursos-visuales, \"busca imágenes\", \"optimiza las fotos\", \"recursos con licencia\"."
---

# Recursos visuales

Reúne y prepara los recursos del sitio y deja constancia de su licencia en `recursos/licencias.md`.

## Fuentes permitidas, por prioridad
1. Material propio del cliente (fotos, logo) con su autorización.
2. Bancos con licencia libre de uso comercial: Unsplash, Pexels, Pixabay; íconos Lucide, Heroicons, Tabler; fuentes Google Fonts.
3. Imágenes generadas con IA, solo si Diego lo aprueba y nunca para simular productos, personas o lugares reales del cliente.

## Pasos
1. Listar los recursos que el diseño necesita (hero, productos, equipo, fondos, íconos).
2. Para cada uno, anotar en `licencias.md`: archivo, fuente, URL, autor, licencia, fecha.
3. Optimizar: convertir a WebP/AVIF, generar tamaños responsivos (por ejemplo 480/960/1600 px), comprimir, nombres descriptivos en minúsculas. Añadir `alt` descriptivo en español.
4. Guardar en `sitio/assets/img/`.
5. No usar imágenes de Google Imágenes, de competidores ni con marca de agua. No presentar fotos de banco como si fueran del negocio sin decirlo al cliente.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
