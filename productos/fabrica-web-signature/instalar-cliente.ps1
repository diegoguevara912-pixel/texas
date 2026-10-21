# Instala en la fabrica un cliente descargado como zip (por ejemplo equinsa-energy-demo.zip).
# Uso: doble clic en Instalar-Cliente.cmd (busca el zip mas reciente en Descargas),
#      o arrastra el zip encima de Instalar-Cliente.cmd.
param([string]$Zip)
$ErrorActionPreference = 'Stop'
$Fabrica = Split-Path -Parent $MyInvocation.MyCommand.Path

function Paso($t) { Write-Host ""; Write-Host "== $t" -ForegroundColor Cyan }
function Fin($t, $color) { Write-Host ""; Write-Host $t -ForegroundColor $color; Read-Host "Pulsa Enter para cerrar" | Out-Null; exit }

if (-not (Test-Path (Join-Path $Fabrica 'clients')) -and -not (Test-Path (Join-Path $Fabrica 'core'))) {
  Fin "Este archivo debe estar dentro de la carpeta Fabrica-Web-Signature (junto a fabrica.cmd)." Red
}
$Clients = Join-Path $Fabrica 'clients'
New-Item -ItemType Directory -Force -Path $Clients | Out-Null

Paso "1. Buscando el zip"
if (-not $Zip) {
  try { $Descargas = (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path } catch { $Descargas = Join-Path $env:USERPROFILE 'Downloads' }
  $z = Get-ChildItem -Path $Descargas -Filter '*.zip' -File | Where-Object { $_.Name -like '*-demo*.zip' -or $_.Name -like '*cliente*.zip' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $z) { Fin "No encontre ningun zip de cliente en $Descargas. Descargalo del hilo o arrastralo encima de Instalar-Cliente.cmd." Red }
  $Zip = $z.FullName
}
Write-Host "Zip: $Zip"

Paso "2. Revisando el contenido"
$Tmp = Join-Path $env:TEMP ("fabrica-" + [guid]::NewGuid().ToString('N'))
Expand-Archive -LiteralPath $Zip -DestinationPath $Tmp -Force
$Raiz = Get-ChildItem -Path $Tmp -Directory
if ($Raiz.Count -ne 1 -or -not (Test-Path (Join-Path $Raiz[0].FullName 'sitio\index.html'))) {
  Remove-Item $Tmp -Recurse -Force
  Fin "El zip no tiene la forma esperada (<cliente>\sitio\index.html). No se copio nada." Red
}
$Slug = $Raiz[0].Name
if ($Slug -notmatch '^[a-z0-9][a-z0-9-]*$') { Remove-Item $Tmp -Recurse -Force; Fin "Nombre de cliente no valido: $Slug" Red }
$Destino = Join-Path $Clients $Slug
Write-Host "Cliente: $Slug"

Paso "3. Copiando a clients\$Slug"
if (Test-Path $Destino) {
  $Resp = Join-Path $Fabrica ("clients-respaldos\" + $Slug + "-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Force -Path (Split-Path $Resp) | Out-Null
  Move-Item -LiteralPath $Destino -Destination $Resp
  Write-Host "Ya existia: la version anterior quedo en $Resp" -ForegroundColor Yellow
}
Move-Item -LiteralPath $Raiz[0].FullName -Destination $Destino
Remove-Item $Tmp -Recurse -Force
Write-Host "Listo: $Destino"

Paso "4. Pruebas de la fabrica (fabrica qa $Slug)"
$ErrorActionPreference = 'Continue'
Push-Location $Fabrica
if (-not (Test-Path (Join-Path $Destino 'estado.json'))) {
  # Los zip hechos en la nube no traen estado.json: sin el, la fabrica y Studio no ven al cliente.
  Write-Host "El cliente no esta registrado en la fabrica (falta estado.json): 'fabrica qa' y Signature Studio no lo veran." -ForegroundColor Yellow
  Write-Host "Pidele a Claude: 'registra el cliente $Slug en la fabrica' y luego vuelve a correr 'fabrica qa $Slug'." -ForegroundColor Yellow
}
try {
  if (Test-Path '.\fabrica.cmd') { & cmd /c ".\fabrica.cmd qa $Slug" }
  elseif (Test-Path '.\core\fabrica.py') { & python '.\core\fabrica.py' qa $Slug }
  else { Write-Host "No encontre fabrica.cmd ni core\fabrica.py; se omiten las pruebas." -ForegroundColor Yellow }
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { Write-Host "Las pruebas terminaron con avisos (codigo $LASTEXITCODE). Revisa clients\$Slug\qa\." -ForegroundColor Yellow }
} catch { Write-Host "No se pudieron ejecutar las pruebas: $($_.Exception.Message)" -ForegroundColor Yellow }

Paso "5. Guardando la version en git (solo en tu equipo, no sube nada)"
if (Get-Command git -ErrorAction SilentlyContinue) {
  # clients/ esta en el .gitignore de la fabrica (los datos de clientes no van a su repositorio),
  # asi que cada cliente lleva su propio historial de git dentro de clients\<cliente>.
  Pop-Location; Push-Location $Destino
  if ($Resp -and (Test-Path (Join-Path $Resp '.git')) -and -not (Test-Path '.\.git')) {
    # Se mueve (no se copia): copiar .git falla con rutas largas en Windows.
    try {
      Move-Item -LiteralPath (Join-Path $Resp '.git') -Destination (Join-Path $Destino '.git') -ErrorAction Stop
      Write-Host "Se conservo el historial de git de la version anterior."
    } catch { Write-Host "No se pudo conservar el historial anterior: $($_.Exception.Message)" -ForegroundColor Yellow }
  }
  if (-not (Test-Path '.\.git')) {
    git init -q
    Write-Host "Se creo el historial de git del cliente $Slug."
  }
  git add -A . 2>&1 | Out-Null
  git -c user.name="Fabrica Web Signature" -c user.email="fabrica@local" -c core.autocrlf=false commit -q -m "Cliente $Slug instalado desde $(Split-Path $Zip -Leaf)" 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "Version guardada en git (clients\$Slug)." }
  else {
    git diff --cached --quiet 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host "Git: no habia cambios nuevos que guardar." } else { Write-Host "Git no pudo guardar la version (codigo $LASTEXITCODE)." -ForegroundColor Yellow }
  }
} else { Write-Host "Git no esta disponible; se omite este paso." -ForegroundColor Yellow }
Pop-Location

Paso "6. Abriendo la vista previa"
Start-Process (Join-Path $Destino 'sitio\index.html')
Fin "Terminado. El cliente $Slug esta en clients\$Slug." Green
