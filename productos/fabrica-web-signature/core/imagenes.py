"""MOTOR DE IMÁGENES de FÁBRICA WEB SIGNATURE 2.0.

Claude (sin terminal) no puede descargar ni convertir imágenes. Por eso el reparto es:
  1. Claude escribe la dirección fotográfica y el plan: clients/<slug>/recursos/plan-imagenes.json
  2. Este módulo (Python, sin tokens) obtiene candidatos de fuentes permitidas, valida los archivos,
     los optimiza a WebP con Chrome, registra licencias y arma una hoja de contactos que Claude mira.
  3. Claude elige y usa las imágenes en el sitio; lo no usado sale de sitio/ al final.

Fuentes, en orden de prioridad:
  cliente    recursos/originales/ o recursos/entrantes/<id>.* (material del cliente, autorizado)
  ia-manual  procedimiento asistido: Diego genera la imagen en Hostinger AI Builder (u otro generador
             que él autorice), la descarga y la suelta en recursos/entrantes/<id>.* — se anota el gasto
             de créditos en recursos/creditos.json. Nunca se automatiza el panel de Hostinger.
  banco      Openverse (sin clave; licencias CC que permiten uso comercial) y, si Diego guarda sus
             claves gratuitas en negocio/claves-imagenes.env, Pexels y Unsplash.
  programada no se descarga nada: SVG/CSS/Canvas que construye Claude.

Seguridad: lo descargado se trata como datos no confiables (se comprueba la firma del archivo, el
tamaño y el tipo; nunca se ejecuta). No se usan servicios de pago ni se consumen créditos sin
autorización registrada en el brief.
"""
from __future__ import annotations

import html
import json
import os
import re
import shutil
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

import proyectos as P

AGENTE = "FabricaWebSignature/2.0 (sitios de clientes; contacto local)"
MAX_BYTES = 25 * 1024 * 1024
CANDIDATOS_POR_IMAGEN = 3
ANCHOS = (640, 1280, 1920)
PROPORCIONES = {"16:9": 16 / 9, "3:2": 1.5, "4:3": 4 / 3, "1:1": 1.0, "4:5": 0.8, "3:4": 0.75, "2:3": 2 / 3, "9:16": 9 / 16, "21:9": 21 / 9}
# Openverse: solo licencias que permiten uso comercial; preferimos las que no exigen atribución.
ORDEN_LICENCIA = {"cc0": 0, "pdm": 0, "by": 1, "by-sa": 2}
CLAVES = P.RAIZ / "negocio" / "claves-imagenes.env"
LADO_MINIMO = 900  # px reales del lado mayor: por debajo, la imagen se ve borrosa en pantallas actuales
# Filtro de seguridad: el filtro «mature» de los bancos no es suficiente (se encontró un caso real).
PROHIBIDAS = re.compile(r"(?i)(?<![a-z])(nude|naked|nudity|nsfw|sex|sexy|sexual|erotic\w*|porn\w*|lingerie|topless|desnud\w*|gore|blood|corpse|weapon|gun)(?![a-z])")


def contenido_prohibido(c: dict) -> bool:
    texto = " ".join(str(c.get(k, "")) for k in ("titulo", "url", "pagina", "etiquetas"))
    return bool(PROHIBIDAS.search(urllib.parse.unquote(texto).replace("_", " ").replace("-", " ")))


class ErrorImagenes(P.ErrorFabrica):
    pass


# ------------------------------------------------------------------ plan

PLANTILLA_PLAN = {
    "direccion_fotografica": {"estilo": "", "iluminacion": "", "encuadre": "", "paleta": "", "atmosfera": "", "realismo": "",
                              "consistencia": "", "evitar": ""},
    "imagenes": [{"id": "hero", "proposito": "", "donde": "index · primera pantalla", "proporcion": "16:9", "ancho_min": 1600,
                  "fuente": "banco", "busqueda": ["consulta en inglés para bancos"], "prompt_ia": "", "alt": "",
                  "ilustrativa": True}],
}


