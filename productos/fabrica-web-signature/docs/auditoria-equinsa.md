# Auditoría del proyecto Equinsa Energy (fase 1)

Fecha: 2026-10-18 · Carpeta revisada (solo lectura): `clients/equinsa-energy/` · No se modificó nada.

Leyenda de evidencia:
- **[C] Comprobado en archivos**: lo vi en el código o en los archivos del proyecto.
- **[R] Documentado en registros**: lo dice un registro (informe, historial, estado, resultados de QA), pero no lo puedo repetir desde aquí.
- **[I] Inferido**: deducción razonable a partir de lo anterior.
- **[N] No recuperable**: no hay rastro suficiente.

## 1. Qué hay en la carpeta
| Elemento | Hallazgo | Evidencia |
|---|---|---|
| Código fuente | `sitio/index.html` (668 líneas, una sola página con 9 secciones ancladas), `privacidad.html`, `404.html`, `assets/css/styles.css` (313 líneas), `assets/js/main.js` (257 líneas), `.htaccess`, `robots.txt` | [C] |
| Framework | Ninguno: HTML, CSS y JavaScript sin compilación. No usa la base técnica de la fábrica (`design-system/base-tecnica/`): no hay carpeta `base/` en el sitio | [C] |
| Bibliotecas | Ninguna en el sitio. Solo Google Fonts (Sora 600/700, Source Sans 3 400/600) con carga no bloqueante | [C] |
| Tokens de diseño | Variables CSS en `:root` de `styles.css` (`--c-*` colores, `--font-titulo`, `--font-texto`, escala `--fs-0…5` con `clamp`, espacios, radios). `diseno/sistema.md` dice `tokens.css`, pero ese archivo no existe: los tokens viven en `styles.css` | [C] |
| Colores | Azul plano #0B2545, tinta #13355F, verde #0F7A52, verde luz #7FE0A8, blanco, niebla #EEF3F8, grafito #4A5A70. `concepto.md` e `identidad.json` todavía dicen verde #12865A: se oscureció a #0F7A52 por contraste y la identidad no se actualizó | [C] |
| Imágenes | 11 dibujos SVG en línea hechos para el proyecto, `favicon.svg`, `og-equinsa.png` (captura del propio sitio). Ninguna foto de terceros | [C] |
| Animaciones | Flujo de energía del "plano vivo" (CSS + JS), detenido con `prefers-reduced-motion`. Respuestas a acciones (menú, filtros, diálogo) | [C] + [R] |
| Funcionalidades | Selector Sol/Biogás, diagnóstico de 3 preguntas, filtros de proyectos con ficha en diálogo, formulario de cotización validado (modo demo sin envío), WhatsApp en modo demo, menú móvil, datos estructurados LocalBusiness, Open Graph | [C] (`main.js`, `index.html`) |
| Documentación | `brief.md` (A–J con etiquetas HECHO/HIPÓTESIS/PENDIENTE), `investigacion/analisis.md` (12 fuentes con URL), `diseno/concepto.md` (3 conceptos), `diseno/sistema.md`, `diseno/identidad.json`, `entrega/informe.md`, `recursos/licencias.md`, `entrega/ficha-hostinger.md` | [C] |
| Pruebas | `qa/pruebas-equinsa.js` (Playwright + axe-core, 50 comprobaciones), `qa/resultados.md`, `qa/pruebas-1.json` y `pruebas-4.json` (pasadas guardadas), `qa/htmlvalidate-1.txt`, 7 capturas en `qa/capturas/`, `qa/ULTIMO.md` (QA estático de la fábrica local: 19 aprobadas, 0 críticas, 3 advertencias) | [C] |
| Prompts guardados | No hay un prompt guardado del desarrollo; el `brief.md` dice que se llenó desde la sesión en la nube | [N] para el prompt exacto |
| Registro de cambios | `HISTORIAL.md` (instalación, QA, similitud, un cambio pedido, ficha), `cambios-solicitados.md` (1 pendiente: "que parezca una página de 200 mil dólares") | [C] |
| Historial git | Un solo commit (2026-10-17 18:35, instalación desde el zip). El historial del desarrollo en la nube no viajó con el proyecto | [C] / [N] |
| Hostinger | `.htaccess` con 404, cabeceras de seguridad, caché y `noindex` de demo. `ficha-hostinger.md` generada con apartados sin completar. Nunca se publicó | [C] |

