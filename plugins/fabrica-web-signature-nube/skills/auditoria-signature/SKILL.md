---
name: auditoria-signature
description: "Revisa diseño, código, funcionamiento y calidad del sitio antes de mostrarlo o publicarlo. Usar con /auditoria-signature, \"audita la web\", \"revisión de calidad\", \"¿está lista?\"."
---

# Auditoría signature

Emite un informe `entrega/auditoria.md` con veredicto: **Aprobado**, **Aprobado con ajustes** o **No aprobado**.

## Lista de revisión
**Diseño**: fiel al sistema aprobado; jerarquía clara; un elemento memorable; nada que parezca plantilla genérica; consistencia de espaciados y tipografía.
**Contenido**: sin faltas; sin `[PENDIENTE]` olvidados (listarlos); sin testimonios, cifras ni logos inventados; datos de contacto confirmados.
**Código**: HTML válido; sin errores en consola; sin rutas locales; sin claves o contraseñas en ningún archivo (buscar `key`, `token`, `password`, `secret`).
**Funcionamiento**: todos los enlaces y botones, enlace de WhatsApp con número correcto, formularios, menú móvil, 404.
**Calidad técnica**: resultados de `/optimizar-web` (SEO, rendimiento, accesibilidad, móvil).
**Legal**: licencias de recursos en `licencias.md`; aviso de privacidad si hay formulario.

## Pasos
1. Revisar cada punto y marcar ✓ / ✗ con evidencia (archivo:línea, captura o resultado).
2. Corregir lo menor directamente y anotar qué se corrigió.
3. Lo importante queda listado como pendiente con prioridad.
4. Punto de control: Diego decide si se avanza a vista previa y publicación.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
