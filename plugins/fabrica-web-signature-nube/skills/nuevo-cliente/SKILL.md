---
name: nuevo-cliente
description: "Abre el formulario de un cliente nuevo y crea su proyecto independiente. Usar con /nuevo-cliente, \"cliente nuevo\", \"empezar proyecto para…\"."
---

# Nuevo cliente

Crea la ficha y la carpeta de un proyecto web nuevo, aislado de los demás.

## Pasos
1. Pedir los datos del formulario (aceptar lo que Diego ya haya dicho y preguntar solo lo que falte, en un solo mensaje):
   - Nombre comercial y rubro
   - Ciudad y país; zona que atiende
   - Contacto del negocio que aparecerá en la web (WhatsApp, correo, dirección) — solo si el cliente lo autorizó
   - Objetivo principal de la web (ventas por WhatsApp, citas, catálogo, reputación…)
   - Público ideal
   - Páginas o secciones que necesita
   - Productos/servicios y si hay más de 30 (catálogo)
   - Material existente: logo, fotos, textos, redes sociales, web actual
   - Referencias que le gustan y que no
   - Presupuesto acordado, fecha límite, dominio y hosting (¿ya tiene Hostinger?)
2. Crear un slug en minúsculas con guiones (`ferreteria-la-esquina`).
3. Crear `proyectos-web/<slug>/` con:
   - `ficha-cliente.md`: respuestas del formulario; lo desconocido como `[PENDIENTE]`.
   - `estado.md`: etapa 1 completada.
   - Carpetas vacías: `investigacion/`, `diseno/`, `recursos/`, `sitio/`, `entrega/`.
4. Si el slug ya existe, no sobrescribir: avisar y proponer `/modificar-web` o un slug distinto.
5. Terminar indicando la siguiente etapa: `/analizar-negocio`.

## Privacidad
La ficha contiene datos del cliente: no copiarla a demos ni a otros proyectos. No guardar contraseñas de hosting, correo o redes en la ficha.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
