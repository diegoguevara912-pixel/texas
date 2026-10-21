"""Control de calidad automático de un sitio de cliente.

Cada comprobación termina en uno de tres estados, sin maquillaje:
  aprobada · fallida (crítica o advertencia) · no_ejecutada (con el motivo).
Los resultados se guardan en clients/<slug>/qa/.
"""
from __future__ import annotations

import json
import re
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

import tipografia as T
from proyectos import ErrorFabrica, leer_estado, registrar_historial, ruta_cliente

LIMITE_IMAGEN_KB = 400
LIMITE_PAGINA_KB = 1500  # HTML+CSS+JS propios, sin imágenes

PATRONES_SECRETOS = [
    (r"sk_live_[0-9a-zA-Z]{10,}", "clave secreta de Stripe"),
    (r"AKIA[0-9A-Z]{16}", "clave de AWS"),
    (r"AIza[0-9A-Za-z\-_]{35}", "clave de Google API"),
    (r"(?i)(api[_-]?key|secret|password|passwd|contraseña|token)\s*[:=]\s*['\"][^'\"\s]{6,}['\"]", "posible credencial escrita en el código"),
    (r"-----BEGIN (RSA |EC )?PRIVATE KEY-----", "clave privada"),
]
RUTAS_LOCALES = re.compile(r"(file:///|[A-Za-z]:\\\\|[A-Za-z]:\\|/Users/|/home/[a-z])")


