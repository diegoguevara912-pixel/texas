# FÁBRICA WEB SIGNATURE

Sistema para convertir la información de una empresa en una página web Signature: con dirección
creativa propia, que funciona de verdad, probada y lista para publicar en Hostinger cuando tú lo
autorices. Sirve para cualquier sector. Se construyó una vez para usarse con muchos clientes.

**Cómo se reparte el trabajo**

| Quién | Qué hace |
|---|---|
| **Signature Studio** (interfaz local) | Guarda clientes y briefs, **inicia a Claude con el botón GENERAR**, muestra el progreso real, abre vistas previas, ejecuta pruebas (también en Chrome), aplica cambios, registra aprobaciones y prepara el paquete de publicación. |
| **Claude Code** con la skill `/fabrica-web-signature` | Investiga, crea 3 conceptos, diseña la identidad, programa la web, revisa la calidad y aplica cambios (lanzado por Studio o en una sesión manual), y publica en Hostinger con tu confirmación. |
| **Tú** | Llenas el brief, revisas, pides cambios, apruebas y confirmas la publicación. |

---

## 1. Abrir la fábrica
La carpeta es `Escritorio\Fabrica-Web-Signature` (dentro de OneDrive, así que queda respaldada).

- **Interfaz:** doble clic en `Abrir-Signature-Studio.cmd`. Se abre `http://127.0.0.1:4100/` en tu
  navegador. Deja la ventana negra abierta mientras lo usas. Solo funciona en tu equipo.
- **Claude:** abre Claude (app de escritorio, pestaña Code) y elige la carpeta `Fabrica-Web-Signature`.

## 2. Activar la skill
Escribe en Claude Code `/fabrica-web-signature` o dilo con tus palabras:
"Crear una nueva web Signature", "Abrir mi fábrica de páginas web", "Modificar la página del
cliente X", "Abrir vista previa del cliente Y", "Preparar publicación", "Revisar mis clientes".

