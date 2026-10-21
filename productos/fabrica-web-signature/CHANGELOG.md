# Registro de cambios de la fábrica

## 2.0.0 — 2026-10-18 · Signature 2.0
- Auditoría con capturas reales: la causa de que Sonrisa Norte se viera «sencilla» fue que Claude no podía obtener imágenes, no había herramientas de movimiento, se revisaba solo la primera pantalla y la misma sesión se calificaba.
- **Motor de dirección** (`core/direccion.py`): 3 paletas con contraste WCAG medido (respeta la marca), 3 combinaciones tipográficas por personalidad, perfiles de movimiento, antirrepetición entre clientes, kit `diseno/kit-direccion.md`, huella del brief para reutilizar la investigación.
- **Motor de imágenes** (`core/imagenes.py`): plan de Claude → Openverse (y Pexels/Unsplash con claves), firma de archivo, filtro de contenido, resolución mínima, WebP con Chrome (≤ 380 KB), licencias, `creditos.html`, hoja de contactos, IA asistida de Hostinger con registro de créditos, poda de lo no usado.
- **Motor de movimiento** (`design-system/motion/`): revelados, texto por líneas, máscaras, parallax, escenas por progreso de scroll, trazos, contadores, magnetismo, cambio de fondo, cabecera, View Transitions; reducido y ligero automáticos. Bibliotecas locales GSAP 3.15.0, Lenis 1.3.26, three.js 0.186.1.
- **Navegador**: sesión reutilizable, capturas de página completa y por sección (escritorio y móvil) de todas las páginas, contraste medido en textos reales, objetivos táctiles, contenido oculto, movimiento reducido, imágenes sin dimensiones o pesadas.
- **Motor**: 20 etapas con evidencia, modos (completo, rápido, refinamiento, cambio de dirección), crítica independiente en otra sesión con permisos solo de `qa/`, corrección localizada (1-2 rondas), verificación de paleta, instalación de bibliotecas pedidas, estimación de consumo con datos medidos, cuarentena de `CLAUDE.md`/`.claude/` en clientes.
- **Brief v3**: estrategia, preferencias avanzadas y recursos visuales (autorización de IA desactivada por defecto). Studio: selector de modos, cambio de concepto, rondas. CLI: `kit`, `imagenes`, `refinar`, `cambiar-concepto`, `generar --modo`.
- Skill: referencias 14-18 y módulo 02 reequilibrado (impacto + disciplina).
- Piloto `sonrisa-norte-piloto` («Una pausa luminosa»). 24 pruebas.

## 0.5.0 — 2026-10-18
- **Botón GENERAR PÁGINA WEB SIGNATURE**: Studio lanza Claude Code en modo no interactivo oficial (`claude -p`, `stream-json`) desde un supervisor aparte (`core/motor.py`). Permisos limitados: modo `dontAsk`, escritura solo en `clients/<cliente>/`, sin terminal ni subagentes ni MCP, lectura de otros clientes y de `negocio/` negada. No se desactivan las comprobaciones de permisos.
- **Estados reales** (14) detectados por los archivos que Claude produce y por su registro; registro de actividad, errores comprensibles, cancelar y reanudar (reanuda la sesión de Claude), un solo proceso a la vez, consumo informado.
- **Pruebas de navegador** sin instalar nada (`core/navegador.py`): Chrome/Edge sin ventana vía CDP; desbordes en 390/820/1440, errores de consola, recursos rotos, imágenes, tipografías aplicadas y capturas. El QA las incorpora.
- **Revisión Signature automática**: segunda pasada de Claude que mira capturas y QA, corrige, y se vuelve a probar.
- **Modificaciones automáticas**: «Aplicar cambio con Claude» (respaldo, cambio, pruebas, vista previa e historial git del cliente).
- **Brief ampliado** (versión 2): sección Tipografía (catálogo de 50 fuentes OFL/Apache con muestra en vivo, peso, estilo, mayúsculas, fuente personalizada con licencia), colores principales y secundarios con selector, competidores, logotipo y fotos (ruta), preferencias creativas, instrucciones adicionales, funcionalidades Animaciones, 3D e Integraciones. Los 8 obligatorios no cambian.
- **Publicación**: APROBAR Y PREPARAR PUBLICACIÓN y PUBLICAR EN HOSTINGER (resumen previo; Studio nunca publica).
- QA: nueva comprobación de tipografía del brief aplicada con variables CSS.
- Skill: «Modo motor automático» y módulo `13-referente-equinsa.md`. Docs: auditoría de Equinsa, manual de generación, informe de verificación. `Conectar-Claude-Code.cmd`.
- 19 pruebas (nuevas 14–19; el motor se prueba con un simulador de Claude que no gasta uso).

