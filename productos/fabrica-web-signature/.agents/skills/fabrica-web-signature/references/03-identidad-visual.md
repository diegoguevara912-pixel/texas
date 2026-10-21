# Módulo 6 · Identidad visual por cliente (etapa D)

Cada proyecto tiene su propio sistema de diseño. Nunca se mezclan identidades entre empresas.

## Entregables
1. `diseno/identidad.md` — documento legible con: concepto creativo, personalidad de marca,
   paleta (hex, nombre, uso, pares de contraste comprobados), fuentes y licencias, escala
   tipográfica, espaciados, retícula, bordes y radios, botones y sus estados, iconografía,
   tratamiento de imágenes, componentes clave, animaciones (duraciones, curvas, cuándo) y reglas de uso.
2. `diseno/identidad.json` — resumen máquina-legible con el formato de
   `templates/proyecto/identidad.ejemplo.json` (lo usan el detector de similitud y Signature Studio).
3. `sitio/assets/css/tokens.css` — todas las decisiones como variables CSS para poder cambiar
   colores, tipografía, espaciado o movimiento globalmente sin tocar cada sección:

```css
:root {
  /* color */
  --color-fondo: …; --color-superficie: …; --color-texto: …; --color-texto-suave: …;
  --color-acento: …; --color-acento-texto: …; --color-borde: …; --color-foco: …; --color-error: …;
  /* tipografía */
  --fuente-display: …; --fuente-texto: …;
  --texto-xs … --texto-4xl: clamp(…);   /* escala fluida */
  --interlineado-titulo: …; --interlineado-texto: …; --medida: 68ch;
  /* espacio y forma */
  --espacio-1 … --espacio-10; --radio-s; --radio-m; --borde: …; --sombra-1: …;
  /* movimiento */
  --curva: cubic-bezier(…); --duracion-corta: …; --duracion-larga: …;
  --revelar-distancia: …; --revelar-duracion: …;
}
```

## Reglas
- Contraste AA: texto normal ≥ 4.5:1, texto grande ≥ 3:1, componentes y foco ≥ 3:1. Calcula y
  anota los pares en `identidad.md`.
- Fuentes con licencia web libre (Google Fonts, Fontshare con licencia comprobada) o del cliente con
  licencia. Cargar solo pesos usados, `font-display: swap`, preferir autoalojar `woff2`
  en `sitio/assets/fonts/` para rendimiento y privacidad.
- Si el cliente no tiene logotipo: proponer un logotipo tipográfico o un símbolo SVG simple, sin
  prometer registro de marca, y marcarlo como propuesta.
- Si el cliente tiene colores de marca, respetarlos y construir el sistema alrededor (no
  sustituirlos por gusto).
- El componente CSS de cada sección usa tokens, nunca valores sueltos repetidos.
