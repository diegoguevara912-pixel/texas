"""SIMULADOR de Claude Code para las pruebas de la fábrica. NO es Claude.

Imita la interfaz del modo no interactivo (`-p ... --output-format stream-json`) para
comprobar el motor sin gastar uso: escribe archivos de ejemplo en la carpeta del cliente
y emite los mismos tipos de eventos que Claude Code. Nunca se usa fuera de las pruebas
(el motor solo lo usa si la variable FABRICA_CLAUDE apunta a este archivo).

Variables: SIMULADO_FALLO=sesion|sin_sitio · SIMULADO_ESPERA=segundos entre pasos.
"""
import json
import os
import re
import sys
import time
import uuid
from pathlib import Path

args = sys.argv[1:]
if args[:1] == ["--version"]:
    print("0.0.0 (simulador de pruebas, no es Claude Code)")
    sys.exit(0)
if args[:2] == ["auth", "status"]:
    print(json.dumps({"loggedIn": os.environ.get("SIMULADO_FALLO") != "sesion", "authMethod": "simulado"}))
    sys.exit(0)

prompt = args[args.index("-p") + 1]
slug = re.search(r"cliente `([a-z0-9-]+)`", prompt).group(1)
clientes = Path(os.environ.get("FABRICA_CLIENTES") or Path.cwd() / "clients")
carpeta = clientes / slug
espera = float(os.environ.get("SIMULADO_ESPERA", "0.05"))
sesion = args[args.index("--resume") + 1] if "--resume" in args else str(uuid.uuid4())
(carpeta / "motor").mkdir(exist_ok=True)
with (carpeta / "motor" / "argumentos-simulador.json").open("a", encoding="utf-8") as f:
    f.write(json.dumps(args[2:], ensure_ascii=False) + "\n")


def emitir(ev):
    print(json.dumps(ev, ensure_ascii=False), flush=True)


def escribir(rel, texto):
    p = carpeta / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(texto, encoding="utf-8")
    emitir({"type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Write", "input": {"file_path": str(p)}}]}})
    time.sleep(espera)


emitir({"type": "system", "subtype": "init", "session_id": sesion, "model": "simulador"})
if os.environ.get("SIMULADO_FALLO") == "sesion":
    print("Invalid API key · Please run /login", file=sys.stderr)
    emitir({"type": "result", "subtype": "error_during_execution", "is_error": True, "result": "Not logged in", "session_id": sesion})
    sys.exit(1)

brief = json.loads((carpeta / "brief.json").read_text(encoding="utf-8"))
nombre = brief.get("nombre_comercial") or brief["nombre_empresa"]
titular = brief.get("tipografia_principal") or "Fraunces"
texto = brief.get("tipografia_secundaria") or "Figtree"

if "MODIFICACIÓN" in prompt:
    cambio = re.search(r"<<<CAMBIO\n(.*?)\nCAMBIO>>>", prompt, re.S).group(1)
    css = carpeta / "sitio" / "assets" / "css" / "tokens.css"
    escribir("sitio/assets/css/tokens.css", css.read_text(encoding="utf-8").replace("#7A2E1F", "#1F4E7A"))
    pedidos = carpeta / "cambios-solicitados.md"
    pedidos.write_text(pedidos.read_text(encoding="utf-8").replace("[pendiente]", "[hecho]"), encoding="utf-8")
    escribir("motor-resumen.md", f"# Resumen (simulador)\n\nCambio aplicado: {cambio}\n")
elif "REVISIÓN SIGNATURE" in prompt or "CORRECCIÓN SIGNATURE" in prompt:
    for c in ("auto-movil.png", "auto-escritorio.png"):
        emitir({"type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Read", "input": {"file_path": str(carpeta / "qa" / "capturas" / c)}}]}})
    escribir("qa/revision-visual.md", "# Revisión visual (simulador)\n\nNo es una revisión real: la escribió el simulador de pruebas.\n")
