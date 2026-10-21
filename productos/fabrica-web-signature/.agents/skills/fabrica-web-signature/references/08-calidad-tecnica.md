# Módulos 13-16 · SEO, accesibilidad, rendimiento y seguridad

## 13. SEO técnico
- `<title>` único (≤ 60 caracteres) y meta descripción (≤ 155) por página, con las palabras del análisis.
- URLs claras en minúsculas; un `h1`; encabezados en orden.
- `canonical`, Open Graph (`og:title`, `og:description`, `og:image` 1200×630, `og:url`) para que
  WhatsApp y redes muestren bien el enlace.
- Datos estructurados JSON-LD legítimos (`LocalBusiness`/subtipo, `Organization`, `FAQPage` solo
  con preguntas reales). Ningún dato inventado ni reseñas falsas.
- SEO local: nombre, dirección y teléfono idénticos en todo el sitio; sugerir Perfil de Empresa de
  Google (lo gestiona el cliente).
- `sitemap.xml` y `robots.txt`: `python core/fabrica.py seo <slug> --dominio https://…`.
  Demos: siempre `noindex` + `Disallow: /`.
- No prometer posiciones en Google.

## 14. Accesibilidad (objetivo WCAG 2.2 AA)
Contraste suficiente; navegación completa por teclado y orden lógico; `:focus-visible` visible;
semántica y puntos de referencia; etiquetas en todos los campos; `alt` útil; objetivos táctiles
≥ 44 px (mínimo 24 px por WCAG 2.2); `lang` correcto; movimiento reducido respetado; sin
información solo por color; menús móviles con `aria-expanded` y cierre con Escape.

## 15. Rendimiento (orientativo: Lighthouse ≥ 90, LCP < 2.5 s, CLS < 0.1, INP < 200 ms)
Imágenes optimizadas y dimensionadas; fuentes mínimas y autoalojadas; JS diferido y pequeño;
nada bloqueante en la primera pantalla; carga diferida; caché y compresión (`.htaccess` base);
sin bibliotecas que no se usan. **No reportar puntuaciones que no se midieron.**

## 16. Seguridad
- Ninguna clave en el frontend ni en archivos del proyecto; variables de entorno o panel del hosting.
- Validación y saneamiento del lado del servidor en todo formulario con backend; trampa anti-spam
  y límite de envíos; mensajes de error que no revelan detalles internos.
- Cabeceras básicas (`.htaccess`): nosniff, referrer-policy, frame-options, permissions-policy.
- Dependencias mantenidas y con versión fija.
- Datos personales: recoger solo lo necesario, aviso de privacidad si hay formulario.
- Licencias compatibles para todo recurso; respetar condiciones de cada servicio.
- El QA automático busca claves y contraseñas; un hallazgo es fallo crítico.
