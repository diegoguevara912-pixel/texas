# Módulo 18 · Crítica Signature (auditoría visual independiente) y corrección localizada

## Por qué existe
La sesión que diseña tiende a calificar alto su propio trabajo. La crítica la hace **otra sesión**,
que solo puede escribir en `qa/`, mira capturas reales tomadas por el motor (primera pantalla,
recortes por sección en escritorio y móvil, páginas interiores) y las métricas medidas de
`qa/navegador.json` (contraste real, objetivos táctiles, ocultos, movimiento reducido, imágenes).

Cómo leer las capturas: la **primera pantalla** (`auto-*`) y los **recortes por sección** (`seccion-*`) son la
referencia. En las **páginas completas** (`pagina-*`) la cabecera fija, las escenas fijadas (`sm-escena`) y los
cambios de fondo por sección pueden verse desplazados o vacíos: es un efecto de la captura, no del sitio; no
lo reportes como defecto sin confirmarlo en un recorte.

## Rúbrica (1-10) — cada nota con evidencia visible en una captura concreta
| clave | Criterio | Qué mirar |
|---|---|---|
| originalidad | Originalidad | ¿Podría ser de otra empresa del sector cambiando el logo? |
| direccion | Dirección artística | ¿El concepto se siente en toda la página o solo en el hero? |
| impacto | Impacto visual | Escala, contraste de planos, una imagen o momento que se recuerde |
| tipografia | Tipografía | Jerarquía, escala, medida, ritmo, cortes de línea en móvil |
| paleta | Paleta | Coherencia, ritmo de fondos, uso disciplinado del acento, contraste medido |
| composicion | Composición | Retícula, tensión/asimetría, aire, alineaciones, huecos involuntarios |
| imagenes | Calidad de imágenes | Pertinencia, coherencia de campaña, resolución, recortes |
| animaciones | Animaciones | Solo si hay evidencia; si no, «sin medir» (nota null) |
| interactividad | Interactividad | Utilidad real de las funciones visibles |
| coherencia | Coherencia | Componentes, espaciados y estilos consistentes entre secciones y páginas |
| movil | Experiencia móvil | Primera pantalla móvil, tamaños táctiles, orden de lectura |
| accesibilidad | Accesibilidad | Contraste medido, foco, textos alternativos (según métricas) |
| rendimiento | Rendimiento | Peso transferido, imágenes pesadas (según métricas) |
| conversion | Conversión | Acción principal clara en cada pantalla, fricción, confianza honesta |
| diferenciacion | Diferenciación frente a lo genérico | Señales de plantilla del módulo 02 |

Calibración: 5 = correcto pero genérico · 7 = profesional · 8 = muy bueno, con identidad ·
9 = nivel de agencia de primer nivel, se puede señalar por qué · 10 = excepcional y sin defectos.
No compares con «proyectos de 100 000 dólares» como si fuera medible: describe lo que se ve.

## Formato de `qa/critica.json`
```json
{
  "criterios": {"originalidad": {"nota": 7, "evidencia": "seccion-escritorio-01.png: …"}, "...": {}},
  "problemas": [
    {"id": "p1", "seccion": "hero", "captura": "seccion-escritorio-01.png", "severidad": "alta|media|baja",
     "problema": "qué se ve mal y por qué afecta a la percepción buscada",
     "correccion": "cambio concreto y mínimo (qué, dónde, cuánto)", "archivo_probable": "sitio/assets/css/sitio.css"}
  ],
  "secciones_a_redisenar": ["id de sección solo si es genérica desde el concepto"],
  "veredicto": "aprobar | corregir | rediseñar_secciones",
  "resumen": "tres frases para Diego"
}
```
- Máximo 12 problemas, ordenados por impacto. Nada de «mejorar en general».
- «aprobar» solo si ningún criterio de originalidad, dirección, impacto o diferenciación queda < 8 y
  no hay problemas de severidad alta.
- Señala también lo que sobra (efectos, adornos, textos) — quitar suele mejorar más que añadir.

## Corrección localizada (pasada siguiente)
- Corrige problema por problema, de mayor a menor severidad, con el cambio mínimo que lo resuelva.
- Rediseña completas solo las secciones listadas en `secciones_a_redisenar`, desde el concepto.
- No toques lo que la crítica no menciona salvo para mantener coherencia.
- Registra en `qa/revision-visual.md`: problema → cambio → archivo.
- El motor vuelve a probar y a capturar. Por defecto hay una ronda; Diego puede pedir dos.
