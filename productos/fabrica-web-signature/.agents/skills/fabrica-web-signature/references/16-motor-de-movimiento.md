# Módulo 16 · Motor de movimiento Signature

> Movimiento con dirección, no movimiento por todas partes. Una coreografía coherente con la marca
> y uno o dos momentos memorables valen más que veinte efectos.

## Plan de movimiento (pasada de dirección → `direccion.json` → `movimiento`)
- **Perfil** del kit (editorial-lento, sereno-preciso, técnico-dinámico, cinematográfico,
  vivaz-cercano) o uno propio con: ritmo, duraciones, curva, intensidad, escalonado, parallax.
- **Escenas** (2-4): el momento memorable (p. ej. un proceso que se dibuja con el scroll, una
  fotografía que se descubre, una escena fijada que cuenta tres pasos, un cambio de fondo entre
  capítulos) + revelados de apoyo + microinteracciones.
- **Móvil**: qué se simplifica (sin parallax ni escenas fijadas largas en pantallas pequeñas).
- **Bibliotecas**: `[]` por defecto. `gsap` solo si hay líneas de tiempo encadenadas que el motor
  propio no resuelve; `three` solo si el 3D es el centro del concepto; `lenis` solo si el concepto
  pide desplazamiento suave (nunca con movimiento reducido).

## Herramientas disponibles en el sitio (copiadas por el motor)
`sitio/base/motion/signature-motion.css` y `signature-motion.js` (sin dependencias). Cárgalos así:
```html
<link rel="stylesheet" href="base/motion/signature-motion.css">
<script src="base/motion/signature-motion.js" defer></script>
```
Atributos (detalle en la cabecera del archivo JS):
| Atributo | Efecto |
|---|---|
| `data-sm="aparecer"` + `data-sm-desde="abajo/izquierda/derecha/escala/desenfoque"` | Aparición al entrar |
| `data-sm="lineas" / "palabras" / "letras"` | Titular que sube por partes tras una máscara (accesible) |
| `data-sm="mascara"` | Imagen o bloque descubierto con cortina + leve zoom |
| `data-sm-grupo="90"` | Escalona hijos directos |
| `data-sm="parallax" data-sm-velocidad="0.15"` | Capas a distinta velocidad |
| `data-sm="progreso"` (+ `.sm-escena` / `.sm-escena__fija`) | Escena fijada: usa `var(--sm-p)` 0→1 en CSS |
| `data-sm="trazo"` (+ `data-sm-ligado="progreso"`) | SVG que se dibuja |
| `data-sm="contador" data-sm-hasta="…"` | Solo cifras reales verificadas |
| `data-sm="magnetico"`, `data-sm="inclinar"` | Microinteracciones de cursor (solo ratón) |
| `data-sm-fondo="#…" data-sm-texto="#…"` | El fondo de la página cambia al llegar a esa sección |
| `data-sm="cabecera"` | Cabecera que se oculta al bajar |
Además: transiciones entre páginas con View Transitions (automático) y variables `--mov-*` en
`tokens.css` (duraciones, curva, distancia, escalonado, parallax).

GSAP (si se instaló): `<script src="base/vendor/gsap/gsap.min.js" defer>` + `ScrollTrigger.min.js`,
registrar plugins, envolver todo en `gsap.matchMedia()` con `(prefers-reduced-motion: no-preference)`.
three.js: `<script type="module">import * as THREE from './base/vendor/three/three.module.js'`,
siempre con imagen de respaldo y pausado fuera de pantalla.

## Reglas
- Solo `transform`, `opacity`, `clip-path`, `filter`. Nunca animar `width/height/top/left`.
- Con `prefers-reduced-motion` todo el contenido se ve y nada se mueve (el motor lo prueba: si algo
  queda oculto es fallo crítico).
- Nada esencial depende de la animación; sin JavaScript todo es visible.
- Equipos modestos: el motor activa modo ligero (sin parallax ni inclinación) automáticamente.
- Duraciones coherentes con el perfil; una sola curva principal por sitio.
- Prohibido sobreanimar: si cada bloque se mueve, ninguno destaca. Máximo un efecto distinto por sección.
