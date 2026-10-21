# Módulos 7-10 · Arquitectura, componentes, frontend y backend (etapa E)

## Elegir la tecnología proporcional
| Proyecto | Stack recomendado | Por qué |
|---|---|---|
| Landing, página de campaña, corporativa pequeña, portafolio | **HTML + CSS + JS sin compilación** (por defecto) | Funciona en cualquier plan de Hostinger, carga rápido, sin dependencias |
| Multipágina con contenido repetido (10+ páginas, blog) | Astro (requiere Node.js) | Componentes y salida estática |
| Aplicación web, panel, lógica de usuario | React/Next.js + backend (requiere Node y plan con Node.js) | Solo si hay lógica real |
| Tienda | Evaluar Hostinger Website Builder/WooCommerce/Shopify antes de programar a medida | Pagos, inventario y seguridad ya resueltos |

Este equipo **no tiene Node.js instalado** (ver `python core/fabrica.py diagnostico`). Si un
proyecto lo necesita, explica a Diego por qué y pide permiso antes de instalarlo.
Anota la decisión en `diseno/decisiones.md` del cliente.

## Estructura del sitio estático
```
sitio/
  index.html, <pagina>.html, 404.html, robots.txt, sitemap.xml, .htaccess
  base/             ← base técnica copiada por iniciar-sitio (no editar aquí: mejorar en design-system/)
  assets/css/tokens.css, assets/css/sitio.css
  assets/js/sitio.js
  assets/img/, assets/fonts/, assets/data/*.json
```
`python core/fabrica.py iniciar-sitio <slug>` copia `base/base.css` (reinicio + accesibilidad),
`base/signature-motion.js` (revelado con `data-revelar`, respeta movimiento reducido),
`base/formularios.js` (validación accesible, formulario→WhatsApp, enlaces `data-wa`) y `.htaccess`.
No copia nada visual: el diseño se escribe para cada cliente.

## Frontend — reglas
- HTML semántico: `header`, `nav`, `main#contenido`, `section` con encabezado, `footer`;
  enlace "Saltar al contenido" (`.saltar-contenido`); un `h1` por página.
- Móvil primero, pero diseñar intencionalmente escritorio y móvil (composición propia en cada uno).
  Probar 360, 768, 1280 y 1600 px. Sin scroll horizontal.
- CSS: tokens + capas claras; `clamp()` para tipografía fluida; Grid para composiciones
  asimétricas; `:focus-visible`; `@media (prefers-reduced-motion: reduce)`.
- JS: diferido (`defer`), sin bloquear la primera pantalla; nada esencial depende de JS.
- Bibliotecas por CDN con versión exacta (cdnjs/jsdelivr) o autoalojadas; solo las necesarias.
- Imágenes: `<picture>`/`srcset`, `width`/`height` para evitar saltos, `loading="lazy"` salvo la
  primera imagen, `fetchpriority="high"` en la imagen principal.
- Componentes reutilizables (técnicos) que valga la pena compartir entre proyectos se mejoran en
  `design-system/base-tecnica/` y se anotan en `CHANGELOG.md`. **No** se actualizan
  automáticamente los proyectos anteriores: se copian solo si se revisa el impacto.

## Privacidad (siempre que la página recoja datos)
Publicar `privacidad.html` desde `biblioteca/politica-privacidad.md`, completada con datos reales,
enlazada en el pie y junto a cada formulario. El QA lo exige (`privacidad`).

## Base de datos: reglas RLS obligatorias
Solo si el proyecto necesita guardar datos (y Diego lo aprobó antes: Supabase u otra base se agrega
avisándole). Antes de publicar:
- RLS activado en **todas** las tablas; por defecto nadie lee ni escribe.
- Políticas explícitas: el visitante anónimo solo puede **insertar** en la tabla de contactos/citas,
  nunca leerla; cada usuario con cuenta solo ve y edita sus filas (`auth.uid() = user_id`);
  el panel del negocio lee con una cuenta de administrador, no con la clave de servicio.
- La clave de servicio (service role) nunca va en el navegador ni en el repositorio.
- Probar con un usuario anónimo y con dos usuarios distintos que nadie ve datos ajenos, y anotar
  el resultado en `qa/revision-visual.md`.
En Hostinger AI Builder (modo agente) pedir lo mismo para su base integrada.

## Backend — cuándo y cómo
- Por defecto, sin servidor: contacto por WhatsApp (`formularios.js`), enlaces `tel:`/`mailto:`,
  mapas incrustados, calendarios externos (Calendly/Google Calendar) si el cliente los tiene.
- Formulario que envía correos o guarda datos: en Hostinger compartido, PHP con validación del lado
  del servidor, trampa anti-spam, límite de envíos y destinatario en un archivo de configuración
  fuera de `public_html` o en variables del panel. No hay PHP en este equipo para probarlo: marca la
  función como "implementada, pendiente de prueba en el hosting".
- Base de datos (MySQL de Hostinger): conexión a 127.0.0.1:3306 desde la app; credenciales nunca en
  el código público ni en el repositorio.
- Pagos, datos médicos o personales sensibles: identificar requisitos adicionales (proveedor de pago
  certificado, aviso de privacidad, consentimiento) **antes** de considerarlo listo.
- Una función que es solo demostración se rotula visiblemente como "Demostración".

## Antes de pasar a calidad
- Abrir el sitio en la vista previa y recorrerlo.
- Revisar que todo texto venga del brief/análisis o esté marcado `[PENDIENTE]`.
