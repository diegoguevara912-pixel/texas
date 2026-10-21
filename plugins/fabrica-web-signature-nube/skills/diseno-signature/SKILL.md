---
name: diseno-signature
description: "Desarrolla una identidad visual exclusiva y un sistema de diseño a partir del concepto elegido. Usar con /diseno-signature, \"diseña la identidad\", \"sistema de diseño\", \"paleta y tipografías\"."
---

# Diseño signature

Convierte el concepto elegido en un sistema de diseño concreto: `diseno/sistema.md` y `diseno/tokens.css`.

## Antes de empezar
- Cargar el skill `frontend-design` si está disponible y seguir sus principios. Ver también `references/principios.md`.
- Leer `diseno/concepto.md`. Si no hay concepto elegido, volver a `/concepto-signature`.

## Pasos
1. Plan de diseño:
   - Color: 4–6 colores hex con nombre y uso (fondo, texto, acento, estados). Comprobar contraste AA.
   - Tipografía: una o dos familias con roles claros y escala tipográfica definida (tamaños, pesos, interlineado). Preferir Google Fonts u otras con licencia libre para web.
   - Layout: concepto de composición con wireframe ASCII de la página principal y móvil; alineación.
   - Principios: qué hace único este sitio y cuál es el único elemento memorable.
2. Revisión contra lo genérico: comparar el plan con lo que saldría para cualquier negocio parecido; si alguna parte es un default, cambiarla y explicar el cambio.
3. Escribir `tokens.css` con variables CSS (`--color-*`, `--font-*`, `--space-*`, `--radius-*`).
4. Si el cliente no tiene logo, proponer un logotipo tipográfico simple, sin prometer registro de marca.
5. Presentar el sistema a Diego (punto de control) y registrar la aprobación en `estado.md`.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
