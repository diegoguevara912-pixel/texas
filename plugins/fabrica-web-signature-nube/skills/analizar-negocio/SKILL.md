---
name: analizar-negocio
description: "Investiga la empresa del cliente, su público y sus competidores antes de diseñar. Usar con /analizar-negocio, \"investiga el negocio\", \"analiza la competencia\"."
---

# Analizar negocio

Produce `investigacion/analisis.md` con hallazgos verificables que guíen el concepto y los textos.

## Pasos
1. Leer `ficha-cliente.md`.
2. Investigar con búsqueda web cuando esté disponible:
   - La empresa: presencia actual (web, Google Maps, redes), cómo se describe, qué vende, precios publicados.
   - Público: quién compra, qué le preocupa, cómo busca (palabras que usaría en Google o WhatsApp).
   - 3–5 competidores locales o del rubro: URL, propuesta, fortalezas, debilidades visibles de su web.
3. Etiquetar cada afirmación como **HECHO** (con enlace o fuente), **HIPÓTESIS** o **RECOMENDACIÓN**.
4. Cerrar con:
   - Diferenciador principal del cliente (en una frase).
   - Tres mensajes clave para la web.
   - Palabras clave de búsqueda candidatas (para `/optimizar-web`).
   - Preguntas abiertas para el cliente.
5. Actualizar `estado.md` y sugerir `/concepto-signature`.

## No hacer
No inventar cifras de mercado, reseñas ni datos de competidores. Si una búsqueda no da resultados, decirlo.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
