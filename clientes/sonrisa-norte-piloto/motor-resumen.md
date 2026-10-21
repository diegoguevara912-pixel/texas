# Resumen · piloto Signature 2.0 de Sonrisa Norte

## En cinco líneas, para Diego
1. Esta es una copia aparte de Sonrisa Norte. La versión original no se tocó (etiqueta git `version-original-v1`).
2. El concepto es «Una pausa luminosa»: una portada con foto en ventana de arco, capítulos que cambian de luz, el arco interactivo como instrumento y una escena de respiración ligada al scroll.
3. Lleva 6 fotografías ilustrativas CC0 obtenidas y optimizadas por el nuevo motor de imágenes. El filtro de seguridad descartó 2 imágenes inadecuadas.
4. Todas las funciones originales siguen iguales: selector, agenda que arma el mensaje de WhatsApp, chat e índice. Lo comprobé en Chrome con las dos versiones.
5. Resultados: QA con 35 aprobadas, 0 críticas y 1 advertencia ([PENDIENTE] de la clínica). Navegador con 13/13 pruebas, incluidos 191 textos con contraste medido y movimiento reducido.

## Comparación
`docs/piloto-sonrisa-norte/comparacion.png` (capturas reales, antes y después).

## Lo que no se hizo
- La crítica independiente del motor (otra sesión de Claude) no se ejecutó, para no gastar uso sin tu confirmación. La rúbrica en `qa/rubrica.md` es de la misma sesión y lo dice.
- Las animaciones se verificaron con mediciones en el navegador (clases, progreso de scroll, movimiento reducido), no en video.
- Lighthouse no se midió.

## [PENDIENTE]
Los mismos del original: WhatsApp, dirección, horario, odontólogos, edades, tarifas y política de privacidad.
