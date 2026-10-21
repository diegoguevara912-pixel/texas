# Informe final · FÁBRICA WEB SIGNATURE 2.0

Fecha: 2026-10-18 · Versión: 2.0.0 · Base: 0.5.0 (recuperable con la etiqueta git `recuperacion-v0.5.0` y el zip
`%USERPROFILE%\Respaldos-Fabrica-Web-Signature\fabrica-antes-de-signature2-20261018-1533.zip`).
Pruebas automáticas de la fábrica: **24/24 aprobadas** (`python -m unittest discover -s tests`).

## Entregables
| | Entregable | Estado | Evidencia |
|---|---|---|---|
| A | Auditoría inicial | Implementado y probado | `docs/auditoria-signature-2.md`, capturas en `docs/auditoria-capturas/sonrisa-norte-v1/` |
| B | Investigación de Hostinger | **Parcial / bloqueado** | Documentación oficial citada en la auditoría. No pude leer tu cuenta: no hay conector de Hostinger en esta sesión |
| C | Motor de investigación estratégica | Implementado; probado con simulador | Pasada «dirección» + `references/14`; reutiliza la investigación si el brief no cambió (`direccion.investigacion_reutilizable`, prueba 23) |
| D | Motor de neuromarketing | Implementado (procedimiento) | `references/14-estrategia-y-neuromarketing.md`, entregable `diseno/percepcion.md`; aplicado en el piloto |
| E | Motor cromático | Implementado y probado | `core/direccion.py`: 3 paletas, contraste WCAG medido, respeta la marca (prueba 20); el motor verifica `tokens.css` |
| F | Motor tipográfico | Implementado y probado | 3 combinaciones por personalidad, evita repetir fuentes de otros clientes y las de moda (prueba 20) |
| G | Motor de imágenes | Implementado y probado con bancos sin cuenta | `core/imagenes.py`: plan, Openverse, validación de archivo, filtro de contenido, WebP con Chrome, licencias, hoja de contactos. Pexels/Unsplash listos pero **sin probar** (faltan tus claves). IA de Hostinger: procedimiento asistido, **sin ejecutar** (requiere tu autorización de créditos) |
| H | Motor de animaciones | Implementado y probado en Chrome | `design-system/motion/` (propio) + GSAP 3.15.0, Lenis 1.3.26 y three.js 0.186.1 locales; prueba 24 |
| I | Signature Studio actualizado | Implementado y probado | Brief v3, selector de 4 modos, cambio de concepto, rondas; captura verificada de la pestaña Generación |
| J | Auditoría Signature | Implementado; probado con simulador | Capturas de página completa, por sección y páginas interiores; métricas medidas; crítica en otra sesión que solo escribe en `qa/` (`references/18`) |
| K | Optimización de consumo | Implementado | Modos, lectura modular de referencias por pasada, reutilización de investigación, reanudación por pasos, una ronda por defecto, estimación con datos medidos |
| L | Prueba piloto | Implementado y probado | `clients/sonrisa-norte-piloto`, comparación en `docs/piloto-sonrisa-norte/comparacion.png` |
| M | Manual | Hecho | `docs/manual-signature-2.md` |
| N | Informe final | Este documento | |

