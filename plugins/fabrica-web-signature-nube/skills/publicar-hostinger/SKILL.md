---
name: publicar-hostinger
description: "Publica el sitio en Hostinger únicamente después de una aprobación explícita de Diego. Usar con /publicar-hostinger, \"publica la web\", \"súbela a Hostinger\"."
---

# Publicar en Hostinger

Publica el paquete preparado. Es una acción de producción: requiere aprobación explícita.

## Requisitos previos (todos)
- `entrega/auditoria.md` con veredicto aprobado.
- `entrega/deploy/` con el zip y el checklist de `/preparar-hostinger`.
- Mensaje de Diego que diga claramente que aprueba publicar este proyecto en este dominio ahora. "Se ve bien" no es aprobación. Si no existe, pedirla con un resumen: dominio, qué se reemplaza, cómo volver atrás. Y esperar.

## Publicación
1. Respaldar lo que haya hoy en el sitio de destino (descargar o pedir a Diego que lo haga desde hPanel).
2. Publicar por la vía disponible:
   - Conector oficial de Hostinger (si está conectado): buscar la operación de despliegue de archivos con su herramienta de búsqueda y seguir su esquema; las operaciones son asíncronas, consultar su estado hasta que termine.
   - Si no hay conector: guiar a Diego paso a paso para subir el zip desde el Administrador de archivos de hPanel a `public_html/` y descomprimirlo.
3. Verificar en el dominio: carga con HTTPS, páginas, enlace de WhatsApp, formulario, móvil.
4. Si algo falla, restaurar el respaldo y avisar.
5. Registrar en `estado.md`: fecha, dominio, versión publicada, quién aprobó.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
