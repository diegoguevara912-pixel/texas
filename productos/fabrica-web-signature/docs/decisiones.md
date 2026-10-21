# Registro de decisiones

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10-14 | Motor y Studio en **Python con solo la biblioteca estándar** | El equipo tiene Python 3.15 pero no Node ni git. Cero instalaciones, nada que se rompa con actualizaciones. |
| 2026-10-14 | Sitios **estáticos HTML/CSS/JS** por defecto; frameworks solo si el proyecto lo justifica | Funcionan en cualquier plan de Hostinger, cargan rápido y no requieren compilación. Astro/Next quedan como opción documentada (requieren instalar Node con permiso). |
| 2026-10-14 | Una sola skill `fabrica-web-signature` con modos y 11 referencias, en lugar de 15 comandos separados | La especificación pide una skill maestra; las referencias se cargan bajo demanda y evitan cargar miles de líneas en cada sesión. Los 15 comandos del plugin de la nube se integraron como modos y módulos. |
| 2026-10-14 | Skill en dos lugares: proyecto (versionable) y personal (`instalar-skill`) | La de proyecto viaja con la carpeta; la personal la hace disponible desde cualquier carpeta del equipo. La copia personal se actualiza con `instalar-skill --forzar`. |
| 2026-10-14 | La base técnica compartida **no contiene diseño visual** | Evita que todas las webs se parezcan: solo se reutiliza infraestructura (accesibilidad, movimiento, formularios, servidor). |
| 2026-10-14 | Studio no lanza a Claude automáticamente | El CLI de Claude Code de este equipo no tiene sesión iniciada para uso por terminal y la automatización completa no estaría comprobada. Studio genera la orden y la etiqueta como "Claude Code". |
| 2026-10-14 | La publicación la hace Claude con el conector Hostinger; el motor solo prepara | Separa preparar (reversible, automático) de publicar (irreversible, requiere confirmación). |
| 2026-10-14 | Contacto por WhatsApp sin servidor como opción por defecto; formularios con servidor (PHP) solo cuando se pidan | WhatsApp es el canal principal en Honduras y no requiere backend; PHP no se puede probar en este equipo. |
| 2026-10-14 | Carpeta en el Escritorio dentro de OneDrive | Respaldo automático sin configurar nada. |
| 2026-10-14 | La prueba de reutilización usa carpetas temporales, no `clients/` | La especificación prohíbe presentar la demo como cliente real; `clients/` empieza vacío. |
| 2026-10-15 | La fábrica no incluye ninguna actividad comercial ni paso obligatorio de búsqueda de clientes | Indicación de Diego: esta etapa es solo la infraestructura. El primer proyecto empieza únicamente cuando él lo decida. |
| 2026-10-18 | Studio sí lanza a Claude: modo no interactivo oficial (`claude -p`) desde un supervisor en proceso aparte | Diego pidió un botón que ejecute de verdad. El supervisor sobrevive al cierre de Studio y deja todo en `motor/` para reanudar. Reemplaza la decisión del 2026-10-14. |
| 2026-10-18 | Permisos por lista blanca con `--permission-mode dontAsk` y `--permission-prompts none`, nunca `--dangerously-skip-permissions` | Nadie tiene que aprobar en pantalla y todo lo no permitido se niega solo. Claude escribe solo en su cliente y no tiene terminal: el motor ejecuta las pruebas. |
| 2026-10-18 | Estados derivados de evidencias (archivos nuevos, eventos de Claude, resultados del QA), no de lo que Claude «dice» | Requisito de no simular progreso. |
| 2026-10-18 | Pruebas de navegador con Chrome/Edge del equipo vía CDP (biblioteca estándar) en lugar de Playwright | Cero instalaciones; Chrome y Edge ya están. |
| 2026-10-18 | Historial git propio en cada cliente (como Equinsa), no en el repositorio de la fábrica | `clients/` está fuera del git de la fábrica para no mezclar clientes. |
| 2026-10-18 | El Claude Code de la app de escritorio requiere su propio inicio de sesión (`Conectar-Claude-Code.cmd`) | Es el mecanismo oficial; la fábrica no toca credenciales. |
| 2026-10-18 | Publicar sigue siendo una sesión de Claude con frase de autorización; Studio solo muestra el resumen | Publicar es irreversible y requiere el conector de Hostinger y la confirmación de Diego. |
| 2026-10-18 | Las imágenes las obtiene Python, no Claude | Claude sin terminal no puede descargar binarios; así además se validan licencia, tipo real y contenido sin gastar tokens. |
| 2026-10-18 | La crítica visual la hace otra sesión de Claude que solo escribe en `qa/` | Evita la autoevaluación inflada (la rúbrica 0.5 dio 9/10 a una página plana). |
| 2026-10-18 | Bibliotecas de animación locales (GSAP, Lenis, three.js) y motor propio sin dependencias | Sin CDN en producción, versiones fijas con huellas sha256; el motor propio cubre la mayoría de casos con 8 KB. |
| 2026-10-18 | Generación de imágenes de Hostinger solo por procedimiento asistido | No tiene API pública ni está en el MCP oficial; no se automatiza el panel ni se usan endpoints privados. |
| 2026-10-18 | Autorización de IA desactivada por defecto en el brief | No consumir créditos de terceros sin decisión explícita. |
| 2026-10-18 | Piloto en copia aislada `sonrisa-norte-piloto` | Diego pidió no sobrescribir Sonrisa Norte y poder comparar lado a lado en Studio. |

