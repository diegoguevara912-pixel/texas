"""Detector de similitud creativa entre proyectos (regla anti-genérico).

Compara diseno/identidad.json de un proyecto con el de todos los demás.
El formato de identidad.json está en templates/proyecto/identidad.ejemplo.json.
Puntuación 0-100: ≥70 coincidencia excesiva, ≥50 revisar, <50 diferenciado.
"""
from __future__ import annotations

import json
from difflib import SequenceMatcher

from proyectos import ErrorFabrica, carpeta_clientes, registrar_historial, ruta_cliente

UMBRAL_EXCESIVO = 70
UMBRAL_REVISAR = 50

PESOS = {"paleta": 25, "tipografias": 20, "composicion": 15, "hero": 15, "secciones": 15, "animaciones": 5, "concepto": 5}


def _hex_a_rgb(h: str):
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    try:
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return None


def _distancia(c1, c2) -> float:
    # Distancia "redmean": aproximación perceptual barata.
    r = (c1[0] + c2[0]) / 2
    dr, dg, db = c1[0] - c2[0], c1[1] - c2[1], c1[2] - c2[2]
    return ((2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db) ** 0.5


def similitud_paleta(a: dict, b: dict) -> float:
    ca = [c for c in (_hex_a_rgb(v) for v in a.values()) if c]
    cb = [c for c in (_hex_a_rgb(v) for v in b.values()) if c]
    if not ca or not cb:
        return 0.0
    # Por cada color de A, ¿hay uno casi igual en B? (umbral ~ diferencia apenas visible)
    cerca = sum(1 for x in ca if min(_distancia(x, y) for y in cb) < 60)
    return cerca / len(ca)


def _jaccard(a, b) -> float:
    a = {str(x).strip().lower() for x in a or []}
    b = {str(x).strip().lower() for x in b or []}
    return len(a & b) / len(a | b) if a | b else 0.0


def _igual(a, b) -> float:
    return 1.0 if a and b and str(a).strip().lower() == str(b).strip().lower() else 0.0


def comparar(a: dict, b: dict) -> dict:
    partes = {
        "paleta": similitud_paleta(a.get("paleta", {}), b.get("paleta", {})),
        "tipografias": _jaccard(a.get("tipografias"), b.get("tipografias")),
        "composicion": _igual(a.get("composicion"), b.get("composicion")),
        "hero": _igual(a.get("hero_tipo"), b.get("hero_tipo")),
        "secciones": SequenceMatcher(None, [s.lower() for s in a.get("secciones", [])], [s.lower() for s in b.get("secciones", [])]).ratio(),
        "animaciones": _jaccard(a.get("animaciones"), b.get("animaciones")),
        "concepto": _jaccard(a.get("palabras_clave"), b.get("palabras_clave")),
    }
    total = sum(PESOS[k] * v for k, v in partes.items())
    return {"puntuacion": round(total), "detalle": {k: round(v, 2) for k, v in partes.items()}}


def leer_identidad(slug: str) -> dict | None:
    archivo = ruta_cliente(slug) / "diseno" / "identidad.json"
    return json.loads(archivo.read_text(encoding="utf-8")) if archivo.exists() else None


def analizar(slug: str) -> dict:
    propia = leer_identidad(slug)
    if not propia:
        raise ErrorFabrica(f"'{slug}' aún no tiene diseno/identidad.json (se crea en la etapa D).")
    comparaciones = []
    for carpeta in sorted(carpeta_clientes().iterdir()):
        if carpeta.name == slug or not (carpeta / "diseno" / "identidad.json").exists():
            continue
        otra = json.loads((carpeta / "diseno" / "identidad.json").read_text(encoding="utf-8"))
        c = comparar(propia, otra)
        c["con"] = carpeta.name
        c["nivel"] = "EXCESIVA" if c["puntuacion"] >= UMBRAL_EXCESIVO else ("REVISAR" if c["puntuacion"] >= UMBRAL_REVISAR else "diferenciado")
        comparaciones.append(c)
    comparaciones.sort(key=lambda x: -x["puntuacion"])
    peor = comparaciones[0]["nivel"] if comparaciones else "sin proyectos anteriores"
    resultado = {"slug": slug, "comparaciones": comparaciones, "veredicto": peor}
    destino = ruta_cliente(slug) / "diseno" / "similitud.json"
    destino.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    registrar_historial(slug, f"Similitud creativa: {peor}.")
    return resultado
