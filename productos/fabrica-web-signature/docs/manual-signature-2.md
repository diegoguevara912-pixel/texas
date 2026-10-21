# Manual sencillo · FÁBRICA WEB SIGNATURE 2.0

Para Diego. Este manual explica lo nuevo; el manual anterior (`manual-generacion.md`) sigue valiendo para lo básico.

## 1. Lo que cambió en una frase
Ahora la fábrica investiga, propone tres conceptos, calcula paletas con contraste medido, consigue y optimiza
fotos con licencia, anima con un motor propio, toma capturas reales de toda la página y deja que **otro**
Claude, como director de arte externo, critique con evidencia antes de corregir.

## 2. Brief Inteligente (Studio → Nuevo cliente o pestaña Brief)
Siguen siendo **8 campos obligatorios**. Las secciones nuevas son opcionales: si las dejas vacías, la fábrica decide.
- **Estrategia y experiencia:** objetivo principal, acción que esperas del visitante, posicionamiento y sensación.
- **Preferencias avanzadas:** minimalista o expresivo, intensidad de animación, interactividad, 3D,
  prioridad de rendimiento y restricciones.
- **Recursos visuales:** de dónde pueden salir las imágenes y **si autorizas generar con IA**. Por defecto la
  respuesta es «No generar con IA», así nunca se gastan créditos sin que lo marques.

## 3. Generar (Studio → pestaña Generación)
Elige el **modo** (todos mantienen el nivel Signature; cambia cuánto trabajo se repite):
| Modo | Cuándo usarlo | Consumo aproximado* |
|---|---|---|
| **Signature completo** | Página nueva o rehacerla | 2,5 a 7 M tokens |
| **Prueba rápida** | Validar un brief o enseñar una idea | 0,4 a 1,5 M |
| **Refinamiento Signature** | Mejorar una página existente sin rehacerla (crítica + corrección) | 1 a 3 M |
| **Cambiar dirección creativa** | Probar otro de los 3 conceptos sin repetir la investigación | 2 a 5,5 M |

*Las cifras son estimaciones hasta que haya ejecuciones medidas. Después, Studio muestra lo **medido** en tus
ejecuciones reales. Los tokens no son tu saldo: con el plan Pro o Max no se cobra extra, pero se consume el
límite de uso de 5 horas.

Casillas: «Dos rondas de crítica y corrección» da más calidad y más consumo. «Auditoría visual independiente»
viene activada.

Las etapas que verás son 19, y cada una se marca solo con evidencia: el archivo existe, la paleta pasó la
medición o las capturas se tomaron. Si algo no se pudo hacer, verás «no ejecutado», nunca un visto falso.

## 4. Imágenes
- La fábrica busca en bancos con licencia comercial (sin cuenta). Valida que cada archivo sea de verdad una
  imagen, filtra contenido inadecuado, descarta lo de baja resolución, optimiza a WebP y arma
  `recursos/hoja-contactos.png` para elegir.
- **Para mejor calidad (recomendado):** crea cuentas gratuitas en Pexels (pexels.com/api) o Unsplash
  (unsplash.com/developers). Guarda las claves en `negocio/claves-imagenes.env`:
  ```
  PEXELS_API_KEY=tu_clave
  UNSPLASH_ACCESS_KEY=tu_clave
  ```
  Ese archivo nunca entra a git y Claude no puede leerlo. Solo lo usa el programa de imágenes.
- **IA de Hostinger:** si lo autorizas en el brief, la fábrica escribe `recursos/solicitud-ia.md` con las
  instrucciones de cada imagen. Tú las generas en el AI Builder (en un sitio de pruebas que ya exista, sin
  crear uno nuevo), descargas el archivo y lo guardas como `recursos/entrantes/<id>.jpg`. Después ejecuta:
  ```
  python core/fabrica.py imagenes <cliente>
  python core/fabrica.py imagenes <cliente> credito <id> <créditos gastados>
  ```

## 5. Comandos nuevos (opcional, por terminal)
```
python core/fabrica.py kit <cliente>                 # 3 paletas, tipografía y movimiento (gratis, sin IA)
python core/fabrica.py imagenes <cliente>            # obtener/optimizar imágenes del plan
python core/fabrica.py navegador <cliente>           # capturas completas, por sección y métricas
python core/fabrica.py refinar <cliente>             # refinamiento Signature (usa Claude)
python core/fabrica.py cambiar-concepto <cliente> 2  # otra dirección creativa (usa Claude)
python core/fabrica.py generar <cliente> --modo rapido
```

## 6. Ver el piloto
Abre Studio: el cliente **sonrisa-norte-piloto** está junto a **sonrisa-norte**. Para comparar, usa la vista
previa de cada uno o abre `docs/piloto-sonrisa-norte/comparacion.png`.