def ruta_plan(slug: str) -> Path:
    return P.ruta_cliente(slug) / "recursos" / "plan-imagenes.json"


def leer_plan(slug: str) -> dict:
    archivo = ruta_plan(slug)
    if not archivo.exists():
        raise ErrorImagenes("Este cliente aún no tiene recursos/plan-imagenes.json (lo escribe Claude en la dirección artística).")
    try:
        plan = json.loads(archivo.read_text(encoding="utf-8"))
    except ValueError as e:
        raise ErrorImagenes(f"plan-imagenes.json no es JSON válido: {e}")
    problemas = validar_plan(plan)
    if problemas:
        raise ErrorImagenes("Plan de imágenes con problemas: " + "; ".join(problemas))
    return plan


def validar_plan(plan: dict) -> list[str]:
    problemas = []
    imgs = plan.get("imagenes")
    if not isinstance(imgs, list) or not imgs:
        return ["falta la lista «imagenes»"]
    if len(imgs) > 24:
        problemas.append("más de 24 imágenes: reduce el plan a las que tienen propósito")
    vistos = set()
    for i, im in enumerate(imgs):
        ident = str(im.get("id", ""))
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,40}", ident):
            problemas.append(f"imagen {i + 1}: id «{ident}» debe ser minúsculas, números y guiones")
        if ident in vistos:
            problemas.append(f"id repetido: {ident}")
        vistos.add(ident)
        if im.get("fuente") not in ("cliente", "banco", "ia-manual", "programada"):
            problemas.append(f"{ident}: fuente debe ser cliente, banco, ia-manual o programada")
        if im.get("fuente") == "banco" and not im.get("busqueda"):
            problemas.append(f"{ident}: falta «busqueda» para el banco de imágenes")
        if im.get("fuente") == "ia-manual" and not im.get("prompt_ia"):
            problemas.append(f"{ident}: falta «prompt_ia»")
        if im.get("proporcion") and im["proporcion"] not in PROPORCIONES:
            problemas.append(f"{ident}: proporción no reconocida ({', '.join(PROPORCIONES)})")
    return problemas


# ------------------------------------------------------------------ validación de archivos

FIRMAS = [(b"\xff\xd8\xff", ".jpg"), (b"\x89PNG\r\n\x1a\n", ".png"), (b"RIFF", ".webp"), (b"GIF8", ".gif")]


def tipo_real(datos: bytes) -> str | None:
    for firma, ext in FIRMAS:
        if datos.startswith(firma):
            if ext == ".webp" and datos[8:12] != b"WEBP":
                return None
            return ext
    if datos[4:12] in (b"ftypavif", b"ftypavis"):
        return ".avif"
    return None


def _descargar(url: str, cabeceras: dict | None = None) -> bytes:
    if not url.lower().startswith("https://"):
        raise ErrorImagenes("Solo se descargan imágenes por https.")
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE, **(cabeceras or {})})
    with urllib.request.urlopen(req, timeout=60) as r:
        datos = r.read(MAX_BYTES + 1)
    if len(datos) > MAX_BYTES:
        raise ErrorImagenes("Imagen demasiado grande (> 25 MB).")
    return datos


