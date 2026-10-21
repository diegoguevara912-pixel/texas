# Kit de dirección · sonrisa-norte-piloto

Calculado por `core/direccion.py` (sin IA). Son **puntos de partida verificados**, no decisiones finales: Claude elige, ajusta y justifica. Los contrastes están medidos con la fórmula WCAG 2.x.

## Avisos
- Los colores de marca forman «fondo crema + acento terracota», una combinación que la propia regla anti-genérico señala. Se respetan, pero la diferenciación debe venir de la composición, la fotografía y el movimiento (o de usar la propuesta B/C como variación autorizada).
- No hay fotografías del cliente: el plan de imágenes debe usar bancos con licencia comercial, recursos programados o IA autorizada; una web sin imágenes queda plana.
- Demo: cualquier foto de personas o instalaciones es ilustrativa y debe rotularse como tal; nunca presentarla como del negocio.

## Motor cromático
Origen: colores de marca del brief: #5E7D6A, #F6F1E7, #C9785C.
Sector: En salud predominan azules y verdes fríos: diferenciarse con neutros cálidos o un acento inesperado sin perder la sensación de higiene. (HIPÓTESIS)

### A · Marca protagonista — Claro y sereno; el color de marca conduce las acciones.
Por qué / riesgo: Máxima coherencia con la marca y lectura cómoda; riesgo: puede verse contenida si no hay imágenes fuertes.
| Rol | Color |
|---|---|
| primario | `#5E7D6A` |
| secundario | `#C9785C` |
| acento | `#1F8B89` |
| fondo | `#F6F1E7` |
| superficie_1 | `#EDE7DA` |
| superficie_2 | `#E3DBCC` |
| superficie_3 | `#D6CDBB` |
| texto | `#101E16` |
| texto_suave | `#425148` |
| enlace | `#547260` |
| borde | `#B4C2B9` |
| foco | `#1F8B89` |
| estados | exito `#2A794C`, aviso `#966107`, error `#B3261E`, info `#2457A6` |
| CTA | fondo `#5B7967` · texto `#F6FCF8` · hover `#4A6856` |
Contraste AA: cumple en todos los pares.
```css
:root {
  --color-primario: #5E7D6A;
  --color-secundario: #C9785C;
  --color-acento: #1F8B89;
  --color-fondo: #F6F1E7;
  --color-superficie-1: #EDE7DA;
  --color-superficie-2: #E3DBCC;
  --color-superficie-3: #D6CDBB;
  --color-texto: #101E16;
  --color-texto-suave: #425148;
  --color-enlace: #547260;
  --color-borde: #B4C2B9;
  --color-foco: #1F8B89;
  --color-exito: #2A794C;
  --color-aviso: #966107;
  --color-error: #B3261E;
  --color-info: #2457A6;
  --cta-fondo: #5B7967;
  --cta-texto: #F6FCF8;
  --cta-hover: #4A6856;
  --cta-borde-secundario: #5E7D6A;
}
```

### B · Contraste nocturno — Fondo profundo teñido del tono de marca, textos claros y un acento luminoso.
Por qué / riesgo: Más dramática y cinematográfica, da profundidad a la fotografía; riesgo: menos cálida para sectores de confianza cotidiana.
| Rol | Color |
|---|---|
| primario | `#5E7D6A` |
| secundario | `#C9785C` |
| acento | `#FC9CBE` |
| fondo | `#06130B` |
| superficie_1 | `#0E1F15` |
| superficie_2 | `#172C20` |
| superficie_3 | `#233C2D` |
| texto | `#ECF4EF` |
| texto_suave | `#B4C2B9` |
| enlace | `#FC9CBE` |
| borde | `#3F4B43` |
| foco | `#FC9CBE` |
| estados | exito `#3E8C5D`, aviso `#AD7112`, error `#D94D40`, info `#477BCD` |
| CTA | fondo `#FC9CBE` · texto `#1E1216` · hover `#FDBCD1` |
Contraste AA: cumple en todos los pares.
```css
:root {
  --color-primario: #5E7D6A;
  --color-secundario: #C9785C;
  --color-acento: #FC9CBE;
  --color-fondo: #06130B;
  --color-superficie-1: #0E1F15;
  --color-superficie-2: #172C20;
  --color-superficie-3: #233C2D;
  --color-texto: #ECF4EF;
  --color-texto-suave: #B4C2B9;
  --color-enlace: #FC9CBE;
  --color-borde: #3F4B43;
  --color-foco: #FC9CBE;
  --color-exito: #3E8C5D;
  --color-aviso: #AD7112;
  --color-error: #D94D40;
  --color-info: #477BCD;
  --cta-fondo: #FC9CBE;
  --cta-texto: #1E1216;
  --cta-hover: #FDBCD1;
  --cta-borde-secundario: #ECF4EF;
}
```

