# Estado de FÁBRICA WEB SIGNATURE

Última actualización: 2026-10-18 · Versión 2.0.0 (Signature 2.0, 24 pruebas) · Estado: **motores 2.0 listos y probados; piloto de Sonrisa Norte construido; falta la primera ejecución real del motor 2.0 con Claude Code (requiere confirmación de consumo de Diego)**

## Estado actual (2.0.0)
- Informe final y criterios: `docs/informe-signature-2.md`. Auditoría: `docs/auditoria-signature-2.md`. Manual: `docs/manual-signature-2.md`.
- Nuevos módulos: `core/direccion.py` (paletas WCAG, tipografía, movimiento, antirrepetición, kit),
  `core/imagenes.py` (plan, bancos con licencia, filtro, WebP, licencias, IA asistida, créditos),
  `core/navegador.py` (sesión reutilizable, páginas completas, recortes por sección, métricas, conversión WebP),
  `design-system/motion/` (motor de movimiento propio) y `design-system/vendor/` (GSAP, Lenis, three.js locales).
- Motor (`core/motor.py`): 20 etapas con evidencia, modos completo/rapido/refinamiento/redireccion, pasadas
  dirección → (motor: paleta, imágenes, bibliotecas) → construcción → pruebas → crítica independiente (solo `qa/`)
  → corrección localizada. Cuarentena de archivos de instrucciones en clientes.
- Brief v3 (secciones S, V, R). Skill: referencias 14-18 y SKILL.md actualizados.
- Clientes: `equinsa-energy` (intacto), `sonrisa-norte` (intacto, etiqueta `version-original-v1`),
  `sonrisa-norte-piloto` (piloto 2.0, git propio).