## Criterios de aceptación (sección 26)
| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 1 | La fábrica original sigue funcionando | ✓ Probado | 19 pruebas originales adaptadas + 5 nuevas, 24/24 |
| 2 | Studio conserva sus clientes | ✓ Probado | Equinsa y Sonrisa Norte intactos (git de cada cliente sin cambios de sitio) |
| 3 | Crear proyectos nuevos | ✓ Probado | Pruebas 15, 18, 23 |
| 4 | Definir tipografía y colores | ✓ Probado | Brief + motor cromático y tipográfico |
| 5 | Decisiones visuales fundamentadas | ✓ Implementado | Kit calculado + percepción + matriz de 8 criterios |
| 6 | Selección creativa según el sector | ✓ Implementado | Familias de color y perfiles de movimiento por sector (pruebas 20) |
| 7 | Recursos visuales de calidad | ◐ Parcial | Funciona; la calidad de los bancos sin cuenta es irregular. Mejora con claves gratuitas de Pexels o Unsplash |
| 8 | Procedimiento real de imágenes con IA autorizada | ◐ Implementado, sin ejecutar | Hoja `solicitud-ia.md`, importación y registro de créditos (prueba 22). No se gastaron créditos |
| 9 | Animaciones avanzadas | ✓ Probado | Escena ligada al scroll, máscaras, texto por líneas, parallax, cambio de fondo, transiciones entre páginas |
| 10 | Diseños realmente distintos | ✓ Implementado | Antirrepetición en el kit + detector de similitud; el piloto cambió de concepto conservando la marca |
| 11 | Sistema técnico reutilizable | ✓ | `design-system/motion`, `vendor`, módulos `core/` |
| 12 | Pruebas funcionales | ✓ Probado | QA + navegador; funciones del piloto comparadas con el original en Chrome |
| 13 | Inspección visual con navegador | ✓ Probado | 31 capturas por ejecución en el piloto |
| 14 | Corregir defectos de diseño | ✓ Probado en el piloto | La revisión con capturas encontró 6 defectos reales (imágenes que no aparecían por un error del motor de movimiento, desbordes, columnas apretadas) y se corrigieron |
| 15 | Conserva proyectos anteriores | ✓ | Etiquetas git y zip de respaldo |
| 16 | Modificaciones por instrucciones | ✓ Probado | Prueba 15 (modificar) |
| 17 | Aprovecha capacidades verificadas de Hostinger | ◐ Bloqueado en parte | Publicación estática por MCP ya verificada el 14/10. AI Builder e imágenes IA: solo procedimiento asistido (no tienen API pública ni están en el MCP según la documentación) |
| 18 | No publica sin autorización | ✓ Probado | Prueba 18; Studio nunca publica |
| 19 | Controles de consumo | ✓ | Confirmación, modos, tope por pasada, estimación medida |
| 20 | Repetible en otras industrias | ✓ Probado | Pruebas de sectores + kit por sector |

## Lo que falta o requiere tu autorización
1. **Primera ejecución real del motor 2.0 con Claude Code.** Todo el flujo automático se verificó con el simulador
   de pruebas, y el piloto lo construí en esta sesión con los mismos motores. Queda pendiente pulsar
   «Refinamiento Signature» sobre `sonrisa-norte-piloto` (≈1 a 3 M tokens) para ver la crítica independiente
   real. Requiere tu confirmación.
2. **Leer tu cuenta de Hostinger** (plan exacto, créditos de IA): reconecta el conector en claude.ai o ejecuta
   `claude mcp add --transport http hostinger https://mcp.hostinger.com`.
3. **Claves gratuitas de Pexels/Unsplash** (crear cuentas es decisión tuya) para fotografía de mejor nivel.
4. **Créditos de IA de Hostinger:** solo si los autorizas en el brief de un proyecto.
5. Lighthouse sigue sin medirse. Autoalojar las fuentes antes de publicar sigue pendiente.

## Seguridad
- Nuevo: cuarentena automática de `CLAUDE.md`, `AGENTS.md`, `.mcp.json` y `.claude/` dentro de un cliente (Claude
  Code los leería como instrucciones); Claude tampoco puede crearlos. El crítico no puede escribir en el sitio.
  La búsqueda web solo está permitida en la pasada de investigación.
- Imágenes: solo https, firma de archivo verificada, tope de 25 MB y filtro de contenido. Este filtro hizo falta: el
  banco devolvió una imagen inadecuada pese a su propio filtro.
- Sin cambios en permisos globales ni en autenticación. No se usa `--dangerously-skip-permissions`.

## Incidencias
- Al actualizar la copia personal de la skill (`~/.claude/skills`), Windows bloqueó borrar una carpeta y se
  perdieron los archivos de un respaldo **antiguo** (`skills-respaldo/fabrica-web-signature.anterior`, versión del
  17/10). La versión previa completa quedó guardada en `skills-respaldo/fabrica-web-signature.20261018-164336`, y
  todas las versiones están en el git de la fábrica. Corregí el instalador para que nunca borre respaldos.
- El motor de movimiento tenía un error que no detectaron las pruebas unitarias: las imágenes con «cortina» no
  aparecían. Lo encontré con las capturas del piloto y ya está corregido, con una prueba nueva.
