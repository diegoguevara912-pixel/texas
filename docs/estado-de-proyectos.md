# Estado de los proyectos

Última actualización: 2026-10-21. Se actualiza al cerrar cada trabajo. Los pendientes también están en Linear (proyecto «WEBS · repositorio texas»).

## Fábrica Web Signature — v2.0.0
**Hecho:** motor de 20 etapas con 4 modos para controlar tokens, paletas con contraste medido, tipografía por personalidad, imágenes de bancos con licencia comprobada, motor de movimiento propio + GSAP/Lenis/three.js locales, capturas por sección, crítico independiente, Signature Studio con botón GENERAR. 24 pruebas pasan (2 se omiten sin Chrome).
**Sin verificar:** el motor 2.0 con Claude real (solo con simulador).
**Espera a Diego:**
- Sí/no a la primera revisión real del piloto («Refinamiento Signature», 1-3 M tokens de su plan).
- Reconectar el conector de Hostinger (solo lectura).
- Opcional: claves gratis de Pexels/Unsplash en su equipo para mejores fotos.
**Antes de publicar cualquier cliente:** medir Lighthouse y autoalojar las fuentes.

## Autolote Ultra Premium 3D — v0.1.0
**Hecho:** concepto «Atelier Nocturno», showroom 3D con vehículo conceptual hecho por código, catálogo, fichas, simulador (tasa ilustrativa marcada), formularios, panel admin con cuentas. 35 pruebas pasan.
**Espera a Diego:**
- Confirmar en hPanel si su plan tiene «Node.js Web App»; si no, decidir entre cambiar de plan o backend en PHP.
- Datos comerciales del autolote: nombre, logo, WhatsApp, dirección, horarios.
- Un modelo `.glb` con licencia comercial si se quiere un vehículo realista.
**Antes de publicar:** quitar los 7 vehículos DEMO, cargar inventario real, definir tasas autorizadas.

## Clientes
| Cliente | Tipo | Estado |
|---|---|---|
| Sonrisa Norte | Clínica dental **ficticia** (prueba de la fábrica) | Versión 1 generada con Claude real; QA apto con ajustes |
| Sonrisa Norte · piloto 2.0 | La misma, con Signature 2.0 | QA 35 aprobadas / 0 críticas; navegador 13/13 |
| Equinsa Energy | Demo **no oficial** de una empresa real | Fuera del repo hasta que Diego decida si va en un repo público; 14 datos por confirmar; contactar a la empresa no está autorizado |

## Agentes y plugins
- `agentes-webs` v0.1.0: 15 agentes validados con `claude plugin validate`. Pendiente: instalarlos en la fábrica solo si Diego lo pide.
- Plugin `fabrica-web-signature` para la nube: 15 comandos.

## Sincronizar el Escritorio con el repositorio
Hoy el trabajo diario sigue en `Escritorio\Fabrica-Web-Signature` y `Escritorio\Autolote-Ultra-Premium`. Hasta que Diego trabaje directamente desde un clon de `texas`, cada cambio importante se copia aquí con un PR.
