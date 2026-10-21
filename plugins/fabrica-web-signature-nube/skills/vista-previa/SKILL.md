---
name: vista-previa
description: "Abre el sitio desarrollado localmente y comprueba que funciona en móvil y escritorio. Usar con /vista-previa, \"muéstrame la web\", \"ábrela\", \"cómo se ve\"."
---

# Vista previa

Sirve el sitio y lo comprueba visualmente.

## Pasos
1. Servir `sitio/` localmente: `python3 -m http.server 8080 --directory proyectos-web/<slug>/sitio` (o el servidor de desarrollo del stack usado).
2. Si hay navegador automatizado (Playwright/Chromium), tomar capturas de la portada y de cada página en 360 px y 1280 px y revisarlas; anotar errores de consola y enlaces rotos.
3. Si no hay navegador, indicar a Diego la dirección local para abrirla él y una lista corta de qué revisar.
4. Para compartir con el cliente, ofrecer una vista previa privada (por ejemplo un Artifact o un subdominio de prueba). Nunca publicar en el dominio del cliente desde este comando.
5. Resumir: qué se ve bien, qué falla, qué corregir. Detener el servidor al terminar.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
