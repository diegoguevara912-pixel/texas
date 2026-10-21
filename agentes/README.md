# Agentes WEBS: el equipo de la Fábrica Web Signature

Son 15 agentes especialistas de Claude Code, uno por cada rol del prompt maestro. Cada uno es un archivo `.md` en `agents/` con su tarea, sus pasos, lo que entrega y las reglas comunes de WEBS.

Un agente es como un colega especialista: Claude (la sesión principal) le pasa una tarea concreta, el agente la hace en su propio espacio y devuelve un resumen. Así el diseño, el código y las revisiones no se mezclan, y cada parte la hace alguien con instrucciones precisas.

## El equipo y en qué etapa de la fábrica entra

| Agente | Qué hace | Etapa de la fábrica |
|---|---|---|
| `estratega-marca` | Entiende el negocio, el público y la competencia; define posicionamiento y mensajes | /analizar-negocio |
| `director-creativo` | Propone tres conceptos distintos y recomienda uno | /concepto-signature |
| `director-arte` | Convierte el concepto en colores, tipografía, composición e imágenes con licencia | /diseno-signature, /recursos-visuales |
| `disenador-ux-ui` | Recorridos del visitante, jerarquía de cada página, estados de botones y formularios | /diseno-signature |
| `arquitecto-software` | Estructura del sitio, páginas, componentes y tecnología (estático por defecto) | inicio de /generar-web |
| `ingeniero-frontend` | Construye y modifica las páginas | /generar-web, /modificar-web |
| `ingeniero-backend` | Formularios, cotizadores, reservas, pagos, paneles (solo si el brief los pide) | /generar-web |
| `automatizacion-ia` | Chatbots y flujos automáticos (solo si el brief los pide) | /interacciones-premium |
| `animaciones-interacciones` | Un momento de movimiento con intención y microinteracciones | /interacciones-premium |
| `experiencias-3d` | 3D solo cuando explica algo mejor que una foto | /interacciones-premium |
| `marketing-conversion` | Textos y llamadas a la acción del sitio del cliente | /generar-web, /optimizar-web |
| `seo-tecnico` | Títulos, datos estructurados, sitemap, rendimiento | /optimizar-web |
| `seguridad` | Revisa secretos expuestos, formularios y cabeceras. Solo reporta | /auditoria-signature |
| `control-calidad` | Prueba el sitio completo en móvil y escritorio. Solo reporta | /auditoria-signature, /vista-previa |
| `despliegue-hostinger` | Prepara la carpeta `publicar/` y los pasos. No publica | /preparar-hostinger |

## Reglas que todos cumplen
- Trabajan solo en la carpeta del proyecto que se les indica; nunca mezclan clientes.
- No inventan testimonios, cifras ni certificaciones; dejan `[PENDIENTE: …]`.
- No guardan contraseñas ni claves en archivos.
- Ninguno publica, gasta dinero, envía mensajes ni toca Hostinger. Publicar sigue requiriendo que Diego escriba "Autorizo publicar…".
- Nivel Signature por defecto.
- `seguridad` y `control-calidad` no pueden modificar archivos: solo leen, prueban y reportan.

## Cómo instalarlos

**En tu computadora (Windows), opción simple:** copia los 15 archivos de `agents/` a `C:\Users\<tu usuario>\.claude\agents\`. Desde la próxima sesión de Claude Code estarán disponibles en cualquier carpeta.

**Solo dentro de la fábrica:** cópialos a `Escritorio\Fabrica-Web-Signature\.claude\agents\`. Así viajan con la fábrica y se respaldan en OneDrive.

**Como plugin:** el archivo `agentes-webs.plugin` (en `webs/`) contiene lo mismo empaquetado. En ese caso los nombres llevan el prefijo `agentes-webs:` (por ejemplo `agentes-webs:director-creativo`).

Para comprobar que se cargaron, escribe `/agents` en Claude Code: deben aparecer los 15.

## Cómo usarlos
Normalmente no tienes que llamarlos tú: la fábrica los usa en cada etapa. Si quieres pedir algo directo, escríbelo en lenguaje normal, por ejemplo:

- "Usa el director creativo para proponer conceptos para el cliente `panaderia-demo`."
- "Que control de calidad revise el proyecto `clinica-demo`."
- "Pide a seguridad que revise `constructora-demo` antes de preparar la publicación."

## Qué está verificado (2026-10-15)
- Los 15 archivos pasan la validación oficial de plugins de Claude Code (`claude plugin validate`).
- Una sesión nueva de Claude Code cargó los 15 agentes.
- Prueba real del agente `seguridad` sobre una página de prueba ficticia con una clave falsa: la detectó como crítica, propuso el arreglo y no modificó ningún archivo.
- No se ha probado todavía el equipo completo en un proyecto real; eso queda para cuando Diego decida empezar.

## Cómo cambiar un agente
Edita su archivo en `agents/`. La primera parte (entre `---`) dice su nombre, cuándo usarlo y qué herramientas tiene; el resto son sus instrucciones. Si se usa como plugin, sube la versión en `.claude-plugin/plugin.json` y vuelve a empaquetar.
