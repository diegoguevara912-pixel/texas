---
name: preparar-hostinger
description: "Comprueba la compatibilidad del sitio con Hostinger y prepara el paquete de despliegue sin publicar. Usar con /preparar-hostinger, \"prepara para Hostinger\", \"listo para subir\"."
---

# Preparar Hostinger

Deja un paquete listo para subir y una lista de verificación, sin tocar producción.

## Compatibilidad
- Hosting compartido (Web/Premium/Business): sitios estáticos y PHP; carpeta pública `public_html/`.
- Node.js solo en planes que lo admiten; si el sitio usa Node o un framework, confirmar el plan del cliente.
- WordPress: usar el instalador de Hostinger, no este paquete.

## Pasos
1. Confirmar que la auditoría está aprobada (`entrega/auditoria.md`). Si no, detenerse.
2. Verificar: rutas relativas, `index.html` en la raíz, nombres de archivo en minúsculas sin espacios, `404.html`, `.htaccess` con HTTPS forzado, caché y compresión.
3. Ajustar `canonical`, `sitemap.xml` y Open Graph al dominio final.
4. Crear `entrega/deploy/<slug>-<fecha>.zip` con el contenido de `sitio/` (sin respaldos ni archivos de trabajo).
5. Escribir `entrega/deploy/checklist.md`: dominio, plan, DNS/SSL, correo, qué se reemplaza, cómo volver atrás.
6. Si el conector oficial de Hostinger está disponible, usarlo solo para leer (listar sitios, dominios, plan) y confirmar compatibilidad.
7. Terminar indicando que la publicación requiere `/publicar-hostinger` y la aprobación de Diego.

Nunca guardar credenciales de Hostinger en el proyecto.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
