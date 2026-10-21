# Dirección artística — Autolote Ultra Premium

## 1. Qué se observó en referencias de alta gama

Patrones recurrentes en sitios de fabricantes y concesionarios premium (Porsche, Polestar, Lucid, Mercedes‑Benz, Lexus, configuradores 3D de marcas europeas y marketplaces con buena conversión como Carvana o Cazoo). Son observaciones de diseño, no se copia ninguna página.

| Aspecto | Patrón que funciona | Riesgo a evitar |
|---|---|---|
| Experiencia visual | Un solo protagonista por pantalla, mucho espacio negativo | Collages de ofertas, banners intermitentes |
| Composición | Retícula editorial asimétrica, texto grande sobre fondo calmo | Tarjetas idénticas en todas las secciones |
| Tipografía | Una display con carácter + una sans neutra + datos en monoespaciada | Tres familias decorativas |
| Fotografía | Luz de estudio lateral, reflejos controlados, fondos sin ruido | Fotos de patio con cables, contraluz |
| Animación | Cámara lenta, entradas cortas (300–700 ms), transiciones con propósito | Parallax en todo, rebotes, autoplay ruidoso |
| Conversión | CTA persistente (WhatsApp / cotizar), precio y estado visibles, filtros rápidos | Formularios largos antes de ver el producto |
| Confianza | Datos verificables: ubicación, horarios, estado del vehículo, código de inventario | Sellos, reseñas o “certificaciones” sin respaldo |
| Móvil | Barra inferior de acción, galerías deslizables, 3D opcional | WebGL obligatorio que bloquea el catálogo |
| Presentación | Ficha técnica tabular, galería grande, especificaciones escaneables | Texto corrido con datos mezclados |

Principios aplicados (con base en investigación UX ampliamente replicada, no en “psicología del color”):
- **Jerarquía y escaneo**: los usuarios escanean antes de leer (patrones F/Z de Nielsen Norman Group); por eso precio, año, kilometraje y estado van en la primera línea de cada ficha.
- **Ley de Hick**: menos opciones por pantalla aceleran la decisión; filtros como chips y un único CTA primario por sección.
- **Ley de Fitts**: objetivos táctiles ≥ 44 px y acción principal al alcance del pulgar en móvil.
- **Efecto de usabilidad estética**: interfaces percibidas como estéticas se perciben también como más fáciles de usar; eso no sustituye la usabilidad, la acompaña.
- **Contraste**: todo texto cumple WCAG 2.2 AA (≥ 4.5:1; ≥ 3:1 en texto grande). Los colores se eligen por identidad y contraste, no por efectos emocionales universales (la evidencia sobre “el azul da confianza” o “el rojo da urgencia” es inconsistente y dependiente del contexto cultural).

## 2. Tres conceptos originales

### Concepto A — Atelier Nocturno (seleccionado)
- **Identidad**: una galería privada de noche. El vehículo se presenta como pieza de colección bajo luz de estudio.
- **Paleta**: negro cálido `#0D0C0B`, grafito `#1A1917`, marfil `#F1ECE3`, titanio `#9A9690`, acento champán `#D7B97F` reservado para acciones.
- **Tipografía**: Bodoni Moda (display, cursiva para palabras clave) + Manrope (texto e interfaz) + JetBrains Mono (datos técnicos y códigos).
- **Navegación**: barra mínima translúcida; en móvil, barra inferior con Inventario · WhatsApp · Financiar.
- **Fotografía**: fondo oscuro neutro, luz lateral suave tipo softbox, reflejos largos en carrocería, sin elementos de patio.
- **3D**: showroom con piso reflectante, tiras de luz cenitales, vehículo conceptual ilustrativo con hotspots.
- **Animación**: intro de cámara de 2.4 s, revelado de texto por líneas, galería horizontal anclada al scroll.
- **Catálogo**: lista editorial con imagen amplia y datos en monoespaciada; filtros en chips.
- **Conversión**: WhatsApp persistente, “Cotizar” y “Agendar visita” en cada ficha, simulador cerca del precio.

