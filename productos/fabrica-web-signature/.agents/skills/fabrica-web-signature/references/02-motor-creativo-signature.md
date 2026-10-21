# Módulos 4-5 · Motor creativo Signature

> Cada empresa recibe una dirección artística diferente. El código se reutiliza; la personalidad no.

Si la skill `frontend-design` está disponible, cárgala además de este módulo.

## Procedimiento (etapa C)
1. Releer análisis: identidad, mercado, posicionamiento, oportunidades de diferenciación.
2. Extraer la **materia prima visual del mundo del cliente**: materiales, oficio, herramientas,
   lugar, clima, luz, vocabulario, gestos, documentos propios del sector (planos, recetas, fichas
   técnicas, mapas de parcelas…). Los conceptos nacen de ahí, no de una plantilla ni de una moda.
3. Desarrollar **tres conceptos** que difieran en al menos tres ejes (composición, color,
   tipografía, narrativa, movimiento). Para cada uno, en `diseno/conceptos.md`:
   - Nombre conceptual · idea creativa en una frase · personalidad · sensación que transmite
   - Narrativa visual (cómo avanza la historia al hacer scroll, capítulo por capítulo)
   - Estilo visual (editorial, arquitectónico, orgánico, industrial, cinematográfico, brutalista,
     minimalista, tecnológico, inmersivo, experimental…)
   - Paleta (4-6 hex con nombre y uso) · tipografías (roles) · composición
   - Primera pantalla: qué ve el visitante en 3 segundos (boceto ASCII escritorio y móvil)
   - Dirección fotográfica · navegación · animaciones (perfil y momento memorable) · interacciones
   - **Elemento visual diferenciador** (lo que nadie del sector tiene)
   - Adaptación móvil pensada (no recortada) · relación con los objetivos del negocio
   - Riesgo o límite del concepto
4. **Evaluar** cada concepto de 1 a 10 en una matriz con 8 criterios: originalidad, adecuación al
   sector, coherencia de marca, legibilidad, potencial comercial, experiencia de usuario,
   rendimiento y viabilidad técnica con los recursos reales (imágenes que de verdad se pueden
   conseguir, presupuesto). Elegir con razonamiento escrito y anotar en `direccion.json`. No hace
   falta la aprobación de Diego: él puede cambiar de concepto después desde Studio
   («Cambiar dirección creativa») sin empezar de cero.
5. Pasar a identidad (módulos 03 y 15), imágenes (17) y movimiento (16).

## Qué hace Signature a una página
- Un **concepto sólido** que se siente en toda la experiencia, no efectos sueltos.
- Primera pantalla memorable que comunica a la vez: personalidad, propuesta de valor, calidad,
  diferencia y acción principal. Opciones según el concepto: tipografía editorial gigante,
  fotografía cinematográfica, composición asimétrica, profundidad, ilustración propia, gráfico
  interactivo, navegación distintiva. Nunca a costa de entender qué se ofrece.
- Tipografía con rigor: escala, interlineado, medida (<75 caracteres), contraste, ritmo, jerarquía.
  No mezclar familias para "parecer creativo"; una o dos con roles claros.
- Color único por proyecto: psicología, sector, marca, contraste AA, estados interactivos.
  **No imponer oscuro + dorado.** El lujo es precisión y aire, no un color.
- Detalles cuidados: botones, bordes, sombras, espaciados, iconos, menús, formularios, hover,
  estados de carga, transiciones, contacto y pie de página. Ningún apartado descuidado.
- **Impacto y disciplina a la vez.** Una audacia principal clara (escala tipográfica dramática,
  fotografía a sangre, escena de scroll, ilustración viva…) y el resto disciplinado. La contención
  NO es excusa para una página plana: Signature exige al menos
  · un **momento memorable** que solo podría existir para esta marca;
  · **cambios de plano** a lo largo de la página (fondos, escalas, densidades, imagen ↔ texto);
  · **imágenes con propósito** (fotografía, ilustración propia o visualización), no solo texto y líneas;
  · una **composición** que no sea la sucesión de bloques centrados del mismo ancho.
  Antes de entregar, quita un adorno que no sirva al concepto.

## Vocabulario de composición (elige según el contenido, no por moda)
Editorial asimétrica con columnas desiguales · fotografía a sangre con texto superpuesto ·
tipografía gigante como imagen · retícula modular con piezas de distinto tamaño · escena fijada
que cuenta pasos con el scroll · galería horizontal · capítulos con cambio de fondo · índice
interactivo · comparador antes/después · mapa o diagrama protagonista · tarjeta-objeto 3D ·
superposición de capas (imagen, forma, texto) con profundidad · espacio negativo deliberado.
La arquitectura de cada sitio sale del contenido y del objetivo comercial: prohibido el patrón
automático Hero → tres tarjetas → nosotros → contacto.

## Regla estricta contra lo genérico
Señales de plantilla a evitar salvo justificación escrita:
- Hero "titular centrado + subtítulo + dos botones + foto de banco".
- Tres tarjetas iguales con icono, título y texto, todas con la misma sombra.
- Resaltar una palabra del titular con color; etiquetas en MAYÚSCULAS sobre cada bloque;
  numeraciones 01/02/03 cuando el contenido no es una secuencia; "→" en cada botón.
- Degradados morado-azul, fondo crema con acento terracota, negro con acento neón, negro con dorado.
- Secciones en el orden Inicio-Nosotros-Servicios-Testimonios-Contacto por inercia.
- Mismas fuentes de moda en todos los proyectos (Inter/Poppins/Montserrat por defecto).
- Footer de cuatro columnas idéntico al de cualquier sitio.

**Comparación con proyectos anteriores:** tras la etapa D ejecuta
`python core/fabrica.py similitud <slug>`. Si la coincidencia es EXCESIVA (≥70) o REVISAR (≥50)
sin una razón (p. ej., el mismo cliente con dos marcas), cambia de verdad la composición, el sistema
visual y la narrativa. Cambiar solo colores o fotos no cuenta.

La originalidad nunca justifica perjudicar navegación, legibilidad, accesibilidad ni rendimiento.

## Ejemplos de sensibilidad por sector (ilustrativos, no plantillas)
- Arquitectura: fotografía de gran formato, tipografía editorial, silencio, transiciones lentas,
  galerías inmersivas.
- Clínica dental: limpieza sofisticada, fotografía profesional, animación sutil, información clara
  de tratamientos, agendamiento.
- Agrícola: paisaje, visualizaciones técnicas de procesos, catálogo de soluciones, formularios
  comerciales.
- Automóviles premium: fotografía cinematográfica, grandes titulares, presentación de producto,
  catálogo interactivo.
Cada empresa necesita su propio análisis; dos clínicas tampoco deben parecerse.
