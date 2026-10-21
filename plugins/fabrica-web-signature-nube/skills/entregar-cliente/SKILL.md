---
name: entregar-cliente
description: "Prepara la documentación, archivos finales y plan de mantenimiento para entregar el sitio al cliente. Usar con /entregar-cliente, \"entrega al cliente\", \"documentación final\", \"plan de mantenimiento\"."
---

# Entregar al cliente

Prepara `entrega/` para cerrar el proyecto con el cliente.

## Contenido
1. `guia-cliente.md` (lenguaje simple): qué tiene su web, cómo pedir cambios, cómo leer los mensajes que llegan, qué no tocar.
2. `ficha-tecnica.md`: dominio, hosting y plan, dónde están los archivos, stack, fecha de publicación, licencias de recursos. Sin contraseñas: indicar dónde las guarda el cliente.
3. `mantenimiento.md`: qué incluye y no incluye el mantenimiento (actualizar productos, copias de seguridad, revisión mensual, renovaciones de dominio y hosting con fechas), precio solo si Diego lo definió.
4. `cambios.md`: historial de cambios.
5. Archivos finales: zip del sitio publicado, logo y recursos en sus formatos, capturas.
6. Borrador de mensaje de entrega para que Diego lo revise y lo envíe él (no enviarlo).

## Pasos
1. Comprobar que el sitio está publicado o que el cliente recibirá los archivos de otra forma.
2. Generar los documentos; si piden PDF, convertirlos.
3. Marcar el proyecto como entregado en `estado.md` y proponer recordatorios de renovación.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