### Concepto B — Titanio Cinético
- **Identidad**: laboratorio de ingeniería; interfaz tipo HUD, cifras protagonistas.
- **Paleta**: grafito azulado `#111418`, titanio `#B7BCC2`, blanco `#F5F7F8`, acento señal lima `#C6F432`.
- **Tipografía**: Unbounded + Inter + IBM Plex Mono.
- **Navegación**: menú lateral con índice numerado de secciones.
- **Fotografía**: ángulos bajos, líneas de luz frías, detalles mecánicos.
- **3D**: vehículo en vista técnica con líneas de cota y recorrido orbital continuo.
- **Animación**: contadores, barras de especificación, transiciones de barrido.
- **Catálogo**: tabla comparativa densa con barras.
- **Conversión**: comparador y simulador en primer plano.

### Concepto C — Luz de Costa
- **Identidad**: showroom diurno contemporáneo y cercano, pensado para el clima y la luz de Honduras.
- **Paleta**: marfil arena `#F4EFE6`, tinta profunda `#14181C`, piedra `#C9C1B4`, acento terracota `#B9532F`.
- **Tipografía**: Fraunces + DM Sans + DM Mono.
- **Navegación**: encabezado claro, secciones tipo revista.
- **Fotografía**: luz natural de mañana, arquitectura de concreto y vegetación.
- **3D**: escena de luz natural, sombras suaves, cámara en altura.
- **Animación**: fundidos suaves, imágenes con zoom lento.
- **Catálogo**: tarjetas grandes con fondo claro.
- **Conversión**: tono conversacional, WhatsApp y visita como protagonistas.

## 3. Evaluación y elección

| Criterio (1–5) | A Atelier | B Titanio | C Costa |
|---|---|---|---|
| Percepción de alta gama | 5 | 4 | 4 |
| Diferenciación frente a autolotes locales | 5 | 4 | 3 |
| Fotografía real tolerante (fotos del lote de calidad variable) | 4 | 3 | 3 |
| Legibilidad móvil al sol | 3 | 3 | 5 |
| Rendimiento 3D en gama media | 4 | 3 | 4 |
| Escalabilidad a inventario variado (no solo lujo) | 4 | 3 | 5 |
| **Total** | **25** | 20 | 24 |

**Elegido: A — Atelier Nocturno.** Es el que mejor separa la marca de un lote convencional y el fondo oscuro unifica fotografías de distinto origen. Su debilidad (lectura al sol) se mitiga con contraste alto (marfil sobre negro ≈ 16:1) y tamaños base de 17 px. El concepto C queda como alternativa si el propietario prefiere una identidad clara; los tokens permiten cambiarlo sin rehacer componentes.

## 4. Tokens y contraste verificados

| Par | Contraste |
|---|---|
| Marfil `#F1ECE3` sobre negro `#0D0C0B` | 16.6:1 |
| Titanio `#9A9690` sobre negro `#0D0C0B` | 6.6:1 |
| Champán `#D7B97F` sobre negro `#0D0C0B` | 10.4:1 |
| Negro `#0D0C0B` sobre champán (botón primario) | 10.4:1 |

Los tokens viven en `client/src/styles/tokens.css`. Los valores se pueden recalcular con `npm test` (prueba de contraste incluida).

## 5. Sistema de movimiento
- Duraciones: 180 ms (microinteracción), 450 ms (entrada), 900 ms (transición de sección), 2.4 s (intro de cámara, una sola vez por sesión).
- Curva base: `cubic-bezier(.2,.7,.1,1)`.
- `prefers-reduced-motion`: sin intro de cámara, sin scroll anclado, revelados instantáneos; la página se ve completa sin animaciones.
- Dispositivos modestos (≤ 4 núcleos, poca memoria o sin WebGL): piso sin reflejos, menos resolución de render o imagen estática.

## 6. Modelo 3D
El vehículo del showroom es **conceptual e ilustrativo**, construido por código (sin licencias de terceros). La interfaz lo indica explícitamente y nunca se asocia a una unidad del inventario. Cuando el autolote tenga modelos `.glb` autorizados de una unidad concreta, se cargan desde el panel en la ficha de ese vehículo.
