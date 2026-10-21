# Módulo 15 · Motor cromático y motor tipográfico

El motor ya calculó tres paletas y tres combinaciones tipográficas en `diseno/kit-direccion.md`
(contrastes medidos con WCAG 2.x). Tu trabajo es **elegir con criterio, ajustar y justificar**, no
volver a calcular a ojo.

## Color
1. Lee las tres propuestas (A marca protagonista · B contraste nocturno · C acento inesperado) y los
   avisos (por ejemplo, si la marca coincide con una combinación genérica).
2. Elige la que mejor sirve a `percepcion.md`, o construye una propia a partir de una de ellas.
   Justifica en `direccion.json` → `paleta.justificacion` en 2-3 frases: percepción, sector,
   diferenciación frente a competidores y relación con la fotografía.
3. **Colores del cliente**: se respetan siempre. Puedes crear tonos derivados (más oscuros para
   texto o botones) del mismo tono; no sustituyas la marca sin autorización.
4. Sistema completo en `tokens.css` con valores hex directos (el motor los mide):
   `--color-fondo`, `--color-superficie-1..3`, `--color-texto`, `--color-texto-suave`,
   `--color-enlace`, `--color-borde`, `--color-foco`, `--color-primario`, `--color-secundario`,
   `--color-acento`, `--color-exito|aviso|error|info`, `--cta-fondo`, `--cta-texto`, `--cta-hover`,
   `--cta-borde-secundario`. Si hay secciones oscuras, define también sus pares (`--oscuro-fondo`,
   `--oscuro-texto`).
5. Reglas: AA en texto (4.5:1; 3:1 en texto grande y componentes); el acento no se usa para texto
   pequeño si no alcanza contraste; una acción principal con el color de CTA en toda la página;
   **cambios de plano** (fondos distintos entre capítulos) para dar ritmo, sin arcoíris.
6. Si el motor reporta pares que no cumplen, corrígelos en la construcción.

## Tipografía
1. Si Diego definió fuentes en el brief, son **obligatorias** (si son viables y con licencia).
2. Si no, elige del kit o del catálogo (`templates/brief/catalogo-fuentes.json`) por **personalidad**:
   editorial clásica, técnica precisa, geométrica moderna, humanista cercana o display expresiva.
   Evita las ya usadas en otros proyectos de la fábrica (el kit las lista) y nunca Inter/Poppins/
   Montserrat por inercia.
3. Roles claros: display (titulares), texto (lectura), y como máximo un acento (mono para datos,
   cursiva de la misma familia para énfasis). Nunca mono para texto corrido.
4. Escala fluida con `clamp()` según la razón del kit (1.2 serena · 1.25 equilibrada · 1.333
   editorial · 1.414+ expresiva). Titulares de primera pantalla grandes de verdad en escritorio
   (≥ 4.5rem cuando el concepto es editorial o expresivo) y que no se partan mal en móvil.
5. Interlineado 1.05-1.15 en titulares grandes, 1.5-1.7 en texto; medida 55-75 caracteres;
   `letter-spacing` negativo leve en display grande, positivo en etiquetas pequeñas.
6. Carga: solo los pesos usados, `font-display: swap`, `preconnect` si vienen de Google Fonts;
   antes de publicar, autoalojar `woff2` en `sitio/assets/fonts/`.
7. Variables: `--font-display`, `--font-texto` (y `--font-titulos` si ya existía) en `tokens.css`.