- Recuperación: etiqueta `recuperacion-v0.5.0` + zip en `%USERPROFILE%\Respaldos-Fabrica-Web-Signature\`.

### Siguiente paso
1. Diego: «Refinamiento Signature» sobre `sonrisa-norte-piloto` para la primera crítica independiente real (≈1-3 M tokens).
2. Hostinger: reconectar el conector y leer plan/créditos (solo lectura).
3. Opcional: claves gratuitas de Pexels/Unsplash en `negocio/claves-imagenes.env`.
4. Medir Lighthouse; autoalojar fuentes antes de publicar.

## Historial (0.5.0)

- **Botón GENERAR PÁGINA WEB SIGNATURE** en Studio: lanza Claude Code no interactivo (`core/motor.py`)
  con permisos limitados, 14 estados reales, registro, errores, cancelar y reanudar. Modificaciones
  con "Aplicar cambio con Claude". Pruebas en Chrome (`core/navegador.py`). Brief con tipografía.
- Clientes: `equinsa-energy` (demo, intacta) y `sonrisa-norte` (clínica FICTICIA, brief listo, sin sitio).
- Verificado con un simulador de Claude; **la primera ejecución con Claude real está pendiente** porque
  el Claude Code de la app no tiene sesión para uso automático. Paso de Diego: `Conectar-Claude-Code.cmd`.
- Informe completo y criterios de aceptación: `docs/informe-verificacion.md`. Manual: `docs/manual-generacion.md`.
- Puntos de recuperación (git local de la fábrica): etiqueta `recuperacion-v0.4.0` = antes de la automatización.

### Siguiente paso
1. Diego: `Conectar-Claude-Code.cmd`, reiniciar Studio, y GENERAR para `sonrisa-norte` (prueba real).
2. Revisar en `motor/<id>/registro.txt` si Claude Code negó alguna acción por permisos y ajustar
   `permisos()` en `core/motor.py` si hiciera falta.
3. Consultar Hostinger (solo lectura) desde una sesión con el conector.

## Historial (0.2.0, 2026-10-15)
La parte de abajo describe la verificación de la infraestructura original.

## Para continuar en otra sesión
Abre Claude en esta carpeta y di "Continúa construyendo FÁBRICA WEB SIGNATURE". Lee este archivo,
`docs/arquitectura.md` y `docs/decisiones.md`, y ejecuta `python -m unittest discover -s tests -v`.

## Verificación final (2026-10-15)
| Lo que se pidió verificar | Resultado | Evidencia |
|---|---|---|
| La skill `/fabrica-web-signature` funciona | ✓ Verificado | La skill aparece en la lista de skills de una sesión nueva de Claude Code y se activó con el argumento `clientes`: cargó sus instrucciones con la ruta real de la fábrica y ejecutó el modo Administración (`listar`). |
| El brief crea proyectos de cualquier sector | ✓ Verificado | Se crearon por terminal 8 proyectos ficticios (clínica dental, arquitectura, restaurante, agrícola, energía solar, vehículos, logística, abogados) y 4 más en test_03, en carpetas temporales que luego se borraron. |
| Signature es el nivel predeterminado | ✓ Verificado | test_11: un brief que pide otro nivel queda guardado como SIGNATURE, también después de editarlo. El estándar está escrito en la skill. |
| Proyectos independientes, sin mezclar información | ✓ Verificado | test_04, test_05; en la prueba de 8 sectores, 0 coincidencias de datos del proyecto 1 en los otros 7. |
| Guardar, abrir y modificar proyectos | ✓ Verificado | test_04 y test_11: leer brief, editarlo con historial, registrar cambios, respaldo y restauración del sitio, historial. Studio abre y edita (test_10). |
| Flujo de desarrollo, vista previa y pruebas configurado | ✓ Verificado (mecánica) | Etapas A→M registrables; `iniciar-sitio` copió la base técnica; `vista-previa` respondió HTTP 200 con una página técnica de prueba; `qa` ejecutó 25 comprobaciones y detectó correctamente lo que faltaba. |
| | ○ Sin ejecutar | El diseño y la construcción de una web real con el motor creativo: se comprueba con el primer proyecto, cuando Diego decida. |
| Hostinger preparado sin publicar | ✓ Verificado | El conector Hostinger responde (catálogo consultado el 14 y el 15/10). Operaciones de listado, subida y despliegue confirmadas. No se leyó la cuenta ni se modificó nada. |
| Documentación clara | ✓ | `README.md` (13 apartados), `docs/` (arquitectura, decisiones, entornos, hostinger, aprendizaje), este archivo. |

Pruebas automáticas: `python -m unittest discover -s tests -v` → **11/11 aprobadas** (2026-10-15).

## Tabla de cumplimiento (sección 30 de la especificación)
| # | Criterio | Estado |
|---|---|---|
| 1 | Archivos principales existen | Completado y verificado |
| 2 | Skill reconocible por Claude Code | Completado y verificado |
| 3 | Activable por su nombre | Completado y verificado |
| 4 | El brief puede completarse | Completado y verificado |
| 5 | Puede guardarse información | Completado y verificado |
| 6 | Iniciar un proyecto nuevo | Completado y verificado |
| 7 | Proyectos independientes | Completado y verificado |
| 8 | Motor de diseño Signature incorporado | Completado (instrucciones y detector de similitud verificados; la calidad creativa se medirá con el primer proyecto) |
| 9 | Instrucciones técnicas para desarrollar | Completado |
| 10 | Pruebas ejecutables | Completado y verificado |
| 11 | Procedimiento de vista previa | Completado y verificado |
| 12 | Publicación requiere aprobación | Completado y verificado |
| 13 | Integración Hostinger documentada | Completado |
| 14 | Existe un manual | Completado |
| 15 | Reutilizable en nuevas sesiones | Completado y verificado (skill cargada en sesión nueva) |

Bloqueado por permisos: leer la cuenta de Hostinger (planes, sitios, dominios) hasta que Diego lo autorice.

## Pendiente (mejoras opcionales, sin urgencia)
1. Leer la cuenta de Hostinger (plan y constructor disponible): Diego lo autorizará cuando un proyecto llegue a esa fase; preguntárselo entonces, no antes.
2. Optimización de imágenes local (instalar Pillow con permiso, o usar Squoosh web).
3. Plantilla de formulario con servidor (PHP) cuando un proyecto lo necesite; no se puede probar aquí.
4. Lighthouse automático (requiere Node.js).
5. git para historial de versiones (requiere instalarlo con permiso).
6. Revisión visual de Signature Studio por Diego: las capturas del navegador de Claude fallaron por tiempo de espera; la funcionalidad sí se comprobó.