class Analizador(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lang = None
        self.title = ""
        self._en_title = False
        self.metas = {}
        self.links_rel = {}
        self.h1 = 0
        self.imgs_sin_alt = []
        self.refs = []          # (atributo, valor)
        self.inputs = []        # (id, name, aria-label, type)
        self.labels_for = set()
        self.label_abierta = 0
        self.inputs_en_label = set()
        self.scripts_externos = []
        self.anclas_wa = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        elif tag == "title":
            self._en_title = True
        elif tag == "meta":
            clave = a.get("name") or a.get("property")
            if clave:
                self.metas[clave.lower()] = a.get("content", "")
        elif tag == "link":
            rel = (a.get("rel") or "").lower()
            self.links_rel[rel] = a.get("href", "")
            if a.get("href"):
                self.refs.append(("href", a["href"]))
        elif tag == "h1":
            self.h1 += 1
        elif tag == "img":
            if "alt" not in a:
                self.imgs_sin_alt.append(a.get("src", "?"))
        elif tag == "label":
            self.label_abierta += 1
            if a.get("for"):
                self.labels_for.add(a["for"])
        elif tag in ("input", "textarea", "select"):
            tipo = a.get("type", "text")
            if tipo not in ("hidden", "submit", "button") and a.get("aria-hidden") != "true":
                ident = a.get("id") or f"(sin id, name={a.get('name')})"
                self.inputs.append((ident, a.get("aria-label") or a.get("aria-labelledby")))
                if self.label_abierta:
                    self.inputs_en_label.add(ident)
        if tag == "script" and a.get("src"):
            if a["src"].startswith(("http://", "https://", "//")):
                self.scripts_externos.append(a["src"])
        for attr in ("src", "href", "srcset", "poster"):
            if tag == "link" and attr == "href":
                continue
            if a.get(attr):
                valor = a[attr]
                if attr == "srcset":
                    for parte in valor.split(","):
                        if parte.strip():
                            self.refs.append(("srcset", parte.strip().split()[0]))
                else:
                    self.refs.append((attr, valor))
        if tag == "a" and "wa.me" in (a.get("href") or ""):
            self.anclas_wa.append(a["href"])

    def handle_endtag(self, tag):
        if tag == "title":
            self._en_title = False
        elif tag == "label":
            self.label_abierta = max(0, self.label_abierta - 1)

    def handle_data(self, data):
        if self._en_title:
            self.title += data


def _r(id_, nombre, estado, detalle="", severidad="critica"):
    return {"id": id_, "prueba": nombre, "estado": estado, "severidad": severidad if estado == "fallida" else "", "detalle": detalle}


def ejecutar_qa(slug: str, guardar: bool = True) -> dict:
    carpeta = ruta_cliente(slug)
    estado = leer_estado(slug)
    sitio = carpeta / "sitio"
    resultados = []
    if not (sitio / "index.html").exists():
        resultados.append(_r("existe", "El sitio tiene index.html", "fallida", "Todavía no hay sitio construido en sitio/."))
        return _cerrar(slug, carpeta, resultados, guardar)
    resultados.append(_r("existe", "El sitio tiene index.html", "aprobada"))

    htmls = sorted(p for p in sitio.rglob("*.html") if "respaldos" not in p.parts)
    textos = {p: p.read_text(encoding="utf-8", errors="replace") for p in htmls}
    analisis = {}
    for p, t in textos.items():
        an = Analizador()
        an.feed(t)
        analisis[p] = an
    rel = lambda p: str(p.relative_to(sitio)).replace("\\", "/")

    # Estructura y SEO por página
    def por_pagina(id_, nombre, falla, severidad="critica"):
        malas = [f"{rel(p)}: {m}" for p, an in analisis.items() for m in [falla(p, an)] if m]
        resultados.append(_r(id_, nombre, "fallida" if malas else "aprobada", "; ".join(malas[:12]), severidad))

    por_pagina("lang", "Idioma declarado (<html lang>)", lambda p, a: None if a.lang else "falta lang")
    por_pagina("title", "Título único por página", lambda p, a: None if a.title.strip() else "sin <title>")
    titulos = [a.title.strip() for a in analisis.values() if a.title.strip()]
    if len(titulos) != len(set(titulos)):
        resultados.append(_r("title_unico", "Títulos sin repetir entre páginas", "fallida", "Hay páginas con el mismo <title>", "advertencia"))
    por_pagina("description", "Meta descripción", lambda p, a: None if a.metas.get("description") or p.name == "404.html" else "sin meta description", "advertencia")
    por_pagina("viewport", "Meta viewport (móvil)", lambda p, a: None if "viewport" in a.metas else "sin viewport")
    por_pagina("h1", "Exactamente un h1 por página", lambda p, a: None if a.h1 == 1 else f"{a.h1} h1", "advertencia")
    por_pagina("alt", "Imágenes con texto alternativo", lambda p, a: None if not a.imgs_sin_alt else f"sin alt: {', '.join(a.imgs_sin_alt[:4])}")

    def etiquetas(p, a):
        sin = [i for i, aria in a.inputs if not aria and i not in a.labels_for and i not in a.inputs_en_label]
        return f"campos sin etiqueta: {', '.join(sin[:5])}" if sin else None
    por_pagina("labels", "Campos de formulario con etiqueta", etiquetas)

    # Enlaces y recursos internos
    rotos = []
    for p, an in analisis.items():
        for attr, valor in an.refs:
            v = valor.strip()
            if not v or v.startswith(("#", "mailto:", "tel:", "data:", "javascript:", "http://", "https://", "//", "{")):
                continue
            ruta = unquote(urlparse(v).path)
            if not ruta:
                continue
            objetivo = (sitio / ruta.lstrip("/")) if ruta.startswith("/") else (p.parent / ruta)
            if objetivo.is_dir():
                objetivo = objetivo / "index.html"
            if not objetivo.exists():
                rotos.append(f"{rel(p)} → {v}")
    resultados.append(_r("enlaces", "Enlaces y recursos internos existen", "fallida" if rotos else "aprobada", "; ".join(rotos[:15])))

    # Archivos de texto del sitio (html, css, js, json)
    archivos_texto = [p for p in sitio.rglob("*") if p.is_file() and p.suffix.lower() in (".html", ".css", ".js", ".json", ".xml", ".txt", ".php", ".htaccess", "") and "respaldos" not in p.parts]
    contenido = {p: p.read_text(encoding="utf-8", errors="replace") for p in archivos_texto}

    locales = [rel(p) for p, t in contenido.items() if RUTAS_LOCALES.search(t)]
    resultados.append(_r("rutas_locales", "Sin rutas del equipo local", "fallida" if locales else "aprobada", ", ".join(locales[:10])))

    secretos = []
    for p, t in contenido.items():
        for patron, desc in PATRONES_SECRETOS:
            if re.search(patron, t):
                secretos.append(f"{rel(p)}: {desc}")
    resultados.append(_r("secretos", "Sin claves ni contraseñas en el sitio", "fallida" if secretos else "aprobada", "; ".join(secretos[:10])))

    pendientes = [f"{rel(p)} ({t.count('[PENDIENTE')})" for p, t in contenido.items() if "[PENDIENTE" in t]
    resultados.append(_r("pendientes", "Sin marcadores [PENDIENTE] (datos que faltan del cliente)", "fallida" if pendientes else "aprobada", ", ".join(pendientes), "advertencia"))

    css = "\n".join(t for p, t in contenido.items() if p.suffix == ".css") + "\n".join(textos.values())
    anima = re.search(r"(@keyframes|animation\s*:|transition\s*:)", css)
    if anima:
        ok = "prefers-reduced-motion" in css
        resultados.append(_r("movimiento", "Respeta movimiento reducido", "aprobada" if ok else "fallida", "" if ok else "Hay animaciones sin @media (prefers-reduced-motion)", "advertencia"))
    else:
        resultados.append(_r("movimiento", "Respeta movimiento reducido", "aprobada", "Sin animaciones CSS"))
    foco = ":focus-visible" in css or ":focus" in css
    resultados.append(_r("foco", "Estilos de foco de teclado", "aprobada" if foco else "fallida", "" if foco else "No hay estilos :focus/:focus-visible", "advertencia"))

    # Peso
    pesadas = [f"{rel(p)} ({p.stat().st_size // 1024} KB)" for p in sitio.rglob("*") if p.is_file() and p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif") and p.stat().st_size > LIMITE_IMAGEN_KB * 1024]
    resultados.append(_r("imagenes_peso", f"Imágenes de menos de {LIMITE_IMAGEN_KB} KB", "fallida" if pesadas else "aprobada", ", ".join(pesadas[:10]), "advertencia"))
    propio = sum(p.stat().st_size for p in sitio.rglob("*") if p.is_file() and p.suffix.lower() in (".html", ".css", ".js"))
    resultados.append(_r("codigo_peso", f"Código propio de menos de {LIMITE_PAGINA_KB} KB", "aprobada" if propio < LIMITE_PAGINA_KB * 1024 else "fallida", f"{propio // 1024} KB", "advertencia"))
    jpg_png = [rel(p) for p in sitio.rglob("*") if p.suffix.lower() in (".jpg", ".jpeg", ".png") and p.stat().st_size > 150 * 1024]
    if jpg_png:
        resultados.append(_r("formatos", "Imágenes grandes en formato moderno (WebP/AVIF)", "fallida", ", ".join(jpg_png[:8]), "advertencia"))

    # Scripts externos con versión fija
    sin_version = [s for an in analisis.values() for s in an.scripts_externos if not re.search(r"@\d|/\d+\.\d+", s)]
    resultados.append(_r("cdn_versiones", "Bibliotecas externas con versión fija", "fallida" if sin_version else "aprobada", ", ".join(sin_version[:5]), "advertencia"))

    # WhatsApp
    wa_malos = [h for an in analisis.values() for h in an.anclas_wa if not re.match(r"https://wa\.me/\d{8,15}(\?|$)", h)]
    resultados.append(_r("whatsapp", "Enlaces de WhatsApp con número válido", "fallida" if wa_malos else "aprobada", ", ".join(wa_malos[:5])))

    # SEO de sitio
    indice = analisis[sitio / "index.html"]
    faltan = [n for n, ok in [("robots.txt", (sitio / "robots.txt").exists()), ("sitemap.xml", (sitio / "sitemap.xml").exists() or estado.get("demo")),
                               ("canonical", "canonical" in indice.links_rel), ("og:title", "og:title" in indice.metas), ("404.html", (sitio / "404.html").exists())] if not ok]
    resultados.append(_r("seo_sitio", "SEO técnico del sitio (robots, sitemap, canonical, Open Graph, 404)", "fallida" if faltan else "aprobada", "Falta: " + ", ".join(faltan) if faltan else "", "advertencia"))

    # Privacidad: toda página que recoge datos enlaza su política de privacidad
    recoge = [rel(p) for p, an in analisis.items() if an.inputs]
    if recoge:
        enlaza = any(re.search(r'href=["\'][^"\']*privacidad', t, re.I) for t in textos.values())
        existe = any(p.name.lower().startswith("privacidad") for p in htmls)
        ok = enlaza and existe
        resultados.append(_r("privacidad", "Política de privacidad donde se recogen datos", "aprobada" if ok else "fallida",
                             "" if ok else f"Formularios en {', '.join(recoge[:4])}: falta privacidad.html enlazada (plantilla en biblioteca/politica-privacidad.md)",
                             "advertencia"))

    # Demos: nunca indexables
    if estado.get("demo"):
        robots_meta = all("noindex" in an.metas.get("robots", "") for an in analisis.values())
        robots_txt = (sitio / "robots.txt").exists() and "Disallow: /" in (sitio / "robots.txt").read_text(encoding="utf-8", errors="replace")
        ok = robots_meta and robots_txt
        resultados.append(_r("demo_noindex", "Sitio demostrativo marcado como no indexable", "aprobada" if ok else "fallida",
                             "" if ok else "Una demo necesita <meta name=robots content=noindex> en cada página y robots.txt con Disallow: /"))
        aviso = any(re.search(r"(?i)(demostraci[oó]n|demo|ejemplo)", t) for t in textos.values())
        resultados.append(_r("demo_aviso", "La demo avisa que usa datos de ejemplo", "aprobada" if aviso else "fallida", "" if aviso else "Añadir un aviso visible de datos de ejemplo"))

    # Tipografía del brief aplicada con variables (solo si el brief tiene una sección de tipografía usada)
    try:
        brief = json.loads((carpeta / "brief.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        brief = {}
    if T.pedidas(brief) or (sitio / "assets" / "css" / "tokens.css").exists():
        estado_t, detalle_t = T.comprobar_sitio(brief, sitio)
        resultados.append(_r("tipografia", "Tipografía del brief aplicada con variables CSS", estado_t, detalle_t, "advertencia"))

    # Pruebas de navegador: se usan solo si se hicieron después del último cambio del sitio.
    navegador = _resultados_navegador(carpeta, sitio)
    hechas = {r["id"] for r in navegador}
    resultados.extend(navegador)
    # Lo que no se pudo comprobar: se declara, no se inventa.
    for id_, nombre in [("navegador", "Revisión visual con capturas en 360/768/1280 px"),
                        ("consola", "Errores de JavaScript en consola"),
                        ("lighthouse", "Lighthouse / Core Web Vitals medidos"),
                        ("contraste", "Contraste de color medido (WCAG AA)")]:
        if id_ not in hechas:
            resultados.append(_r(id_, nombre, "no_ejecutada", "Requiere navegador: ejecuta 'fabrica navegador <cliente>' (o el motor lo hace solo) o Claude lo revisa con sus herramientas de navegador"))
    return _cerrar(slug, carpeta, resultados, guardar)


def _resultados_navegador(carpeta: Path, sitio: Path) -> list:
    archivo = carpeta / "qa" / "navegador.json"
    if not archivo.exists():
        return []
    try:
        datos = json.loads(archivo.read_text(encoding="utf-8"))
    except ValueError:
        return []
    ultimo_cambio = max((p.stat().st_mtime for p in sitio.rglob("*") if p.is_file()), default=0)
    if datos.get("marca_tiempo", 0) + 1 < ultimo_cambio:
        return []  # el sitio cambió después: hay que repetirlas
    return datos.get("resultados", [])


def _cerrar(slug, carpeta: Path, resultados: list, guardar: bool) -> dict:
    criticas = [r for r in resultados if r["estado"] == "fallida" and r["severidad"] == "critica"]
    advert = [r for r in resultados if r["estado"] == "fallida" and r["severidad"] == "advertencia"]
    resumen = {
        "slug": slug,
        "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "aprobadas": sum(r["estado"] == "aprobada" for r in resultados),
        "fallidas_criticas": len(criticas),
        "advertencias": len(advert),
        "no_ejecutadas": sum(r["estado"] == "no_ejecutada" for r in resultados),
        "veredicto": "NO APTO" if criticas else ("APTO CON AJUSTES" if advert else "APTO (pruebas automáticas)"),
        "resultados": resultados,
    }
    if guardar:
        qa = carpeta / "qa"
        qa.mkdir(exist_ok=True)
        marca = datetime.now().strftime("%Y%m%d-%H%M%S")
        (qa / f"qa-{marca}.json").write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")
        (qa / "ULTIMO.json").write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")
        (qa / "ULTIMO.md").write_text(qa_a_markdown(resumen), encoding="utf-8")
        registrar_historial(slug, f"QA automático: {resumen['veredicto']} ({resumen['fallidas_criticas']} críticas, {resumen['advertencias']} advertencias).")
    return resumen


ICONOS = {"aprobada": "✓ aprobada", "fallida": "✗ fallida", "no_ejecutada": "○ no ejecutada"}


def qa_a_markdown(r: dict) -> str:
    lineas = [f"# Control de calidad — {r['slug']}", "", f"Fecha: {r['fecha']}  ", f"Veredicto automático: **{r['veredicto']}**", "",
              f"Aprobadas {r['aprobadas']} · Críticas {r['fallidas_criticas']} · Advertencias {r['advertencias']} · No ejecutadas {r['no_ejecutadas']}", "",
              "| Prueba | Resultado | Severidad | Detalle |", "|---|---|---|---|"]
    for x in r["resultados"]:
        lineas.append(f"| {x['prueba']} | {ICONOS[x['estado']]} | {x['severidad']} | {x['detalle'].replace('|', '/')} |")
    lineas += ["", "Este veredicto cubre solo las pruebas automáticas. La revisión visual, la rúbrica Signature y Lighthouse se registran aparte."]
    return "\n".join(lineas) + "\n"


def ultimo_qa(slug: str) -> dict | None:
    archivo = ruta_cliente(slug) / "qa" / "ULTIMO.json"
    return json.loads(archivo.read_text(encoding="utf-8")) if archivo.exists() else None