## 2. Flujo real reconstruido
| # | Paso | Cómo se hizo | Manual o automático | Evidencia |
|---|---|---|---|---|
| 1 | Recibir la información | Brief A–J escrito por Claude en la nube a partir de la petición de Diego, siguiendo el formato del Brief Inteligente | Manual (Claude en conversación); el formulario de Studio no se usó | [R] nota en `brief.md` |
| 2 | Investigar el negocio | Búsqueda web con 12 fuentes, cada afirmación etiquetada HECHO o HIPÓTESIS y separando lo que es de Equinsa de lo que es del grupo | Claude, sin herramienta de la fábrica | [C] `analisis.md` |
| 3 | Dirección creativa | 3 conceptos (Plano vivo, Mediodía hondureño, Ciclo cerrado), con razones para descartar y "materia prima del mundo del cliente" | Claude; Diego no eligió (pidió no detenerse) | [C] `concepto.md` |
| 4 | Sistema visual | Paleta con usos y reglas, escala tipográfica 1.25, retícula de 12 columnas, principios y "revisión contra lo genérico" | Claude | [C] `sistema.md` |
| 5 | Construcción | HTML/CSS/JS a mano, SVG propios, sin base técnica de la fábrica | Claude | [C] `sitio/` |
| 6 | Recursos | Solo recursos propios y fuentes OFL, registrados en `licencias.md` | Claude | [C] |
| 7 | Pruebas | Script Playwright + axe con 50 pruebas, html-validate y Lighthouse en la nube | Claude escribió y ejecutó las pruebas | [R] `resultados.md`; el script existe [C], pero depende de rutas de la nube (`/opt/node-tools`, `/mnt/project-files`) y no corre aquí tal cual |
| 8 | Corrección | Primera pasada 45/50 y 11 avisos; se corrigieron contraste, región del aviso, descripción, carga de fuentes y tamaño de cajas, y se repitió todo | Claude (bucle probar → corregir → probar) | [R] `resultados.md` |
| 9 | Entrega | Informe con fuentes, datos pendientes y resultados reales; zip descargado e instalado con `Instalar-Cliente.cmd` | Claude + Diego (instalación) | [C] `informe.md`, commit de instalación |
| 10 | QA local | `fabrica qa` y similitud ejecutados al instalar | Automático (instalador) | [C] `qa/ULTIMO.md`, `HISTORIAL.md` |
| 11 | Cambios | Diego registró un cambio en Studio; nunca se aplicó | Registrado, sin ejecutar | [C] `cambios-solicitados.md` |

No recuperable [N]: la conversación de la nube, cuánto tiempo y cuántos tokens costó, qué intentos de diseño se descartaron antes del final, y el orden exacto de las correcciones más allá de lo que dice `resultados.md`.

## 3. Qué hizo que funcionara (criterios reutilizables, no apariencia)
1. **Un concepto nacido del mundo del cliente** (los planos de un grupo eléctrico), no de una tendencia. → Regla: cada concepto lista su "materia prima" verificable.
2. **Un solo elemento memorable** (el plano del hero) y todo lo demás sobrio. → Regla: escribir cuál es y por qué explica el negocio en 5 segundos.
3. **Revisión contra lo genérico escrita**: cambió "números grandes" por una línea de tiempo real y tarjetas iguales por filas con dibujo propio.
4. **Honestidad visible**: HECHO/HIPÓTESIS/PENDIENTE, "Ejemplo ilustrativo", "Foto real pendiente", demo `noindex`.
5. **Funciones que califican al prospecto** (diagnóstico → preselección en el formulario; preguntas obligatorias según la solución).
6. **Tipografía con tokens**: dos familias, escala fija con `clamp`, reglas de uso (sin mayúsculas sostenidas).
7. **Bucle de calidad medido**: probar en navegador real, corregir y volver a probar; reportar lo no ejecutado.
8. **Sitio estático ligero** (~300 KB) compatible con cualquier plan de Hostinger.

## 4. Lo que estaba manual y ahora se automatiza
| Antes (Equinsa) | Ahora (motor de la fábrica) |
|---|---|
| Brief escrito en conversación | Formulario ampliado de Studio con validación y tipografía |
| Claude lanzado a mano en una sesión | Botón GENERAR: Studio inicia Claude Code en modo no interactivo con permisos limitados al proyecto |
| Etapas anotadas al final | Estados reales detectados por archivos producidos y por el registro de Claude |
| Script de pruebas hecho a mano para un sitio | Pruebas de navegador genéricas de la fábrica (capturas, desbordes, errores de consola, recursos rotos, fuentes aplicadas) para cualquier sitio |
| Corrección tras leer resultados | Segunda pasada automática de Claude: revisa capturas y QA, corrige, y se vuelve a probar |
| Cambio registrado sin aplicar | "Aplicar cambio": Claude modifica solo lo pedido, se prueba y queda en el historial git del proyecto |

## 5. Inconsistencias encontradas (no se corrigieron: Equinsa queda intacta)
- `identidad.json` y `concepto.md` dicen verde #12865A; el sitio usa #0F7A52.
- `sistema.md` menciona `tokens.css`, que no existe.
- `estado.json` dice etapa "vista_previa" con el cambio pendiente sin aplicar.
- `qa/pruebas-equinsa.js` no corre en este equipo (rutas de la nube).