def _json(url: str, cabeceras: dict | None = None) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE, "Accept": "application/json", **(cabeceras or {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read(5_000_000))


def claves() -> dict:
    """Claves gratuitas opcionales de bancos (las guarda Diego; nunca las lee Claude)."""
    datos = {}
    for k in ("PEXELS_API_KEY", "UNSPLASH_ACCESS_KEY"):
        if os.environ.get(k):
            datos[k] = os.environ[k]
    if CLAVES.exists():
        for linea in CLAVES.read_text(encoding="utf-8").splitlines():
            if "=" in linea and not linea.strip().startswith("#"):
                k, v = linea.split("=", 1)
                datos.setdefault(k.strip(), v.strip())
    return datos


# ------------------------------------------------------------------ proveedores de banco

def _orientacion(proporcion: str) -> str:
    r = PROPORCIONES.get(proporcion, 1.5)
    return "wide" if r > 1.15 else ("tall" if r < 0.87 else "square")


def buscar_openverse(consulta: str, proporcion: str, ancho_min: int, n: int = 8) -> list[dict]:
    resultados = []
    # primero colecciones de fotografía de calidad (CC0); después imágenes grandes de cualquier fuente
    for extra in ({"source": "stocksnap,rawpixel,wordpress,nappy"}, {"size": "large"}):
        q = urllib.parse.urlencode({"q": consulta, "license_type": "commercial", "page_size": 20,
                                    "aspect_ratio": _orientacion(proporcion), "mature": "false", **extra})
        resultados += _json("https://api.openverse.org/v1/images/?" + q).get("results", [])
        if len(resultados) >= 12:
            break
    minimo = min(ancho_min, 1200)  # por debajo de 1200 px no sirve ni para una sección
    salida = []
    for x in resultados:
        if (x.get("width") or 0) < minimo or x.get("license") not in ORDEN_LICENCIA:
            continue
        salida.append({"proveedor": "openverse/" + str(x.get("provider", "")), "url": x["url"], "pagina": x.get("foreign_landing_url", ""),
                       "autor": x.get("creator") or "desconocido", "licencia": f"CC {x['license'].upper()} {x.get('license_version') or ''}".strip(),
                       "licencia_url": x.get("license_url", ""), "atribucion": x.get("attribution", ""), "titulo": x.get("title", ""),
                       "ancho": x.get("width"), "alto": x.get("height"), "requiere_atribucion": x["license"] not in ("cc0", "pdm"),
                       "etiquetas": " ".join(str(t.get("name", "")) for t in (x.get("tags") or [])[:30])})
    vistos, unicos = set(), []
    for c in salida:
        if c["url"] not in vistos:
            vistos.add(c["url"])
            unicos.append(c)
    salida = unicos
    salida.sort(key=lambda c: ((c["ancho"] or 0) < ancho_min, ORDEN_LICENCIA.get(c["licencia"].split()[1].lower(), 3), -(c["ancho"] or 0)))
    return salida[:n]


def buscar_pexels(consulta: str, proporcion: str, ancho_min: int, clave: str, n: int = 8) -> list[dict]:
    ori = {"wide": "landscape", "tall": "portrait", "square": "square"}[_orientacion(proporcion)]
    d = _json("https://api.pexels.com/v1/search?" + urllib.parse.urlencode({"query": consulta, "orientation": ori, "per_page": 15}),
              {"Authorization": clave})
    return [{"proveedor": "pexels", "url": x["src"]["original"], "pagina": x.get("url", ""), "autor": x.get("photographer", ""),
             "licencia": "Licencia Pexels (uso comercial gratuito, sin atribución obligatoria)", "licencia_url": "https://www.pexels.com/license/",
             "atribucion": f"Foto de {x.get('photographer', '')} en Pexels", "titulo": x.get("alt", ""), "ancho": x.get("width"), "alto": x.get("height"),
             "requiere_atribucion": False} for x in d.get("photos", []) if (x.get("width") or 0) >= ancho_min][:n]


def buscar_unsplash(consulta: str, proporcion: str, ancho_min: int, clave: str, n: int = 8) -> list[dict]:
    ori = {"wide": "landscape", "tall": "portrait", "square": "squarish"}[_orientacion(proporcion)]
    d = _json("https://api.unsplash.com/search/photos?" + urllib.parse.urlencode({"query": consulta, "orientation": ori, "per_page": 15}),
              {"Authorization": f"Client-ID {clave}"})
    return [{"proveedor": "unsplash", "url": x["urls"]["raw"] + "&w=2400&fm=jpg&q=85", "pagina": x["links"]["html"],
             "autor": x["user"]["name"], "licencia": "Licencia Unsplash (uso comercial gratuito)", "licencia_url": "https://unsplash.com/license",
             "atribucion": f"Foto de {x['user']['name']} en Unsplash", "titulo": x.get("alt_description") or "", "ancho": x.get("width"),
             "alto": x.get("height"), "requiere_atribucion": False, "aviso_descarga": x["links"].get("download_location", "")}
            for x in d.get("results", []) if (x.get("width") or 0) >= ancho_min][:n]


def buscar_banco(im: dict) -> tuple[list[dict], list[str]]:
    k = claves()
    candidatos, notas = [], []
    for consulta in im.get("busqueda", [])[:3]:
        for nombre, fn in (("pexels", lambda q: buscar_pexels(q, im.get("proporcion", "3:2"), im.get("ancho_min", 1200), k["PEXELS_API_KEY"]) if "PEXELS_API_KEY" in k else []),
                           ("unsplash", lambda q: buscar_unsplash(q, im.get("proporcion", "3:2"), im.get("ancho_min", 1200), k["UNSPLASH_ACCESS_KEY"]) if "UNSPLASH_ACCESS_KEY" in k else []),
                           ("openverse", lambda q: buscar_openverse(q, im.get("proporcion", "3:2"), im.get("ancho_min", 1200)))):
            try:
                encontrados = fn(consulta)
            except Exception as e:  # red, cuota o respuesta inesperada: se anota y se sigue
                notas.append(f"{nombre} «{consulta}»: {str(e)[:120]}")
                continue
            for c in encontrados:
                if contenido_prohibido(c):
                    notas.append(f"descartada por el filtro de seguridad: {c.get('titulo', '')[:60]}")
                    continue
                if all(c["url"] != x["url"] for x in candidatos):
                    c["consulta"] = consulta
                    candidatos.append(c)
        if len(candidatos) >= CANDIDATOS_POR_IMAGEN * 2:
            break
    return candidatos, notas


# ------------------------------------------------------------------ obtención

def _entrante(carpeta: Path, ident: str) -> Path | None:
    for sub in ("entrantes", "originales"):
        for p in sorted((carpeta / "recursos" / sub).glob(f"{ident}.*")):
            if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".avif"):
                return p
    return None


