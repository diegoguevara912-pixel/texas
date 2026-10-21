# Módulos 21-22 · Modificaciones, mantenimiento, documentación y entrega

## Modificar un sitio existente (etapa J)
1. Identificar el cliente exacto (`listar`) y leer `ESTADO.md`, `diseno/identidad.md`,
   `cambios-solicitados.md` y los archivos afectados.
2. `python core/fabrica.py respaldo <slug>` antes de editar.
3. Aplicar el cambio mínimo con los tokens y componentes existentes. No rediseñar lo que no se pidió
   (salvo que Diego pida "mejorar el diseño Signature": entonces revisar la rúbrica y rediseñar lo débil).
4. Marcar el cambio como `[hecho]` en `cambios-solicitados.md`.
5. `qa` + vista previa; comprobar que nada más se rompió.
6. `estado <slug> cambios --nota "qué se cambió"`.
7. Si el sitio está publicado, el cambio no sale a producción sin el procedimiento del módulo 10.

Sitios hechos fuera de la fábrica: inventario breve (estructura, stack, estilos) en
`investigacion/inventario.md` antes de tocar nada.

## Agregar una funcionalidad
Seguir el módulo 06; justificar utilidad; registrar dependencias y costos en la ficha técnica.

## Documentación de entrega (etapa M) — `entrega/documentacion/`
- `guia-cliente.md` (lenguaje simple): qué tiene su web, cómo pedir cambios, qué no tocar.
- `ficha-tecnica.md`: alcance, características, funcionalidades, tecnologías, requisitos técnicos,
  recursos y licencias, dependencias de terceros, **costos recurrentes conocidos** (dominio,
  hosting, servicios), estado de publicación, accesos que gestiona el propietario (sin contraseñas:
  indicar dónde las guarda él), instrucciones de mantenimiento.
- `mantenimiento.md`: qué incluye y qué no; precios solo si Diego los definió.
- Borrador del mensaje de entrega para que Diego lo revise y envíe él (Claude no lo envía).
- `python core/fabrica.py entrega <slug>` crea el zip de entrega (sitio, diseño, recursos, brief y
  documentación; sin historial interno ni respaldos).

Favorecer que el cliente sea titular de su dominio y sus cuentas. No transferir claves por medios
inseguros (nunca por WhatsApp o correo en texto plano; recomendar un gestor de contraseñas).

## Mejora continua de la fábrica
- Lecciones reutilizables: `python core/fabrica.py aprendizaje "…"` → `docs/aprendizaje.md`.
- Cambios a la propia fábrica: `CHANGELOG.md` y `PROJECT_STATUS.md`.
- No se modifican proyectos anteriores al mejorar componentes compartidos sin comprobar el impacto.
- Esto no es entrenamiento del modelo: es conocimiento en archivos que Claude lee en sesiones futuras.
