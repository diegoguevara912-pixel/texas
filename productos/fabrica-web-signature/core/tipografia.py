"""Tipografía del brief: catálogo con licencias, validación y comprobación en el sitio.

La elección final la hace Claude (si el brief no dice nada, elige una combinación
adecuada al negocio). Este módulo solo:
  - dice si una fuente pedida está en el catálogo con licencia libre,
  - resume para el motor qué pidió Diego y qué es obligatorio respetar,
  - comprueba después en el CSS del sitio que esas fuentes se aplicaron con variables.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CATALOGO = RAIZ / "templates" / "brief" / "catalogo-fuentes.json"
CAMPOS_FUENTE = ["tipografia_principal", "tipografia_secundaria", "tipografia_titulares", "tipografia_textos"]
GENERICAS = {"serif", "sans-serif", "monospace", "system-ui", "cursive", "inherit", "initial", "ui-sans-serif",
             "ui-serif", "segoe ui", "arial", "helvetica", "georgia", "times new roman", "-apple-system", "blinkmacsystemfont"}


def catalogo() -> list[dict]:
    return json.loads(CATALOGO.read_text(encoding="utf-8"))["fuentes"]


def _clave(nombre: str) -> str:
    return re.sub(r"\s+", " ", nombre.strip().strip("'\"")).lower()


def buscar(nombre: str) -> dict | None:
    k = _clave(nombre)
    return next((f for f in catalogo() if _clave(f["nombre"]) == k), None)


def pedidas(brief: dict) -> dict:
    """Fuentes que Diego escribió en el brief, por campo."""
    return {c: brief[c].strip() for c in CAMPOS_FUENTE if isinstance(brief.get(c), str) and brief[c].strip()}


def avisos(brief: dict) -> list[str]:
    """Avisos (no bloquean): fuentes fuera del catálogo o personalizadas sin licencia indicada."""
    salida = []
    for campo, nombre in pedidas(brief).items():
        if not buscar(nombre):
            salida.append(f"La fuente «{nombre}» no está en el catálogo con licencia libre: Claude debe confirmar que existe y que su licencia permite uso web; si no, usará la alternativa más parecida del catálogo y lo documentará.")
    personal = str(brief.get("tipografia_personalizada") or "")
    if personal and not re.search(r"(?i)licen|autoriz|permiso", personal):
        salida.append("Tipografía personalizada sin licencia o autorización indicada: no se usará hasta confirmarla.")
    return salida


def resumen_para_motor(brief: dict) -> str:
    p = pedidas(brief)
    lineas = []
    if not p and not brief.get("tipografia_personalizada"):
        lineas.append("Diego no eligió tipografía: elige tú una combinación profesional adecuada a la identidad del negocio (preferir el catálogo `templates/brief/catalogo-fuentes.json`).")
    for campo, nombre in p.items():
        f = buscar(nombre)
        etiqueta = campo.replace("tipografia_", "")
        lineas.append(f"- {etiqueta}: «{nombre}» — " + (f"en catálogo ({f['licencia']}, {f['categoria']}). OBLIGATORIO respetarla." if f else "fuera del catálogo: confirma existencia y licencia web antes de usarla; si no es viable, documenta la sustitución."))
    for clave, texto in (("tipografia_peso", "Peso visual"), ("tipografia_estilo", "Estilo editorial"), ("tipografia_mayusculas", "Mayúsculas"), ("tipografia_preferencias", "Otras preferencias"), ("tipografia_personalizada", "Archivos personalizados")):
        if brief.get(clave) and brief[clave] != "Decidir la fábrica":
            lineas.append(f"- {texto}: {brief[clave]}")
    lineas.append("Aplica la tipografía en todo el sitio mediante variables CSS (por ejemplo `--font-titulos`, `--font-texto`) definidas en `sitio/assets/css/tokens.css`.")
    return "\n".join(lineas)


def familias_en_css(sitio: Path) -> tuple[set[str], bool]:
    """Familias declaradas en el CSS/HTML del sitio y si se usan variables para las fuentes."""
    texto = ""
    for p in list(sitio.rglob("*.css")) + list(sitio.rglob("*.html")):
        if "respaldos" in p.parts:
            continue
        texto += p.read_text(encoding="utf-8", errors="replace") + "\n"
    familias = set()
    for valor in re.findall(r"font-family\s*:\s*([^;}{]+)", texto) + re.findall(r"--font[\w-]*\s*:\s*([^;}{]+)", texto):
        for parte in valor.split(","):
            nombre = _clave(parte)
            if nombre and not nombre.startswith("var(") and nombre not in GENERICAS:
                familias.add(nombre)
    for f in re.findall(r"family=([^&\"':]+)", texto):
        familias.add(_clave(f.replace("+", " ")))
    usa_variables = bool(re.search(r"--font[\w-]*\s*:", texto)) and "var(--font" in texto
    return familias, usa_variables


def comprobar_sitio(brief: dict, sitio: Path) -> tuple[str, str]:
    """('aprobada'|'fallida', detalle) para el QA."""
    familias, variables = familias_en_css(sitio)
    faltan = [n for n in pedidas(brief).values() if buscar(n) and _clave(n) not in familias]
    problemas = []
    if faltan:
        problemas.append("no aparecen en el CSS: " + ", ".join(faltan))
    if not variables:
        problemas.append("las fuentes no se definen con variables CSS (--font-…)")
    if problemas:
        return "fallida", "; ".join(problemas)
    return "aprobada", "Familias en el sitio: " + ", ".join(sorted(familias)[:6])
