# Módulo 11 · Recursos visuales (etapa F)

> **Signature 2.0:** el procedimiento operativo (plan, obtención automática, optimización WebP,
> licencias, IA asistida con Hostinger) está en `17-imagenes-y-direccion-fotografica.md`. Este módulo
> conserva los criterios generales.

Las imágenes transmiten la exclusividad. Todas deben parecer de la misma dirección de arte.

## Prioridad de fuentes
1. **Material del cliente** (logo, fotos, catálogos, proyectos, material corporativo) con su
   autorización. Guardar originales en `recursos/originales/` y optimizados en `sitio/assets/img/`.
2. **Bancos con licencia comercial**: Unsplash, Pexels, Pixabay (comprobar la licencia vigente en la
   página de cada imagen); iconos Lucide, Tabler, Phosphor; fuentes Google Fonts. Evitar la foto de
   banco obvia cuando haya una alternativa más relevante.
3. **Imágenes generadas con IA**: solo con una herramienta disponible y autorizada. Las de pago
   necesitan la aprobación de Diego antes de usarlas. Mantener consistencia de iluminación,
   dirección artística, composición, color, proporciones y contexto entre todas.
   **Nunca** presentar como reales instalaciones, empleados, productos o resultados ficticios.
4. **Recursos programáticos**: SVG, ilustraciones, infografías, diagramas de proceso, mapas y
   visualizaciones de datos reales cuando comunican mejor que una foto. Son una gran vía de
   diferenciación y pesan poco.

## Registro obligatorio
Cada recurso va en `recursos/licencias.md`: archivo, origen, autor, licencia, URL, fecha. Si no se
puede demostrar la licencia, no se usa. Nada de Google Imágenes, competidores ni marcas de agua.
Si se usan fotos de banco, decírselo al cliente: no son de su negocio.

## Optimización
- WebP (o AVIF) a 480/960/1600 px de ancho; JPEG de respaldo solo si hace falta.
- Imagen principal < 250 KB; resto < 150 KB idealmente (el QA avisa por encima de 400 KB).
- Nombres descriptivos en minúsculas con guiones; `alt` descriptivo en el idioma del sitio
  (`alt=""` solo para decorativas).
- Sin Node ni herramientas de imagen instaladas: si no puedes convertir formatos en este equipo,
  dilo y propone la opción (Squoosh web, o instalar Pillow con permiso: `python -m pip install pillow`).
