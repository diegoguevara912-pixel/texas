# Módulos 17-19 · Evaluación visual, pruebas y corrección (etapas G-H)

Un proyecto no está terminado porque compila. Está terminado cuando funciona, se ve extraordinario y
está verificado.

## 1. Pruebas automáticas
`python core/fabrica.py qa <slug>` → `qa/ULTIMO.md` y `qa/qa-<fecha>.json`.
Cubre: existencia, idioma, títulos, descripciones, viewport, h1, alt, etiquetas de formularios,
enlaces y recursos internos, rutas locales, secretos, marcadores `[PENDIENTE]`, movimiento reducido,
foco, peso de imágenes y código, formatos, versiones de CDN, enlaces de WhatsApp, SEO del sitio y
reglas de demo (noindex + aviso). Declara como **no ejecutadas** las que requieren navegador.

Si el proyecto usa un framework, añade: instalación de dependencias, compilación, comprobación de
tipos y pruebas propias, y guarda la salida en `qa/`.

## 2. Revisión en navegador (cuando tengas herramientas de navegador)
1. Abrir la vista previa (`http://127.0.0.1:4100/preview/<slug>/` con Studio, o `vista-previa`).
2. Capturas a 360, 768, 1280 y 1600 px de cada página. Mirarlas de verdad.
3. Consola sin errores; probar menú, enlaces, formularios (casos válidos e inválidos), WhatsApp,
   navegación con teclado (Tab/Shift+Tab/Enter/Escape) y movimiento reducido emulado.
4. Lighthouse si está disponible; si no, anotar "no medido".
5. Escribir `qa/revision-visual.md`: qué se vio, problemas, correcciones.
Si no tienes navegador, dilo a Diego y dale una lista corta de qué revisar él.

## 3. Rúbrica Signature (1-10, evaluación interna justificada)

> **Signature 2.0:** en el motor, la rúbrica la escribe una **crítica independiente** que mira capturas
> reales (ver `18-critica-signature.md`). En una sesión manual, aplica la misma rúbrica y el mismo formato.
Escribe `qa/rubrica.md` con nota y una frase de evidencia por criterio:
1 Originalidad · 2 Dirección creativa · 3 Primera impresión · 4 Identidad visual · 5 Tipografía ·
6 Composición · 7 Calidad de imágenes · 8 Animaciones · 9 Interactividad · 10 Navegación ·
11 Claridad comercial · 12 Experiencia móvil · 13 Accesibilidad · 14 Rendimiento ·
15 Diferenciación respecto a diseños genéricos.
Objetivo: 9+ donde sea razonable. Son juicios internos, no pruebas de valor comercial; no inflarlos.
Criterios que dependen de algo no medido se marcan "sin medir".

## 4. Ciclo de corrección
Ejecutar → inspeccionar → revisar tamaños → identificar → corregir → revisar consistencia →
mejorar secciones débiles → repetir pruebas → entregar versión revisada.
- Si una parte parece genérica (criterio 1, 2 o 15 < 8), rediseñarla desde el concepto; **no** se
  arregla añadiendo efectos.
- Nunca declarar listo para producción con fallos críticos conocidos.
- Distinguir siempre: aprobado / fallido / no ejecutado.

## 5. Prueba de aislamiento entre clientes
`python -m unittest discover -s tests` en la raíz de la fábrica incluye la prueba de aislamiento;
además, el QA de cada sitio no debe encontrar nombres, teléfonos o rutas de otros clientes.
