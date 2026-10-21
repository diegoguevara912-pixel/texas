# Identidad visual — Sonrisa Norte · «El arco que explica»

## Concepto
El arco dental visto desde arriba es el plano de la clínica: portada, selector de tratamientos e
hilo visual del sitio. Todo lo demás es silencio editorial: marfil, aire y tipografía.

## Personalidad
Serena · precisa · cercana · sin juicio. Habla de usted, con frases cortas y verbos concretos.

## Logotipo (PROPUESTA, sin registro de marca)
Símbolo: el arco dental en vista superior con la cúspide hacia arriba —el «norte» del nombre—
y un pequeño punto en el vértice. Se dibuja con un solo trazo redondeado de salvia.
Logotipo: «Sonrisa Norte» en Fraunces 400, «Norte» en cursiva. Archivo: `sitio/assets/img/logo.svg`
y versión en línea dentro de cada página. Marcado como propuesta en `recursos/licencias.md`.

## Paleta y reglas de uso
| Token | Hex | Nombre | Uso |
|---|---|---|---|
| `--color-fondo` | #F6F1E7 | Marfil (brief) | Fondo general |
| `--color-superficie` | #EDE5D6 | Marfil hondo | Bandas, formulario, menú |
| `--color-texto` | #1F2A24 | Tinta de pino | Texto principal |
| `--color-texto-suave` | #4A5650 | Pizarra verde | Texto secundario |
| `--color-marca` | #5E7D6A | Salvia (brief) | Ilustración, titulares grandes, bordes de componentes |
| `--color-acento` | #3F5A4A | Salvia profunda | Botones, enlaces, foco |
| `--color-encia` | #C9785C | Terracota suave (brief) | **Solo** la encía y el punto del logo. Nunca texto ni botones |
| `--color-encia-texto` | #9A4E36 | Terracota profunda | Rótulos «Demostración» y «Pendiente» |
| `--color-noche` | #24362C | Musgo nocturno | Banda de cierre |
| `--color-salvia-clara` | #B9CBBE | Salvia clara | Texto secundario sobre musgo |
| `--color-error` | #A3362A | Arcilla | Errores de formulario |

### Contraste (WCAG 2.x, calculado con luminancia relativa)
| Par | Ratio | Resultado |
|---|---|---|
| Tinta #1F2A24 / Marfil #F6F1E7 | 13.2:1 | AA/AAA texto |
| Pizarra #4A5650 / Marfil | 6.8:1 | AA texto |
| Salvia profunda #3F5A4A / Marfil | 6.7:1 | AA texto, enlaces y foco |
| Blanco / Salvia profunda (botón) | 7.6:1 | AA texto |
| Salvia #5E7D6A / Marfil | 4.0:1 | **Solo** texto grande (≥24 px o 19 px negrita) y componentes. No en texto normal |
| Terracota #C9785C / Marfil | 2.95:1 | **Falla**: solo decorativo (ilustración) |
| Terracota profunda #9A4E36 / Marfil | 5.3:1 | AA texto |
| Marfil / Musgo #24362C | 11.4:1 | AA texto |
| Salvia clara #B9CBBE / Musgo | 7.5:1 | AA texto |
| Arcilla #A3362A / Marfil | 6.0:1 | AA texto |
Nota: con el tono de salvia del brief el texto normal falla AA (4.0:1); por eso se creó
«Salvia profunda» para acciones y texto, en lugar de cambiar el color de marca.

## Tipografía (Google Fonts, SIL Open Font License 1.1)
- **Fraunces** (`--font-titulos`): titulares. Peso 300–400, eje óptico alto en tamaños grandes.
  Cursiva para la voz cercana («con calma», «Norte»). Sin mayúsculas sostenidas.
- **Figtree** (`--font-texto`): cuerpo, interfaz, formularios. Pesos 400, 500 y 600.
- Escala fluida (base 18 px, razón ≈1.25), en `tokens.css`: `--texto-xs` 0.8rem → `--texto-4xl`
  hasta 5.4rem. Interlineado titulares 1.05; texto 1.6. Medida 64ch.
- Rótulos pequeños en Figtree 600 a 0.8rem con espaciado 0.04em, en minúscula inicial
  (nada de MAYÚSCULAS en cada bloque).
- Carga: `preconnect` + hoja de Google Fonts no bloqueante (`media="print"` → `all`) y `display=swap`.
  Pendiente técnico antes de publicar: autoalojar los `woff2` en `sitio/assets/fonts/`.

## Espacio, retícula y forma
- Espacios `--espacio-1` (0.25rem) a `--espacio-10` (10rem); secciones con `--espacio-9`/`--espacio-10`.
- Retícula de 12 columnas, márgenes `clamp(1.25rem, 5vw, 4rem)`, ancho máximo 1320 px.
- Radios: `--radio-s` 6px (campos), `--radio-m` 18px (paneles), `--radio-pastilla` 999px (botones).
  Las formas redondas evocan piezas y espejo; nunca esquinas rectas en botones.
- Bordes de 1px en salvia con 35 % de opacidad; sombras casi inexistentes (`--sombra-1` muy suave).

## Botones y estados
- Primario: fondo salvia profunda, texto blanco, pastilla, 48 px de alto. Hover: fondo tinta de pino.
  Foco: contorno 3px salvia profunda con separación 3px. Activo: escala 0.98.
- Secundario: texto salvia profunda con subrayado fino que crece al pasar.
- Selector del arco: pastillas con borde; seleccionado = fondo salvia profunda + `aria-pressed="true"`.

## Iconografía
Sin set de iconos de muela. Solo trazos propios SVG de 1.5px (flecha corta, WhatsApp
simplificado, cerrar). El «icono» de cada tratamiento es su mini-arco.

## Tratamiento de imágenes
Sin fotografía (no hay fotos reales y es una demo). Ilustración vectorial del arco con piezas en
marfil y contorno salvia, encía terracota. Cuando el cliente tenga fotos reales: luz natural
lateral, tonos cálidos, sin sonrisas de banco.

## Componentes clave
Aviso de demostración · cabecera con «Índice» y «Agendar» · índice a pantalla completa en curva ·
arco interactivo · índice editorial de tratamientos · pasos de primera visita · respiración guiada ·
formulario de cita en tres decisiones · cierre musgo · botón WhatsApp flotante (móvil).

## Movimiento
- Curva `--curva` cubic-bezier(.22,.61,.36,1) (salida suave). Corta 220 ms, media 600 ms, larga 1100 ms.
- El arco se dibuja una vez (1.1 s) y respira (escala 1→1.012, 9 s, infinito).
- Cambios del selector: piezas se deslizan 600 ms con escalonado de 18 ms por pieza.
- Revelados: 16 px, 800 ms, solo al entrar en pantalla.
- `prefers-reduced-motion`: sin respiración, sin dibujo, cambios instantáneos; la respiración guiada
  pasa a instrucciones de texto con cuenta.

## Reglas de uso
1. La terracota solo pinta encía y el punto del logo.
2. Una acción principal por pantalla («Agendar mi cita»).
3. Máximo dos pesos tipográficos por pantalla, además de la cursiva.
4. Nada de fotos de banco de sonrisas.
5. Todo dato del negocio no confirmado va como [PENDIENTE: …] visible.
