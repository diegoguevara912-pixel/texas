# Revisión visual — sonrisa-norte (segunda pasada)

Fecha: 2026-10-18. Base: capturas del motor `qa/capturas/auto-*.png` (solo la primera pantalla de `index.html`),
`qa/ULTIMO.md` y `qa/navegador.json`. No tengo navegador propio: no vi las páginas interiores, ni el menú abierto,
ni el selector en uso, ni el formulario. Lo que no aparece en las capturas queda **sin revisar**.

## Datos del motor
- QA automático: 0 críticas, 1 advertencia (marcadores `[PENDIENTE]`), 2 no ejecutadas (Lighthouse, contraste).
- Navegador: sin scroll horizontal, sin errores de consola, sin recursos 404, sin imágenes rotas.
- Fuentes reales: h1 en Fraunces y texto en Figtree, las dos cargadas (coincide con el brief).
- La advertencia de `[PENDIENTE]` **no se corrige a propósito**: son datos que solo puede dar la clínica
  (dirección, horario, WhatsApp, odontólogos, edad mínima, datos legales). Rellenarlos sería inventar.

## Escritorio (1440 px) — lo que vi
- Composición en dos columnas: titular a la izquierda, arco ilustrado + «¿Qué le trae?» con cuatro opciones a la
  derecha. La idea se entiende en la primera pantalla; el arco es la pieza memorable y no se parece a una plantilla dental.
- **Problema:** el titular «Su sonrisa, atendida con calma.» se veía con las letras apretadas («sonrisa» casi
  encimada). Causa: con `font-optical-sizing: auto` a ~86 px Fraunces usa su corte «display», muy estrecho, y además
  había tracking negativo.
- **Problema:** en el botón de la cabecera «Agendar   mi cita» había un hueco doble (el `gap` del botón más el `&nbsp;`).
- **Problema leve:** los molares llevaban un surco en cruz que, a ese tamaño, se lee como signos «+» (sumar), no como diente.
- Observación sin cambio: queda aire vacío arriba del rótulo porque la columna derecha (arco + opciones + respuesta)
  es más alta y la izquierda se centra. Lo dejo: equilibra el peso visual y el CTA queda a la altura de las opciones.
- El botón flotante de WhatsApp queda cerca del texto «Elija una situación», sin taparlo.

## Tableta (820 px) — lo que vi
- Una columna: titular, bajada, botones y debajo el arco con las opciones en dos columnas. Jerarquía clara, buen
  ritmo de espacios; el titular aquí se ve bien (tamaño menor). El arco aparece en la primera pantalla.
- Mismo hueco doble en «Agendar mi cita» de la cabecera.
- Sin otros problemas visibles.

## Móvil (390 px) — lo que vi
- **Problema:** el logotipo se partía en dos líneas («Sonrisa / Norte»), la cabecera quedaba alta y desordenada.
- **Problema:** el aviso de demostración ocupaba tres líneas encima de la cabecera (~70 px de la primera pantalla).
- Titular, bajada y botón «Agendar mi cita» se leen bien; el enlace «Ver los cuatro tratamientos» pasa a otra línea
  (correcto). El arco asoma al final de la pantalla, lo que invita a bajar. WhatsApp como círculo, sin tapar texto.

## Cambios hechos
| Problema | Cambio | Archivo |
|---|---|---|
| Titular apretado en escritorio | Corte óptico fijo `"opsz" 60` y tracking −0.005em en h1, frase de cierre, frase de muestra y nombres del índice | `assets/css/sitio.css` |
| Hueco doble en «Agendar mi cita» | `.boton-cabecera { gap: 0 }` | `assets/css/sitio.css` |
| Logotipo partido en móvil | `white-space: nowrap`; en ≤420 px logotipo algo más pequeño y botón «Índice» como círculo de 44 px con sus dos líneas (el texto sigue siendo su nombre accesible) | `assets/css/sitio.css` |
| Aviso de demo de tres líneas en móvil | En ≤640 px se muestra «Sitio de demostración: clínica ficticia, datos de ejemplo.»; en pantallas mayores, el texto completo | 5 páginas `.html` + `sitio.css` |
| Molares con «+» | Surco ondulado en molares, recto en premolares | `assets/js/arco.js` |

No añadí efectos nuevos. 404.html ya tenía un aviso corto y no se tocó.

## Pendiente de verificar (lo hace el motor o Diego)
- Nuevas capturas: confirmar que la cabecera móvil cabe en una línea y que el titular de escritorio respira.
- Páginas interiores, menú «Índice» abierto, selector en sus cuatro estados, formulario de cita y chat de WhatsApp:
  no aparecen en las capturas, no los vi.
- Lighthouse y contraste medido: no ejecutados.