### C · Acento inesperado — Neutros cálidos con un acento complementario que guía la mirada a la acción.
Por qué / riesgo: Diferencia frente al sector y jerarquía clara de la llamada a la acción; riesgo: el acento debe usarse con disciplina.
| Rol | Color |
|---|---|
| primario | `#2D4A39` |
| secundario | `#C9785C` |
| acento | `#9A71BE` |
| fondo | `#F1F9F4` |
| superficie_1 | `#E4F1E8` |
| superficie_2 | `#D4E7DB` |
| superficie_3 | `#C2D7C9` |
| texto | `#101E16` |
| texto_suave | `#425148` |
| enlace | `#2D4A39` |
| borde | `#B4C2B9` |
| foco | `#9A71BE` |
| estados | exito `#2E7D4F`, aviso `#9A650F`, error `#B3261E`, info `#2457A6` |
| CTA | fondo `#2D4A39` · texto `#F6FCF8` · hover `#1D3A2A` |
Contraste AA: cumple en todos los pares.
```css
:root {
  --color-primario: #2D4A39;
  --color-secundario: #C9785C;
  --color-acento: #9A71BE;
  --color-fondo: #F1F9F4;
  --color-superficie-1: #E4F1E8;
  --color-superficie-2: #D4E7DB;
  --color-superficie-3: #C2D7C9;
  --color-texto: #101E16;
  --color-texto-suave: #425148;
  --color-enlace: #2D4A39;
  --color-borde: #B4C2B9;
  --color-foco: #9A71BE;
  --color-exito: #2E7D4F;
  --color-aviso: #9A650F;
  --color-error: #B3261E;
  --color-info: #2457A6;
  --cta-fondo: #2D4A39;
  --cta-texto: #F6FCF8;
  --cta-hover: #1D3A2A;
  --cta-borde-secundario: #2D4A39;
}
```

## Motor tipográfico
Diego definió tipografía: es OBLIGATORIO respetarla; las propuestas solo sirven para roles que no definió.
Pedidas por Diego: tipografia_principal: Fraunces, tipografia_secundaria: Figtree
1. **Playfair Display** (titulares) + **Nunito Sans** (texto) · Editorial clásico (serif) + Humanista y cercano · escala 1.333 · OFL / OFL (Google Fonts)
2. **Space Grotesk** (titulares) + **IBM Plex Sans** (texto) · Técnico y preciso + Técnico y preciso · escala 1.25 · OFL / OFL (Google Fonts)
3. **Manrope** (titulares) + **Geist** (texto) · Moderno geométrico + Técnico y preciso · escala 1.25 · OFL / OFL (Google Fonts)

## Perfil de movimiento
**editorial-lento** (intensidad media; adecuado para arquitectura, lujo, arte, hoteles boutique). Alternativas: sereno-preciso, tecnico-dinamico, cinematografico, vivaz-cercano.
Escenas sugeridas: revelado tipográfico por líneas; imagen que se descubre con máscara; transición de fondo entre secciones.
```css
:root {
  --mov-duracion: 1100ms;
  --mov-duracion-corta: 380ms;
  --mov-curva: cubic-bezier(0.16, 1, 0.3, 1);
  --mov-distancia: 28px;
  --mov-escalonado: 110ms;
  --mov-parallax: 0.12;
}
```
Motor reutilizable: `design-system/motion/` (se copia a `sitio/base/motion/`). Ver `references/16-motor-de-movimiento.md`.

## Ya usado en otros proyectos de la fábrica (no repetir sin razón)
- Tipos de hero: titular-editorial-con-arco-dental-interactivo, titular-izquierda-con-plano-animado-sol-biogas
- Composiciones: editorial-asimetrica-con-ilustracion-viva, retícula-12-alineada-izquierda
- Fuentes: Figtree, Fraunces, Sora, Source Sans 3
- Animaciones: arco-que-respira, arco-que-se-dibuja, flujo-de-energia-en-plano, indice-en-curva, piezas-que-se-reacomodan, respuesta-a-acciones, revelado-suave

## Investigación
Reutilizable (el brief no cambió desde la última investigación): **no**.
