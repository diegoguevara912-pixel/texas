---
name: modificar-web
description: "Modifica un proyecto web existente sin reconstruirlo desde cero. Usar con /modificar-web, \"cambia…\", \"actualiza la web de…\", \"agrega una sección\"."
---

# Modificar web

Aplica cambios puntuales a un sitio ya hecho, conservando su diseño y estructura.

## Pasos
1. Identificar el proyecto (`proyectos-web/<slug>/`) y leer `estado.md`, `diseno/sistema.md` y los archivos afectados.
2. Si el sitio viene de fuera de la fábrica, hacer primero un inventario corto: estructura, stack, estilos usados.
3. Hacer copia de seguridad antes de editar: `sitio/` → `respaldos/<fecha>/` (o un commit si es un repositorio git).
4. Aplicar el cambio mínimo necesario, reutilizando tokens y componentes existentes. No rediseñar lo que no se pidió.
5. Comprobar con `/vista-previa` que el cambio funciona y que nada más se rompió.
6. Registrar en `estado.md` y en `entrega/cambios.md`: fecha, qué se cambió, archivos tocados.
7. Si el sitio ya está publicado, el cambio no sale a producción hasta usar `/publicar-hostinger` con aprobación.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
