# ADR-0003: Publicar solo con autorización explícita

**Estado:** Aceptado · **Fecha:** 2026-10-21 (regla vigente desde 2026-10-15) · **Decide:** Diego Guevara

## Decisión
Ningún asistente ni script publica en Hostinger, activa GitHub Pages, cambia dominios o DNS, compra, gasta créditos (imágenes IA, tokens extra) ni contacta a una empresa sin que Diego lo autorice por escrito para ese caso.
- La fábrica separa «APROBAR Y PREPARAR PUBLICACIÓN» de «PUBLICAR EN HOSTINGER»; la segunda nunca corre sola.
- El conector de Hostinger se usa en **solo lectura** salvo autorización.
- Este repositorio no tiene GitHub Pages activado; la portada `index.html` se ve en local.

## Consecuencias
Más pasos manuales, a cambio de que nada llegue a internet ni cueste dinero por error.
