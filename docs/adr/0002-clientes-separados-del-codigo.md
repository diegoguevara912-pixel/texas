# ADR-0002: Los clientes van separados del código de los productos

**Estado:** Aceptado · **Fecha:** 2026-10-21 · **Decide:** Diego Guevara

## Contexto
La fábrica guarda cada cliente en `clients/<slug>/` y su `.gitignore` excluye esa carpeta: «los datos de clientes no van al repositorio de la fábrica». El repositorio es público.

## Decisión
- `productos/fabrica-web-signature/clients/` sigue ignorada por git.
- Los proyectos que sí se pueden mostrar van en `clientes/<slug>/`, uno por carpeta, sin registros del motor (`motor/`), sin fotos descartadas y sin datos personales.
- Para usar la fábrica con esta carpeta: variable `FABRICA_CLIENTES` apuntando a `clientes/` (la fábrica ya la soporta).
- Una demo de una empresa real solo se sube con la confirmación de Diego, con el aviso «Propuesta de demostración no oficial» y `noindex`.

## Consecuencias
- El código de la fábrica no se mezcla con el contenido de cada cliente, y un cliente nunca ve archivos de otro.
- Equinsa Energy (demo no oficial de una empresa real) queda fuera hasta que Diego decida si la quiere en un repositorio público.
