# Uso en cada entorno

## Tu equipo (Windows, app de Claude, pestaña Code) — entorno principal
- Abre Claude en la carpeta `Fabrica-Web-Signature`: carga `CLAUDE.md` y la skill de proyecto.
- En cualquier otra carpeta funciona la **skill personal** (`%USERPROFILE%\.claude\skills\fabrica-web-signature`),
  que apunta a esta carpeta.
- Studio, vista previa y pruebas corren aquí (Python local).
- Si la skill no aparece tras instalarla, abre una sesión nueva de Claude.

## Sesiones en la nube (Claude Code en claude.ai o hilos del proyecto que corren en la nube)
- **No** ven tu Escritorio ni tus skills locales. Una skill guardada en tu equipo no está disponible
  automáticamente allí.
- Opciones: (1) trabajar los clientes desde tu equipo (recomendado); (2) subir la carpeta a un
  repositorio de GitHub privado y abrirlo en la nube: la skill de proyecto viaja con él;
  (3) usar el plugin antiguo de la nube (ver abajo).
- El conector de Hostinger está disponible en ambos entornos porque vive en tu cuenta de claude.ai.

## El plugin anterior "fabrica-web-signature" (15 comandos, hecho en la nube)
- Paquete: biblioteca del proyecto WEBS, `webs/fabrica-web-signature.plugin`. **No está instalado en este equipo**
  (comprobado el 14/10/2026), así que no hay choque de nombres.
- Esta fábrica lo reemplaza: sus 15 comandos son ahora modos y módulos de la skill, con motor, Studio y pruebas.
- Si algún día lo instalas, sus skills aparecen con prefijo (`fabrica-web-signature:nuevo-cliente`,
  etc.) y conviven, pero usan otra carpeta (`proyectos-web/`). Recomendación: no instalarlo en este
  equipo; usarlo solo en la nube si lo necesitas. No se desinstala nada sin preguntarte.

## Claude Code por terminal
El ejecutable existe en este equipo pero no tiene sesión iniciada para uso por terminal
(`claude -p` respondió "Not logged in"). No hace falta para usar la fábrica desde la app.
