# Arquitectura

Signature 2.0 (generación completa): brief → kit de dirección (Python) → pasada de **dirección** (Claude: investigación,
percepción, 3 conceptos, direccion.json, identidad, tokens, plan de imágenes) → motor verifica paleta, descarga y
optimiza imágenes, copia el motor de movimiento → pasada de **construcción** (Claude) → poda de imágenes → navegador
(capturas completas, secciones, métricas) + QA → pasada de **crítica** (otra sesión, solo `qa/`) → **corrección**
localizada → pruebas → vista previa → aprobación de Diego.

```
          Diego
            │ brief / cambios / aprobación
            ▼
  Signature Studio (apps/studio, 127.0.0.1:4100) ──┐
            │ API local                             │ mismas funciones
            ▼                                       ▼
  core/  proyectos.py · qa.py · similitud.py · deploy.py · fabrica.py (CLI)
            │ lee/escribe
            ▼
  clients/<slug>/   ← un expediente aislado por cliente
            ▲                                   ▲
            │ escribe solo en su cliente        │ vigila archivos, ejecuta QA + Chrome, git del cliente
  Claude Code -p (modo motor) ◀── lanza ── core/motor.py (supervisor, proceso aparte) ◀── botón GENERAR
  + skill fabrica-web-signature            (o una sesión manual de Claude Code con la skill)
            │ solo con confirmación explícita
            ▼
  Conector Hostinger (search / execute) → sitio del cliente
```

## Piezas
| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Skill | `.claude/skills/fabrica-web-signature/` | Cerebro operativo: modos, flujo A→M, reglas, 22 módulos agrupados en 11 referencias que se cargan bajo demanda |
| Motor de proyectos | `core/proyectos.py` | Brief (esquema, normalización, validación), creación sin sobrescribir, estado y etapas, historial, cambios, base técnica |
| Calidad | `core/qa.py` | ~25 comprobaciones estáticas con estados aprobada/fallida/no ejecutada; resultados en `qa/` |
| Similitud | `core/similitud.py` | Compara `identidad.json` entre proyectos (paleta, tipografías, composición, hero, secciones, animaciones, concepto) |
| Producción | `core/deploy.py` | SEO por dominio, respaldos, paquete zip con manifiesto sha256, checklist, registro de publicación, entrega |
| CLI | `core/fabrica.py` | Todos los comandos; `fabrica.cmd` en Windows |
| Studio | `apps/studio/` | Servidor stdlib + interfaz vanilla JS; solo 127.0.0.1; protección de rutas y de origen |
| Motor | `core/motor.py` | Ejecuciones en `clients/<slug>/motor/<id>/` (estado.json, registro.txt, eventos-*.jsonl, órdenes), supervisor, permisos de Claude, bloqueo único, reanudar, resumen de publicación |
| Navegador | `core/navegador.py` | Chrome/Edge sin ventana por CDP: desbordes, consola, recursos, fuentes reales, capturas → `qa/navegador.json` |
| Tipografía | `core/tipografia.py` + `templates/brief/catalogo-fuentes.json` | Catálogo con licencias, avisos, instrucciones para Claude y comprobación en el CSS |
| Brief | `templates/brief/brief-schema.json` | Fuente única del formulario (Studio lo dibuja a partir de este esquema) |
| Base técnica | `design-system/base-tecnica/` | Accesibilidad, movimiento con respeto a reduced-motion, formularios→WhatsApp, `.htaccess` |
| Dirección (2.0) | `core/direccion.py` | Paletas con contraste WCAG, tipografía, perfiles de movimiento, antirrepetición, kit para Claude, huella del brief |
| Imágenes (2.0) | `core/imagenes.py` | Plan → bancos con licencia / cliente / IA asistida → validación → WebP → licencias, créditos, hoja de contactos, poda |
| Movimiento (2.0) | `design-system/motion/` + `design-system/vendor/` | Motor propio por atributos `data-sm` y bibliotecas locales con huellas |

## Expediente de un cliente
```
clients/<slug>/
  brief.json · brief.md · estado.json · ESTADO.md · HISTORIAL.md · ORDEN_CLAUDE.md
  cambios-solicitados.md        (desde Studio o CLI)
  investigacion/analisis.md     (etapa B)
  diseno/conceptos.md · identidad.md · identidad.json · similitud.json · decisiones.md
  recursos/licencias.md · originales/
  sitio/                        (la web: index.html, assets/, base/, .htaccess, robots, sitemap)
  qa/ULTIMO.md · qa-*.json · revision-visual.md · rubrica.md
  entrega/deploy/*.zip · CHECKLIST-PUBLICACION.md · documentacion/
  historial/ (briefs anteriores) · respaldos/ (copias de sitio/)
```

## Por qué así
Ver `docs/decisiones.md`.
