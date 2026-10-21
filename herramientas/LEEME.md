# Instalar un cliente en la fábrica

1. Copia `Instalar-Cliente.cmd` e `instalar-cliente.ps1` a `Escritorio\Fabrica-Web-Signature\` (junto a `fabrica.cmd`). Solo se hace una vez.
2. Descarga el zip del cliente desde el hilo (queda en Descargas).
3. Doble clic en `Instalar-Cliente.cmd`.

El instalador busca el zip más reciente en Descargas, lo copia a `clients\<cliente>\` (si ya existía, guarda la versión anterior en `clients-respaldos\`), ejecuta `fabrica qa <cliente>`, guarda la versión en git en tu equipo (no sube nada a internet) y abre la vista previa.
También puedes arrastrar un zip encima de `Instalar-Cliente.cmd`.