La skill está instalada dos veces: en esta carpeta (`.claude/skills/`) y como skill personal
(`%USERPROFILE%\.claude\skills\`), así funciona aunque abras Claude en otra carpeta de este equipo.
En sesiones en la nube no está disponible automáticamente: ver `docs/entornos.md`.

## Novedad 0.5: GENERAR PÁGINA WEB SIGNATURE
Llenas el brief, pulsas **GENERAR** y la fábrica hace el resto con Claude Code: análisis, tres
conceptos, identidad, código, pruebas en Chrome, revisión Signature y vista previa. Los cambios se
piden en «Cambios → Aplicar cambio con Claude». Primera vez: doble clic en `Conectar-Claude-Code.cmd`.
**Manual paso a paso: `docs/manual-generacion.md`.** Auditoría del proceso de Equinsa:
`docs/auditoria-equinsa.md`. Resultados de la verificación: `docs/informe-verificacion.md`.

## 3. Crear un cliente
**Opción A (recomendada):** Studio → *Nuevo cliente* → llena el Brief Inteligente Signature → *Guardar brief*.
Solo 8 campos son obligatorios; el resto puede quedar vacío. Incluye tipografía (catálogo de 50
fuentes con licencia libre y muestra en vivo), colores con selector, funcionalidades e instrucciones
adicionales. Con **GENERAR PÁGINA WEB SIGNATURE** guardas y empiezas la generación en un solo paso.

**Opción B:** en Claude Code: `/fabrica-web-signature nuevo` y cuéntale el negocio con tus palabras.

Cada cliente queda en `clients/<identificador>/`, separado de los demás.

## 4. Completar el formulario
El brief tiene las secciones A–J (identificación, servicios, objetivos, tipo de web, identidad
visual, contenido, contacto, funcionalidades, recursos y nivel creativo). El nivel es siempre
SIGNATURE. Si eliges "demostrativo", la web usa datos de ejemplo marcados y no se indexa en Google.
Para editarlo: Studio → cliente → *Brief*. La versión anterior se guarda en `historial/`.

## 5. Iniciar el desarrollo
**Automático (nuevo):** Studio → cliente → **Generación** → marca la casilla de consumo → **GENERAR**.
Ves cada etapa (Proyecto recibido … Pendiente de aprobación) marcada solo cuando ocurre de verdad.
Detalle en `docs/manual-generacion.md`.

**Ficha para Hostinger (ahorra tokens).** En Claude Code:
`/fabrica-web-signature ficha <identificador>`. Claude piensa el sitio (análisis, 3 conceptos,
identidad y textos) y lo entrega en `entrega/ficha-hostinger.md`. Tú la pegas en el constructor con
IA de Hostinger (AI Builder, que desde agosto de 2026 reúne a Website Builder y Horizons), ajustas en
su editor y apruebas. Cada mensaje en AI Builder gasta créditos: anótalos con
`fabrica creditos <cliente> "mensaje" <créditos>` para saber cuánto cuesta cada página. Además de la ficha,
Hostinger necesita: un plan con constructor, el logo/fotos/datos reales del cliente, un dominio y
los ajustes finales (formulario, WhatsApp, redes). Detalle: `references/12-modo-hostinger.md`.

**Código a medida (más exclusivo, más tokens):** `/fabrica-web-signature desarrollar <identificador>`
(Studio te muestra la orden exacta con un botón *Copiar orden*; Studio no la ejecuta por ti).
Claude sigue el flujo permanente: comprender el negocio → 3 conceptos → identidad propia →
construir → recursos con licencia → pruebas → mejoras → vista previa.

## 6. Abrir una página
- Studio → cliente → *Vista previa* (móvil, tableta y escritorio), o *Abrir en pestaña nueva*.
- Sin Studio: `fabrica vista-previa <identificador>` y abre la dirección que aparece.

## 7. Solicitar modificaciones
Studio → cliente → *Cambios* → escribe el cambio → marca la casilla de consumo → **Aplicar cambio con
Claude**. El motor respalda el sitio, Claude cambia solo lo pedido, se repiten las pruebas, se actualiza
la vista previa y se guarda en el historial git del cliente. *Solo registrar* + `/fabrica-web-signature
modificar <identificador>` en una sesión manual sigue funcionando.

## 8. Revisar proyectos
Studio → *Clientes* muestra todos con su etapa. En terminal: `fabrica listar` y `fabrica estado <identificador>`.

## 9. Ejecutar pruebas
- Del sitio de un cliente: Studio → *Calidad* → *Ejecutar pruebas automáticas* (o `fabrica qa <id>`).
  Cada prueba sale como aprobada, fallida o no ejecutada. La revisión visual y la rúbrica Signature
  las hace Claude y quedan en `clients/<id>/qa/`.
- En Chrome/Edge sin ventana: `fabrica navegador <id>` (el motor lo hace solo): desbordes en 390/820/1440 px,
  errores de consola, recursos rotos, tipografías aplicadas y capturas en `qa/capturas/auto-*.png`.
- De la fábrica completa: `python -m unittest discover -s tests -v` (19 pruebas).

## 10. Preparar la publicación
Studio → *Publicación* → **APROBAR Y PREPARAR PUBLICACIÓN** (hace los dos pasos de abajo) y luego
**PUBLICAR EN HOSTINGER**, que muestra proyecto, destino, archivos, pruebas, sitios afectados, costos y
operaciones antes de darte la orden para Claude. Los pasos por separado siguen disponibles:
1. Revisa la vista previa. Si estás de acuerdo: Studio → *Publicación* → *Registrar aprobación*.
2. *Preparar paquete* con el dominio final (ej. `https://midominio.com`). Esto prueba el sitio, genera
   `sitemap.xml`/`robots.txt` y crea el zip y la lista de verificación en `entrega/deploy/`.
   **No publica nada.**

## 11. Conectar y usar Hostinger
El conector **Hostinger** ya aparece conectado en tus sesiones de Claude (comprobado el 14/10/2026).
Para publicar: `/fabrica-web-signature publicar <identificador>`. Claude busca el sitio de destino,
te muestra qué se reemplaza y espera que escribas algo como
"Autorizo publicar <id> versión 1 en midominio.com". Sin esa frase no publica.
Detalles, compatibilidad y reversión: `docs/hostinger.md`.

## 12. Respaldar el sistema
- La carpeta está en OneDrive: se respalda sola. Para una copia extra, comprime la carpeta completa.
- Antes de cambios grandes en un sitio: `fabrica respaldo <id>` (copia en `clients/<id>/respaldos/`).
- Cada paquete publicado queda guardado en `entrega/deploy/`.
- No guardes contraseñas en esta carpeta.

## Negocio, dominios y privacidad (Studio)
- **Entrar:** Studio crea una llave nueva cada vez que lo abres y entra solo con ella. Si cierras el
  navegador, usa el enlace que aparece en la ventana negra.
- **Dominio** (en cada cliente): registra el dominio, cuándo vence y si la renovación está pagada o pendiente.
- **Plan y pagos** (en cada cliente): plan, suscripción y cada pago (página, suscripción, dominio).
- **Negocio** (menú): clientes, ingresos, costos, crecimiento por mes, dominios por vencer, planes y precios.
  El precio de cada plan es el valor de la página (lo defines tú) más el dominio (precio de referencia
  de Hostinger, editable) y, si quieres, una mensualidad.
- **Privacidad y seguridad** (menú): cómo se protegen los datos. Las páginas que recogen datos llevan
  su política de privacidad (`biblioteca/politica-privacidad.md`).

## 13. Actualizar componentes
- La base técnica compartida está en `design-system/base-tecnica/` (accesibilidad, movimiento,
  formularios, `.htaccess`). Mejórala ahí y anótalo en `CHANGELOG.md`.
- Los proyectos ya hechos **no** se actualizan solos: se copian los cambios solo después de revisar
  el impacto en cada uno.
- Si cambias la skill, vuelve a instalar la copia personal: `fabrica instalar-skill --forzar`.

---

## Para aprender (opcional)
- [blog.vibecoder.me](https://blog.vibecoder.me): tutoriales gratis sobre construir con IA (en inglés). Solo lectura.
- La carpeta `biblioteca/` (plantilla de ficha, revisión y bloques de texto) se puede abrir como
  bóveda en Obsidian si quieres; no es necesario.

## Comandos de terminal (opcional)
Desde la carpeta de la fábrica, en PowerShell o CMD: `.\fabrica <comando>` (o `python core\fabrica.py <comando>`).

| Comando | Para qué |
|---|---|
| `diagnostico` | Revisa el equipo |
| `motor-diagnostico` · `conectar-claude` | Estado y sesión de Claude Code para el motor |
| `generar <id>` · `aplicar-cambio <id> "texto"` | Generación y cambios automáticos (piden confirmar el consumo) |
| `motor-estado <id>` · `navegador <id>` | Progreso del motor · pruebas en Chrome |
| `nuevo --brief archivo.json` | Crea un cliente |
| `listar` · `estado <id>` | Ver clientes y etapas |
| `cambio <id> "texto"` | Registrar un cambio |
| `vista-previa <id>` | Servir el sitio |
| `qa <id>` · `similitud <id>` | Pruebas y comparación creativa |
| `respaldo <id>` · `entrega <id>` | Respaldo y paquete para el cliente |
| `preparar-produccion <id> --dominio https://…` | Paquete de publicación (no publica) |
| `registrar-publicacion …` | Anota una publicación real ya hecha |

## Dónde está cada cosa
```
Fabrica-Web-Signature/
  Abrir-Signature-Studio.cmd   fabrica.cmd
  README.md  PROJECT_STATUS.md  CHANGELOG.md  CLAUDE.md
  .claude/skills/fabrica-web-signature/   ← la skill (SKILL.md + 11 módulos en references/)
  apps/studio/                ← Signature Studio
  core/                       ← motor: proyectos, pruebas, similitud, publicación, comandos,
                                motor.py (lanza Claude Code), navegador.py (pruebas en Chrome), tipografia.py
  templates/                  ← Brief Inteligente Signature y formatos
  design-system/base-tecnica/ ← base técnica reutilizable (no visual)
  clients/                    ← un proyecto por cliente (se crea con el primero)
  docs/                       ← arquitectura, Hostinger, entornos, decisiones, aprendizaje
  tests/                      ← pruebas de la fábrica
```
