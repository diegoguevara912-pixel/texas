# ADR-0001: Un solo repositorio para toda la empresa

**Estado:** Aceptado · **Fecha:** 2026-10-21 · **Decide:** Diego Guevara

## Contexto
El trabajo de WEBS estaba repartido: la fábrica en `Escritorio\Fabrica-Web-Signature` (con git local), el autolote en `Escritorio\Autolote-Ultra-Premium` (sin git), los agentes, plugins e investigación en la carpeta del proyecto de Claude, y cada cliente con su propio historial local. Nada estaba en GitHub, así que no había respaldo fuera del equipo ni una forma ordenada de revisar cambios.

## Decisión
- Un monorepo público, `diegoguevara912-pixel/texas`, ordenado como el de Trofaxis: `README.md`, `CLAUDE.md`, `index.html`, `privacidad/`, `docs/` con ADR, `tests/` y GitHub Actions.
- Cada producto en `productos/<producto>/` conserva su estructura, su README, su CLAUDE.md y sus pruebas, para que se pueda seguir usando igual.
- **Se empieza con un historial nuevo.** Los historiales locales (git de la fábrica con sus etiquetas `recuperacion-v0.4.0`/`v0.5.0`, y el git de cada cliente) siguen en el equipo de Diego como respaldo; no se mezclan aquí.

## Alternativas
| Alternativa | Por qué no |
|---|---|
| Un repositorio por producto | Más repos que mantener para una persona; Diego pidió reunir todo en `texas` |
| Importar el historial de git de la fábrica con `git subtree` | El historial local incluye la carpeta de trabajo y respaldos que no deben ser públicos; revisarlo commit por commit no compensa |

## Consecuencias
- Un solo lugar para respaldar, revisar y documentar. Las pruebas de todos los productos corren en cada PR.
- La copia de la fábrica en el Escritorio y la del repositorio pueden separarse: ver [estado-de-proyectos.md](../estado-de-proyectos.md) para sincronizarlas.