def _registro(carpeta: Path) -> dict:
    archivo = carpeta / "recursos" / "imagenes.json"
    if archivo.exists():
        try:
            return json.loads(archivo.read_text(encoding="utf-8"))
        except ValueError:
            pass
    return {"imagenes": {}}


def _guardar_registro(carpeta: Path, reg: dict):
    (carpeta / "recursos" / "imagenes.json").write_text(json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8")


def obtener(slug: str, solo: list[str] | None = None, red: bool = True) -> dict:
    """Obtiene y optimiza las imágenes del plan. Devuelve el registro (recursos/imagenes.json)."""
    import navegador as N
    carpeta = P.ruta_cliente(slug)
    plan = leer_plan(slug)
    reg = _registro(carpeta)
    brief = P.leer_brief(slug)
    destino_web = carpeta / "sitio" / "assets" / "img"
    originales = carpeta / "recursos" / "candidatos"
    a_convertir = []
    for im in plan["imagenes"]:
        ident = im["id"]
        if solo and ident not in solo:
            continue
        entrada = {"id": ident, "fuente": im["fuente"], "proposito": im.get("proposito", ""), "alt": im.get("alt", ""),
                   "ilustrativa": bool(im.get("ilustrativa", True)), "candidatos": [], "estado": "pendiente", "notas": []}
        if im["fuente"] == "programada":
            entrada["estado"] = "programada (la construye Claude en SVG/CSS/Canvas)"
        elif im["fuente"] in ("cliente", "ia-manual"):
            archivo = _entrante(carpeta, ident)
            if archivo:
                datos = archivo.read_bytes()[:16]
                if not tipo_real(datos + b"\0" * 16):
                    entrada.update(estado="rechazada", notas=["El archivo no es una imagen válida (firma desconocida)."])
                else:
                    origen = "material del cliente" if im["fuente"] == "cliente" else "generada con IA por Diego (procedimiento asistido)"
                    entrada["candidatos"].append({"letra": "a", "proveedor": im["fuente"], "original": str(archivo.relative_to(carpeta)).replace("\\", "/"),
                                                  "licencia": origen, "autor": "cliente" if im["fuente"] == "cliente" else "IA", "requiere_atribucion": False})
                    a_convertir.append((archivo, destino_web / ident, entrada, 0))
                    entrada["estado"] = "lista"
            else:
                entrada["estado"] = ("esperando archivo del cliente en recursos/entrantes/" if im["fuente"] == "cliente"
                                     else "esperando imagen generada (ver recursos/solicitud-ia.md)")
        elif im["fuente"] == "banco":
            if not red:
                entrada["estado"] = "sin red: no se buscó"
            else:
                candidatos, notas = buscar_banco(im)
                entrada["notas"] += notas
                letra = iter("abcdefgh")
                for c in candidatos:
                    if len(entrada["candidatos"]) >= CANDIDATOS_POR_IMAGEN:
                        break
                    try:
                        datos = _descargar(c["url"])
                    except Exception as e:
                        entrada["notas"].append(f"descarga fallida ({c['proveedor']}): {str(e)[:100]}")
                        continue
                    ext = tipo_real(datos)
                    if not ext or ext == ".gif":
                        entrada["notas"].append(f"descartada: no es JPEG/PNG/WebP ({c['url'][:60]})")
                        continue
                    l = next(letra)
                    archivo = originales / ident / f"{l}{ext}"
                    archivo.parent.mkdir(parents=True, exist_ok=True)
                    archivo.write_bytes(datos)
                    if c.get("aviso_descarga") and "UNSPLASH_ACCESS_KEY" in claves():
                        try:  # requisito de la API de Unsplash: avisar de la descarga
                            _json(c["aviso_descarga"], {"Authorization": f"Client-ID {claves()['UNSPLASH_ACCESS_KEY']}"})
                        except Exception:
                            pass
                    c = {**c, "letra": l, "original": str(archivo.relative_to(carpeta)).replace("\\", "/")}
                    entrada["candidatos"].append(c)
                    nombre = ident if l == "a" else f"{ident}-{l}"
                    a_convertir.append((archivo, destino_web / nombre, entrada, len(entrada["candidatos"]) - 1))
                    time.sleep(0.3)  # cortesía con los servidores
                entrada["estado"] = "lista" if entrada["candidatos"] else "sin candidatos válidos"
        reg["imagenes"][ident] = entrada
    _convertir(carpeta, a_convertir)
    reg["actualizado"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    reg["demo"] = brief.get("estado_negocio") == "demostrativo"
    _guardar_registro(carpeta, reg)
    escribir_licencias(slug, reg)
    escribir_solicitud_ia(slug, plan)
    hoja_contactos(slug, reg)
    P.registrar_historial(slug, "Imágenes: " + ", ".join(f"{k}={v['estado']}" for k, v in reg["imagenes"].items()))
    return reg



def _convertir(carpeta: Path, a_convertir: list) -> None:
    """Optimiza a WebP con Chrome y anota en cada candidato sus archivos web; descarta los de baja resolución."""
    import navegador as N
    if not a_convertir:
        return
    convertidas = N.convertir_webp([(a, b) for a, b, _, _ in a_convertir], ANCHOS)
    for (origen, prefijo, entrada, i), res in zip(a_convertir, convertidas):
        cand = entrada["candidatos"][i]
        if res.get("error"):
            cand["error"] = res["error"]
            continue
        if max(res["original"]) < LADO_MINIMO:
            for c in res["creados"]:
                c["archivo"].unlink(missing_ok=True)
            cand["descartada"] = f"baja resolución real ({res['original'][0]}×{res['original'][1]} px)"
            continue
        rel = [str(c["archivo"].relative_to(carpeta / "sitio")).replace("\\", "/") for c in res["creados"]]
        cand["web"] = rel
        cand["kb"] = [c["kb"] for c in res["creados"]]
        cand["medidas_original"] = res["original"]
        cand["anchos"] = [c["ancho"] for c in res["creados"]]
        cand["srcset"] = ", ".join(f"{w} {c['ancho']}w" for w, c in zip(rel, res["creados"]))


def reconvertir(slug: str) -> dict:
    """Vuelve a optimizar los originales ya descargados (sin descargar de nuevo)."""
    carpeta = P.ruta_cliente(slug)
    reg = _registro(carpeta)
    destino = carpeta / "sitio" / "assets" / "img"
    trabajos = []
    for ident, e in reg.get("imagenes", {}).items():
        for i, c in enumerate(e.get("candidatos", [])):
            if not c.get("original") or not (carpeta / c["original"]).exists():
                continue
            for w in c.get("web", []):
                (carpeta / "sitio" / w).unlink(missing_ok=True)
            c.pop("descartada", None)
            nombre = ident if c.get("letra", "a") == "a" else f"{ident}-{c['letra']}"
            trabajos.append((carpeta / c["original"], destino / nombre, e, i))
    _convertir(carpeta, trabajos)
    _guardar_registro(carpeta, reg)
    escribir_licencias(slug, reg)
    hoja_contactos(slug, reg)
    return reg

# ------------------------------------------------------------------ licencias, créditos, IA asistida

def escribir_licencias(slug: str, reg: dict):
    carpeta = P.ruta_cliente(slug)
    archivo = carpeta / "recursos" / "licencias-imagenes.md"
    l = ["# Imágenes obtenidas por el motor", "",
         "Generado por `core/imagenes.py`. Cada candidato conserva su origen y licencia. Solo se publican las usadas en el sitio.", "",
         "| Imagen | Opción | Archivo web | Proveedor | Autor | Licencia | Página de origen |", "|---|---|---|---|---|---|---|"]
    for ident, e in reg["imagenes"].items():
        for c in e["candidatos"]:
            web = (c.get("web") or ["—"])[-1]
            l.append(f"| {ident} | {c.get('letra', 'a')} | `{web}` | {c.get('proveedor', '')} | {c.get('autor', '')} | {c.get('licencia', '')} | {c.get('pagina', '') or '—'} |")
    l += ["", "Las imágenes de banco **no son del negocio**: en demos o cuando muestran personas o instalaciones, el sitio las rotula como ilustrativas."]
    archivo.write_text("\n".join(l) + "\n", encoding="utf-8")


def escribir_solicitud_ia(slug: str, plan: dict):
    """Hoja para el procedimiento asistido con Hostinger AI Builder (u otro generador que Diego autorice)."""
    carpeta = P.ruta_cliente(slug)
    pedidas = [im for im in plan["imagenes"] if im["fuente"] == "ia-manual"]
    archivo = carpeta / "recursos" / "solicitud-ia.md"
    if not pedidas:
        archivo.unlink(missing_ok=True)
        return
    d = plan.get("direccion_fotografica", {})
    l = [f"# Imágenes para generar con IA · {slug}", "",
         "**Requiere tu autorización: cada imagen puede gastar créditos.** Nada se genera solo.", "",
         "## Cómo hacerlo con Hostinger AI Builder (sin crear ni publicar un sitio)",
         "1. Entra a hPanel y abre el editor del constructor de un sitio de pruebas que ya tengas (no completes el asistente de un sitio nuevo: ocuparía un cupo).",
         "2. Selecciona cualquier elemento de imagen → ajustes → «Generar imagen con IA».",
         "3. Pega la instrucción de abajo. Genera solo una vez; si no sirve, anota por qué antes de repetir.",
         "4. La imagen queda en la biblioteca de medios: descárgala.",
         f"5. Guárdala como `clients/{slug}/recursos/entrantes/<id>.jpg` (o .png/.webp) con el id indicado.",
         "6. En Signature Studio pulsa «Importar imágenes» (o `python core/fabrica.py imagenes obtener " + slug + "`).",
         "7. Anota los créditos gastados: `python core/fabrica.py imagenes credito " + slug + " <id> <créditos>`.", "",
         "## Dirección fotográfica común (para que todas parezcan de la misma campaña)"]
    l += [f"- {k.replace('_', ' ').capitalize()}: {v}" for k, v in d.items() if v]
    for im in pedidas:
        l += ["", f"## `{im['id']}` — {im.get('proposito', '')}", f"Proporción {im.get('proporcion', '3:2')} · dónde: {im.get('donde', '')}", "", "```", im["prompt_ia"], "```"]
    l += ["", "Nunca generes fotos de personas presentadas como empleados o pacientes reales del negocio, ni de instalaciones que no existen presentadas como propias."]
    archivo.write_text("\n".join(l) + "\n", encoding="utf-8")


def registrar_credito(slug: str, ident: str, creditos: float, proveedor: str = "Hostinger AI Builder") -> dict:
    carpeta = P.ruta_cliente(slug)
    archivo = carpeta / "recursos" / "creditos.json"
    datos = json.loads(archivo.read_text(encoding="utf-8")) if archivo.exists() else {"movimientos": [], "total": 0}
    datos["movimientos"].append({"fecha": datetime.now().strftime("%Y-%m-%d %H:%M"), "imagen": ident, "creditos": creditos, "proveedor": proveedor})
    datos["total"] = round(sum(m["creditos"] for m in datos["movimientos"]), 2)
    archivo.parent.mkdir(parents=True, exist_ok=True)
    archivo.write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")
    P.registrar_historial(slug, f"Créditos de IA: {creditos} por «{ident}» ({proveedor}). Total: {datos['total']}.")
    return datos


def hoja_contactos(slug: str, reg: dict) -> Path | None:
    """Página HTML con todos los candidatos y su captura PNG, para que Claude elija mirando."""
    import navegador as N
    carpeta = P.ruta_cliente(slug)
    filas = []
    for ident, e in reg["imagenes"].items():
        celdas = []
        for c in e["candidatos"]:
            if not c.get("web"):
                continue
            src = "../sitio/" + c["web"][0]
            celdas.append(f"<figure><img src='{html.escape(src)}' alt=''><figcaption><b>{ident}{'' if c.get('letra', 'a') == 'a' else '-' + c['letra']}</b> · "
                          f"{html.escape(c.get('proveedor', ''))} · {html.escape(c.get('licencia', ''))}</figcaption></figure>")
        if celdas:
            filas.append(f"<section><h2>{html.escape(ident)} — {html.escape(e.get('proposito', ''))}</h2><div>{''.join(celdas)}</div></section>")
    if not filas:
        return None
    pagina = carpeta / "recursos" / "hoja-contactos.html"
    pagina.write_text("<!doctype html><meta charset='utf-8'><title>Hoja de contactos</title><style>body{font:14px system-ui;margin:24px;background:#eee}"
                      "section{margin-bottom:28px}div{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0;background:#fff;padding:8px}"
                      "img{width:100%;height:260px;object-fit:cover;display:block}figcaption{padding-top:6px}</style>" + "".join(filas), encoding="utf-8")
    try:
        # la hoja vive en recursos/ y referencia ../sitio: se sirve la carpeta del cliente completa
        destino = carpeta / "recursos" / "hoja-contactos.png"
        with N.Sesion(carpeta) as s:
            s.tamano(1400, 900, movil=False)
            s.abrir("recursos/hoja-contactos.html", espera=2.0)
            s.capturar(destino, completa=True, max_alto=14000)
        return destino
    except P.ErrorFabrica:
        return None


# ------------------------------------------------------------------ después de construir

def podar(slug: str) -> dict:
    """Saca de sitio/assets/img las variantes del motor que el sitio no usa (no borra: mueve a recursos/no-usadas)."""
    carpeta = P.ruta_cliente(slug)
    sitio = carpeta / "sitio"
    reg = _registro(carpeta)
    texto = "".join(p.read_text(encoding="utf-8", errors="replace") for p in sitio.rglob("*") if p.suffix in (".html", ".css", ".js"))
    movidas, usadas = [], []
    for ident, e in reg.get("imagenes", {}).items():
        for c in e.get("candidatos", []):
            usado = any(Path(w).name in texto for w in c.get("web", []))
            c["usada"] = usado
            if usado:
                usadas.append(f"{ident}-{c.get('letra', 'a')}")
                continue
            for w in c.get("web", []):
                origen = sitio / w
                if origen.exists():
                    destino = carpeta / "recursos" / "no-usadas" / origen.name
                    destino.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(origen), str(destino))
                    movidas.append(origen.name)
    _guardar_registro(carpeta, reg)
    escribir_creditos_sitio(slug, reg)
    return {"usadas": usadas, "movidas": movidas}


def escribir_creditos_sitio(slug: str, reg: dict):
    """Créditos de imágenes con atribución obligatoria → sitio/creditos.html (solo si hace falta)."""
    carpeta = P.ruta_cliente(slug)
    con_atribucion = [(i, c) for i, e in reg.get("imagenes", {}).items() for c in e.get("candidatos", [])
                      if c.get("usada") and c.get("proveedor") not in ("cliente", "ia-manual")]
    archivo = carpeta / "sitio" / "creditos.html"
    if not con_atribucion:
        return
    items = "".join(f"<li>{html.escape(c.get('titulo') or i)} — {html.escape(c.get('autor', ''))}, "
                    f"<a href='{html.escape(c.get('licencia_url', ''))}' rel='license noopener'>{html.escape(c.get('licencia', ''))}</a>"
                    f"{' · <a href=' + chr(39) + html.escape(c.get('pagina', '')) + chr(39) + ' rel=noopener>origen</a>' if c.get('pagina') else ''}</li>"
                    for i, c in con_atribucion)
    archivo.write_text("<!doctype html><html lang='es'><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>"
                       "<meta name='robots' content='noindex'><title>Créditos de imágenes</title>"
                       "<meta name='description' content='Origen y licencia de las fotografías usadas en este sitio.'>"
                       "<body style='font:16px/1.6 system-ui;max-width:760px;margin:48px auto;padding:0 20px'>"
                       "<h1>Créditos de imágenes</h1><p>Fotografías de bancos con licencia de uso comercial. Son ilustrativas: no muestran el negocio, su personal ni sus instalaciones.</p>"
                       f"<ul>{items}</ul><p><a href='index.html'>Volver al inicio</a></p></body></html>", encoding="utf-8")


def resumen_para_claude(slug: str) -> str:
    """Texto breve para la orden de construcción: qué imágenes hay y cómo usarlas."""
    carpeta = P.ruta_cliente(slug)
    reg = _registro(carpeta)
    if not reg.get("imagenes"):
        return "No hay imágenes obtenidas por el motor."
    l = []
    for ident, e in reg["imagenes"].items():
        opciones = [f"{c.get('letra', 'a')}: srcset=\"{c['srcset']}\" ({c.get('licencia', '')})" for c in e["candidatos"] if c.get("srcset")]
        l.append(f"- `{ident}` [{e['estado']}] {e.get('proposito', '')} · alt sugerido: «{e.get('alt', '')}»" + ("" if not opciones else "\n    " + "\n    ".join(opciones)))
    return "\n".join(l)