elif "CRÍTICA SIGNATURE" in prompt:
    escribir("qa/critica.json", json.dumps({"criterios": {"originalidad": {"nota": 7, "evidencia": "simulada"}, "composicion": {"nota": 8, "evidencia": "simulada"}},
                                            "problemas": [{"seccion": "hero", "severidad": "alta", "problema": "simulado", "correccion": "simulada"}],
                                            "veredicto": "corregir"}, ensure_ascii=False))
    escribir("qa/rubrica.md", "# Rúbrica (simulador)\n")
else:
    direccion = "DIRECCIÓN ARTÍSTICA" in prompt or "PRUEBA RÁPIDA" in prompt
    construccion = "CONSTRUCCIÓN" in prompt or "PRUEBA RÁPIDA" in prompt
    if direccion:
        escribir("investigacion/analisis.md", f"# Análisis (simulador)\n\n{nombre}: texto de prueba, no es un análisis real.\n")
        if "PRUEBA RÁPIDA" not in prompt:
            escribir("diseno/percepcion.md", "# Percepción (simulador)\n")
        escribir("diseno/conceptos.md", "# Conceptos (simulador)\n\n1. Uno\n2. Dos\n3. Tres (elegido)\n")
        if "PRUEBA RÁPIDA" not in prompt:
            escribir("diseno/direccion.json", json.dumps({"concepto_elegido": 3, "concepto": "Tres", "tipografia": {"display": titular, "texto": texto},
                                                          "movimiento": {"perfil": "sereno-preciso", "escenas": ["aparecer"]}, "bibliotecas": ["gsap"],
                                                          "arquitectura": [{"pagina": "index.html", "secciones": ["hero"]}]}, ensure_ascii=False))
            escribir("recursos/plan-imagenes.json", json.dumps({"direccion_fotografica": {"estilo": "simulado"},
                                                                "imagenes": [{"id": "fondo", "fuente": "programada", "proposito": "simulado"}]}))
        escribir("diseno/identidad.json", json.dumps({"concepto": "Simulado", "paleta": {"fondo": "#FFF8F0", "acento": "#7A2E1F"},
                                                      "tipografias": [titular, texto], "composicion": "simulada", "hero_tipo": "simulado",
                                                      "secciones": ["hero", "menu"], "animaciones": []}, ensure_ascii=False))
        escribir("diseno/identidad.md", "# Identidad (simulador)\n")
        escribir("sitio/assets/css/tokens.css", f":root {{ --color-fondo: #FFF8F0; --color-texto: #1A1A1A; --c-fondo: #FFF8F0; --c-acento: #7A2E1F; "
                                                f"--font-titulos: \"{titular}\", serif; --font-texto: \"{texto}\", sans-serif; }}\n")
    if construccion and os.environ.get("SIMULADO_FALLO") != "sin_sitio":
        escribir("sitio/assets/css/sitio.css", "body{font-family:var(--font-texto);background:var(--c-fondo);margin:0}h1{font-family:var(--font-titulos)}\n")
        escribir("sitio/index.html", f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>{nombre} (demo simulada)</title><meta name="description" content="Demostración generada por el simulador de pruebas.">
<link rel="stylesheet" href="assets/css/tokens.css"><link rel="stylesheet" href="assets/css/sitio.css"></head>
<body><main id="contenido"><h1>{nombre}</h1><p>Demostración con datos de ejemplo (simulador).</p></main>
<script src="assets/js/main.js" defer></script></body></html>""")
        escribir("recursos/licencias.md", f"# Licencias (simulador)\n\n| {titular} | Google Fonts | OFL |\n")
        escribir("sitio/assets/js/main.js", "document.documentElement.classList.add('js');\n")
        escribir("sitio/robots.txt", "User-agent: *\nDisallow: /\n")
    escribir("motor-resumen.md", "# Resumen (simulador)\n\nSitio de prueba generado por el simulador.\n")

emitir({"type": "result", "subtype": "success", "is_error": False, "num_turns": 7, "total_cost_usd": 0.0,
        "usage": {"input_tokens": 10, "output_tokens": 20, "cache_read_input_tokens": 30}, "result": "Listo (simulador)",
        "session_id": sesion, "permission_denials": []})
