# WEBS · repositorio `texas`

**Portada:** [`index.html`](index.html) · **Privacidad:** [`privacidad/`](privacidad/index.html) · **Documentación:** [`docs/`](docs/README.md)

WEBS es la empresa de soluciones digitales de Diego Guevara (Honduras): páginas web a medida, aplicaciones web y automatizaciones para negocios. Este repositorio reúne en un solo lugar todo lo que la empresa ha construido: sus productos internos, los proyectos de clientes, el equipo de agentes de IA, las herramientas y la documentación.

> **Estado:** en desarrollo. Nada de este repositorio está publicado en Hostinger ni en un dominio. Los clientes que aparecen aquí son **ficticios o demostrativos**, y lo dice cada proyecto.

## Qué hay aquí

| Carpeta | Qué es | Tecnología | Pruebas |
|---|---|---|---|
| [`productos/fabrica-web-signature/`](productos/fabrica-web-signature/README.md) | **Fábrica Web Signature v2.0**: convierte el brief de un negocio en una página web Signature (a medida, premium), con Signature Studio, motor de generación con Claude Code, control de calidad y preparación para Hostinger. | Python 3 (solo biblioteca estándar), HTML/CSS/JS | 24 (`unittest`) |
| [`productos/autolote-ultra-premium/`](productos/autolote-ultra-premium/README.md) | **Autolote Ultra Premium 3D**: showroom digital 3D con catálogo, fichas, simulador de financiamiento, formularios y panel administrativo. Proyecto independiente de la fábrica. | Node.js, Express, React, Vite, three.js, MySQL/SQLite | 35 (`vitest`) |
| [`clientes/`](clientes/README.md) | Proyectos de clientes hechos con la fábrica (cada uno con su brief, diseño, QA y sitio). | HTML/CSS/JS estático | QA de la fábrica |
| [`agentes/`](agentes/README.md) | **15 agentes especialistas** (subagentes de Claude Code): estrategia, arte, UX, frontend, backend, 3D, SEO, seguridad, QA, despliegue… | Plugin de Claude Code | — |
| [`plugins/fabrica-web-signature-nube/`](plugins/fabrica-web-signature-nube/README.md) | Los 15 comandos de la fábrica empaquetados como plugin para sesiones en la nube. | Plugin de Claude Code | — |
| [`herramientas/`](herramientas/LEEME.md) | Instalador de clientes para la fábrica en Windows. | PowerShell | — |
| [`docs/`](docs/README.md) | Decisiones (ADR), estado de los proyectos, investigación, licencias y manuales. | Markdown | — |
| [`tests/`](tests/) | Pruebas del repositorio: estructura, enlaces y que no se suban secretos ni datos personales. | `node --test` | `npm test` |

## Cómo empezar

**Requisitos:** Git, Node.js 20 o superior y Python 3.11 o superior.

```bash
git clone https://github.com/diegoguevara912-pixel/texas.git
cd texas
npm test                  # pruebas del repositorio (sin instalar nada)
npm run test:fabrica      # 24 pruebas de la fábrica
npm run test:autolote     # instala dependencias del autolote y corre sus 35 pruebas
```

- **Ver la portada en local:** `python -m http.server 8000` y abrir http://localhost:8000
- **Fábrica:** ver [productos/fabrica-web-signature/README.md](productos/fabrica-web-signature/README.md). En el equipo de Diego vive en `Escritorio\Fabrica-Web-Signature` y se abre con `Abrir-Signature-Studio.cmd`.
- **Autolote:** ver [productos/autolote-ultra-premium/README.md](productos/autolote-ultra-premium/README.md) (`npm install`, `npm start`, http://localhost:3001).

## Estructura

```
texas/
├─ README.md               este archivo
├─ CLAUDE.md               reglas para Claude Code (y AGENTS.md para otros asistentes)
├─ CHANGELOG.md            historial de versiones del repositorio
├─ CONTRIBUTING.md         cómo se trabaja: ramas, PR, pruebas, identidad de commits
├─ SECURITY.md             secretos, datos de clientes y cómo reportar un problema
├─ index.html              portada del portafolio WEBS (estática, sin dependencias)
├─ privacidad/             política de privacidad de la portada y de los proyectos
├─ productos/
│  ├─ fabrica-web-signature/   Fábrica Web Signature v2.0 (sin datos de clientes)
│  └─ autolote-ultra-premium/  Showroom 3D del autolote
├─ clientes/               un proyecto por cliente (ficticios o demostrativos)
├─ agentes/                plugin «agentes-webs» con los 15 agentes
├─ plugins/                plugin de la fábrica para la nube
├─ herramientas/           instalador de clientes (Windows)
├─ docs/
│  ├─ adr/                 decisiones de arquitectura numeradas
│  ├─ estado-de-proyectos.md
│  ├─ licencias.md         licencias de terceros (bibliotecas, fuentes, fotos)
│  ├─ investigacion/       comparaciones de herramientas y cambios aplicados
│  └─ README.md            índice de toda la documentación
├─ tests/                  pruebas del repositorio
└─ .github/                pruebas automáticas (Actions) y plantilla de PR
```

## Reglas de la empresa

1. **Nada se publica sin autorización.** Ni Hostinger, ni GitHub Pages, ni dominios, ni DNS, ni compras, sin el «sí» explícito de Diego. Ver [ADR-0003](docs/adr/0003-publicacion-solo-con-autorizacion.md).
2. **No se inventan datos.** Precios, tasas, testimonios, vehículos o datos de un cliente que no estén confirmados se marcan como `PENDIENTE` o como ficticios.
3. **Sin secretos en el repositorio.** Las claves van en `.env` (ignorado por git) o en las variables de entorno de Hostinger. Ver [SECURITY.md](SECURITY.md).
4. **Cada cliente vive aislado** en su carpeta, separado del código de los productos. Ver [ADR-0002](docs/adr/0002-clientes-separados-del-codigo.md).
5. **Cambios por rama y PR**, con las pruebas en verde. Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Derechos

© 2026 Diego Guevara · WEBS. Todos los derechos reservados salvo donde se indique otra licencia. Las bibliotecas, fuentes y fotografías de terceros conservan su propia licencia: ver [docs/licencias.md](docs/licencias.md).