## 0.4.0 — 2026-10-17
- Signature Studio protegido con llave de acceso nueva en cada apertura (el enlace sale en la ventana negra); rechaza acciones de otros sitios.
- Nuevas pestañas por cliente: Dominio (renovación pagada/pendiente, vencimiento, historial) y Plan y pagos (plan, suscripción, pagos).
- Nueva pantalla Negocio: clientes, suscripciones activas, ingreso mensual recurrente, cobrado y por cobrar, costos, resultado, punto de equilibrio, ingresos y clientes por mes, dominios por vencer, planes y precios (valor de la página + dominio con precio de referencia de Hostinger) y costos del negocio. Datos en negocio/ (fuera de git) y en clients/<cliente>/negocio.json.
- Nueva pantalla Privacidad y seguridad; plantilla biblioteca/politica-privacidad.md; el QA exige privacidad.html donde hay formularios; reglas RLS obligatorias si un proyecto usa base de datos.
- Cambios: botón para copiar la orden de Claude. Aplicar cambios sin sesión de Claude desde Studio quedó fuera: el control de seguridad de Claude Code bloqueó lanzar un agente automático desde la interfaz.
- 13 pruebas (nueva test_13 de negocio; test_10 cubre la llave).

## 0.3.1 — 2026-10-17
- Nuevo instalador de clientes (`Instalar-Cliente.cmd`, `instalar-cliente.ps1`, `LEEME.md`). Corregido: avisa si el zip no trae `estado.json` (los zip de la nube no lo traen y `fabrica qa` decía "No existe el cliente"); git ahora guarda cada cliente en su propio historial dentro de `clients\<cliente>` (antes `git add` fallaba en silencio porque `clients/` está en `.gitignore`) y conserva el historial al reinstalar.
- Primer cliente instalado: `equinsa-energy` (demo), registrado con `estado.json`, `brief.json` y `diseno/identidad.json`. Zips procesados en `descargas-procesadas/`.

## 0.3.0 — 2026-10-17
- Modo ficha apunta a Hostinger AI Builder (modo agente), ficha completa en un solo mensaje y tabla de créditos por proyecto (`creditos`).
- Nueva `biblioteca/`: plantilla de ficha (la usa `ficha`), revisión antes de enviar, bloques de texto; compatible con Obsidian (opcional).
- anime.js v4 solo para el camino a medida, local y con movimiento reducido.
- Regla: el modo ficha no usa agentes. README: sección "Para aprender".

## 0.2.0 — 2026-10-15
- Modo "ficha para Hostinger" (camino por defecto): comando `ficha <cliente>`, módulo `references/12-modo-hostinger.md`, prueba test_12. Claude define el sitio y un constructor de Hostinger lo construye.

## 0.1.1 — 2026-10-15
- Verificación final: skill activada en sesión nueva, 11 pruebas (nueva test_11: Signature por defecto, abrir y modificar), 8 sectores, vista previa y QA.
- Se quitaron referencias a "primer negocio" y "vender" del estado y del brief: la fábrica no tiene pasos comerciales obligatorios.

## 0.1.0 — 2026-10-14
Primera versión operativa.
- Skill `fabrica-web-signature` con 8 modos, flujo permanente A→M y 11 módulos de referencia (los 22 de la especificación).
- Brief Inteligente Signature (esquema único A–J) con validación.
- Motor de proyectos: creación sin sobrescribir, aislamiento, etapas, historial, cambios, base técnica.
- Control de calidad automático (~25 comprobaciones) y detector de similitud creativa.
- Preparación de producción (SEO, zip con manifiesto, checklist), registro de publicación, entrega y respaldos.
- Signature Studio: clientes, brief, vista previa, calidad, cambios, archivos y publicación.
- 10 pruebas automáticas de la fábrica.
- Integra y reemplaza el plugin de 15 comandos hecho en la nube (v0.1.0).
