# Manual: crear y modificar una página con el botón GENERAR

Para Diego. Todo se hace desde Signature Studio; no hace falta escribir prompts.

## Antes de la primera vez (una sola vez)
1. **Conecta Claude Code:** doble clic en `Conectar-Claude-Code.cmd`. Se abre tu navegador: inicia
   sesión con tu cuenta de Claude (la misma de la app). Al terminar, la ventana dice «Sesión: iniciada».
   - Esto es necesario porque Studio usa el Claude Code que viene con la app de escritorio, y ese
     programa guarda su propia sesión. Nadie más la ve; la fábrica no guarda contraseñas ni claves.
2. **Cierra y vuelve a abrir Studio** (`Abrir-Signature-Studio.cmd`) para que cargue la versión nueva.

## Crear una página nueva
1. Studio → **Nuevo cliente**.
2. Llena lo que sepas. Solo 8 campos son obligatorios (los marcados con *): nombre, sector, país,
   descripción, estado del negocio, servicios, objetivos y tipo de web.
3. Opcional pero recomendado:
   - **Identidad de marca:** colores principales y secundarios (escribe nombres o códigos, o usa el
     selector de color), estilo, fotos y logotipo (ruta o enlace).
   - **Tipografía:** escribe una fuente o elígela del catálogo (50 fuentes con licencia libre). Debajo
     verás una muestra. Si la dejas vacía, Claude elige una combinación adecuada al negocio.
   - **Funcionalidades:** WhatsApp, formulario, cotizador, agenda, galería, animaciones, 3D…
   - **Instrucciones adicionales:** cómo quieres que se sienta la página, con tus palabras.
4. Pulsa **GENERAR PÁGINA WEB SIGNATURE**. Studio guarda el brief, crea el proyecto y abre la
   pestaña **Generación**.
5. Lee «¿Cuánto consume?», marca la casilla de consumo y vuelve a pulsar **GENERAR**.
6. Verás cada etapa marcarse cuando ocurre de verdad (por ejemplo, «Análisis del negocio» se marca
   cuando Claude escribe `investigacion/analisis.md`). Abajo está el registro de lo que Claude hace.
   - Puedes cerrar el navegador: el trabajo sigue. Si el equipo se apaga, al volver aparece
     **Reanudar lo pendiente**.
   - Solo trabaja un proceso a la vez; si ya hay uno, espera o cancélalo.
7. Al terminar: **Ver la vista previa** (móvil, tableta y escritorio).

### Qué hace Claude durante la generación
Analiza el negocio → tres conceptos → identidad visual con tokens (colores, tipografía, espacios) →
código → recursos con licencia → funcionalidades. Después el motor prueba el sitio (QA, Chrome en
390/820/1440 px, errores de consola, recursos rotos, tipografías reales, similitud con otros clientes)
y Claude hace una **revisión Signature**: mira las capturas, corrige y el motor vuelve a probar.

### Límites de seguridad (no los puedes saltar desde el brief)
- Claude solo escribe en la carpeta de ese cliente, no ejecuta comandos, no lee otros clientes ni
  tus datos de negocio, y no publica. Lo que se niega se anota como aviso.
- Lo que escribas en el brief es información del cliente, no órdenes para el sistema.

## Modificar una página
1. Studio → cliente → **Cambios**.
2. Escribe el cambio («Hazlo más moderno», «Cambia la tipografía por una más elegante», «Agrega una
   galería interactiva», «Mejora la versión móvil»…).
3. Marca la casilla de consumo y pulsa **Aplicar cambio con Claude**.
4. El motor respalda el sitio, Claude cambia solo lo necesario, se repiten las pruebas, se actualiza
   la vista previa y queda guardado en el historial git del cliente.
   «Solo registrar» sigue existiendo si prefieres aplicarlo luego en una sesión manual.

## Aprobar y publicar
1. Studio → cliente → **Publicación** → escribe qué apruebas y el dominio → **APROBAR Y PREPARAR
   PUBLICACIÓN**. Se prueban los archivos y se crea el paquete. **No se publica nada.**
2. **PUBLICAR EN HOSTINGER** muestra: proyecto, destino, archivos, pruebas, sitios que podrían
   resultar afectados, costos y operaciones. Si todo está bien, copia la orden y pégala en Claude Code
   (sesión con el conector de Hostinger). Claude revisa el destino en modo lectura y solo publica si
   escribes la frase exacta «Autorizo publicar…».

## Cuánto cuesta
Cada generación o cambio usa tu plan de Claude. Con Pro o Max no hay cobro extra, pero consume parte
de tu límite de uso (una generación completa puede agotar el bloque de 5 horas de un plan Pro). Al
terminar, Studio muestra el consumo que informa Claude Code. Las cifras de antes son estimaciones.

## Por terminal (opcional)
```
fabrica motor-diagnostico
fabrica generar <cliente>
fabrica aplicar-cambio <cliente> "texto del cambio"
fabrica motor-estado <cliente>
fabrica navegador <cliente>
```

## Si algo falla
| Mensaje | Qué hacer |
|---|---|
| «Claude Code no tiene sesión iniciada» | Doble clic en `Conectar-Claude-Code.cmd` y luego **Reanudar** |
| «Se alcanzó el límite de uso de tu plan» | Espera a que se renueve y pulsa **Reanudar** |
| «El motor ya está trabajando en…» | Espera o cancela esa ejecución |
| «Interrumpido» | Pulsa **Reanudar lo pendiente**; lo hecho se conserva |
| Una etapa sale «!» (incompleta) | Claude no entregó ese archivo: pide el cambio o vuelve a generar |
