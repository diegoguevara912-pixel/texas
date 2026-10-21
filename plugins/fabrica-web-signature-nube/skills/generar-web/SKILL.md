---
name: generar-web
description: "Construye las páginas, componentes y código funcional del sitio a partir del sistema de diseño. Usar con /generar-web, \"construye la web\", \"programa el sitio\", \"genera las páginas\"."
---

# Generar web

Construye el sitio en `sitio/` siguiendo `diseno/sistema.md` y `diseno/tokens.css`.

## Stack por defecto
HTML + CSS + JavaScript sin framework ni paso de compilación, para que funcione en cualquier hosting compartido de Hostinger. Usar otro stack solo si el proyecto lo pide (por ejemplo una tienda) y anotarlo en `estado.md`.

## Pasos
1. Leer ficha, análisis, concepto y sistema.
2. Definir el mapa del sitio y la estructura de archivos:
   ```
   sitio/index.html, sitio/<pagina>.html
   sitio/assets/css/, assets/js/, assets/img/, assets/fonts/
   ```
3. Escribir textos reales a partir de la ficha y el análisis; donde falte información usar `[PENDIENTE: …]`. Nada de testimonios o cifras inventadas.
4. Construir con HTML semántico, CSS que use los tokens, diseño móvil primero, foco de teclado visible, `prefers-reduced-motion` respetado.
5. Funciones habituales del ciclo actual: botón y enlaces de pedido o cotización a WhatsApp (`https://wa.me/<numero>?text=...` con texto prellenado), catálogo de productos desde un archivo de datos (`assets/data/productos.json`), formulario de contacto sin claves en el navegador.
6. Validar que no haya enlaces rotos ni rutas absolutas del equipo local.
7. Abrir con `/vista-previa` y actualizar `estado.md`.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
