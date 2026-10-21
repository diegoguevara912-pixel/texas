# Módulo 17 · Dirección fotográfica y plan de imágenes

> Una página sin imágenes con propósito se ve plana, por buena que sea la tipografía.
> Las imágenes deben parecer de una misma campaña.

## Tú no descargas: planificas
No tienes terminal. Escribe `recursos/plan-imagenes.json`; el motor busca, valida, descarga,
optimiza a WebP (640/1280/1920), registra licencias y te muestra `recursos/hoja-contactos.png`.

```json
{
  "direccion_fotografica": {
    "estilo": "fotografía documental editorial", "iluminacion": "luz natural lateral, sombras suaves",
    "encuadre": "planos medios y detalles de manos/herramientas", "paleta": "tonos que dialogan con la paleta elegida",
    "atmosfera": "calma, cuidado", "realismo": "fotográfico, sin aspecto de IA", "consistencia": "misma temperatura de color",
    "evitar": "sonrisas de catálogo, fondos blancos de estudio, personas mirando a cámara con pulgar arriba"
  },
  "imagenes": [
    {"id": "hero", "proposito": "qué comunica y por qué está ahí", "donde": "index · primera pantalla",
     "proporcion": "16:9", "ancho_min": 1800, "fuente": "banco",
     "busqueda": ["consulta 1 en inglés", "alternativa", "alternativa más abstracta"],
     "prompt_ia": "", "alt": "texto alternativo propio", "ilustrativa": true}
  ]
}
```
- `fuente`: `cliente` (archivo en `recursos/entrantes/<id>.*`), `banco` (licencia comercial
  verificada), `ia-manual` (solo si el brief lo autoriza; Diego la genera en Hostinger AI Builder con
  la hoja `recursos/solicitud-ia.md`), `programada` (SVG/CSS/Canvas/3D que construyes tú).
- Entre 4 y 12 imágenes con propósito. Ids en minúsculas con guiones.
- **Búsquedas que funcionan en bancos**: conceptos visuales concretos y atmosféricos («hands holding
  ceramic cup morning light», «concrete texture soft shadow», «aerial coffee plantation mist»), no
  nombres de negocio. Para sectores sensibles (salud), preferir detalles, materiales, espacios y
  manos a caras de «pacientes». Da 2-3 alternativas por imagen, de lo literal a lo abstracto.
- `prompt_ia` (si aplica): sujeto, acción, entorno, luz, lente/encuadre, paleta, atmósfera, estilo,
  qué evitar; coherente con `direccion_fotografica`.

## Reglas
- Nunca presentes como reales del negocio a personas, instalaciones, productos o resultados que no lo
  son. Fotos de banco de personas o lugares → rótulo «Imagen ilustrativa» discreto en demos o
  cuando no sean del cliente.
- Al elegir en la hoja de contactos descarta: logotipos o marcas visibles, negocios identificables,
  marcas de agua, baja resolución, estética incoherente con la dirección.
- Tratamiento unificado en CSS si hace falta coherencia (duotono sutil, `filter` leve, máscaras con
  la forma del concepto, recortes), sin destruir la foto.
- Uso: `<img src="assets/img/hero-1280.webp" srcset="… 640w, … 1280w, … 1920w" sizes="…" width height alt>`;
  `fetchpriority="high"` en la principal, `loading="lazy"` en el resto.
- Lo que exige atribución (CC BY/BY-SA) se acredita en `creditos.html` (lo genera el motor) con
  enlace en el pie.
- Recursos programados (SVG, diagramas, mapas, visualizaciones, 3D) cuando comunican mejor que una
  foto; se combinan con fotografía, no la reemplazan por defecto.
