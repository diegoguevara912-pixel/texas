"""MOTOR DE DIRECCIÓN de FÁBRICA WEB SIGNATURE 2.0 (sin tokens de Claude).

Prepara, con cálculo y reglas verificables, la materia prima que Claude usa para decidir la
dirección artística de un cliente:

  - Motor cromático: tres paletas distintas construidas desde los colores del brief (o desde
    familias de color propuestas para el sector), con superficies, textos, estados y
    combinaciones de llamada a la acción. Cada par de contraste se calcula con la fórmula WCAG 2.x.
  - Motor tipográfico: tres combinaciones del catálogo con licencia, por personalidad, evitando
    las fuentes que ya usan otros clientes y las de moda por defecto.
  - Perfiles de movimiento: ritmo, duraciones, curvas e intensidad, listos como variables CSS que
    entiende design-system/motion/signature-motion.js.
  - Antirrepetición: rasgos abstractos (tipo de hero, composición, fuentes, tonos) ya usados en
    otros proyectos, sin ningún dato de esos clientes.
  - Huella del brief para reutilizar la investigación si el brief no cambió (ahorro de tokens).

Todo queda en clients/<slug>/diseno/kit-direccion.md y kit-direccion.json.
Las asociaciones de color o de tipografía con emociones son HIPÓTESIS de diseño, no hechos:
dependen del contexto, la cultura y la marca, y así se rotulan.
"""
from __future__ import annotations

import colorsys
import hashlib
import json
import math
import re
from pathlib import Path

import proyectos as P
import tipografia as T

# ------------------------------------------------------------------ color: utilidades WCAG

HEX = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")


def normalizar_hex(h: str) -> str:
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return "#" + h.upper()


def hex_rgb(h: str) -> tuple[float, float, float]:
    h = normalizar_hex(h)[1:]
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb_hex(rgb) -> str:
    return "#" + "".join(f"{max(0, min(255, round(c * 255))):02X}" for c in rgb)


def luminancia(h: str) -> float:
    def canal(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (canal(c) for c in hex_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a: str, b: str) -> float:
    la, lb = sorted((luminancia(a), luminancia(b)), reverse=True)
    return round((la + 0.05) / (lb + 0.05), 2)


# OKLCH (perceptualmente uniforme): permite subir o bajar la luminosidad sin cambiar el tono.
def _lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _gam(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def a_oklch(h: str) -> tuple[float, float, float]:
    r, g, b = (_lin(c) for c in hex_rgb(h))
    l_ = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m_ = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s_ = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return L, math.hypot(A, B), math.degrees(math.atan2(B, A)) % 360


def de_oklch(L: float, C: float, H: float) -> str:
    # reduce el croma hasta que el color quepa en sRGB
    for _ in range(40):
        a, b = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
        l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
        m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
        s_ = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
        rgb = (4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
               -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
               -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_)
        if all(-0.0005 <= c <= 1.0005 for c in rgb):
            return rgb_hex(tuple(_gam(max(0.0, min(1.0, c))) for c in rgb))
        C *= 0.92
    return rgb_hex(tuple(_gam(max(0.0, min(1.0, c))) for c in rgb))


def ajustar(h: str, L: float | None = None, C: float | None = None, H: float | None = None) -> str:
    l0, c0, h0 = a_oklch(h)
    return de_oklch(l0 if L is None else L, c0 if C is None else C, h0 if H is None else H)


def asegurar_contraste(color: str, fondo: str, minimo: float = 4.5) -> str:
    """Mueve la luminosidad del color (mismo tono) hasta alcanzar el contraste mínimo con el fondo."""
    if contraste(color, fondo) >= minimo:
        return normalizar_hex(color)
    L, C, H = a_oklch(color)
    oscurecer = luminancia(fondo) > 0.18
    for paso in range(1, 60):
        nuevo = de_oklch(max(0.0, L - paso * 0.012) if oscurecer else min(1.0, L + paso * 0.012), C, H)
        if contraste(nuevo, fondo) >= minimo:
            return nuevo
    return "#111111" if oscurecer else "#FFFFFF"


def texto_sobre(fondo: str) -> str:
    """El texto más legible sobre un color (casi negro o casi blanco teñidos)."""
    _, _, H = a_oklch(fondo)
    oscuro, claro = de_oklch(0.2, 0.02, H), de_oklch(0.985, 0.008, H)
    return oscuro if contraste(oscuro, fondo) >= contraste(claro, fondo) else claro


# ------------------------------------------------------------------ color: semillas y paletas

# Familias de tono que suelen aparecer en cada sector. Sirven para EVITAR lo obvio o para
# partir de algo cuando el cliente no tiene colores. Son hipótesis, no reglas.
FAMILIAS_SECTOR = [
    (r"dental|odont|cl[ií]nica|salud|m[eé]dic|hospital", {"habituales": [190, 210, 160], "nota": "En salud predominan azules y verdes fríos: diferenciarse con neutros cálidos o un acento inesperado sin perder la sensación de higiene."}),
    (r"energ|solar|el[eé]ctric|industri|fabric|manufact", {"habituales": [220, 45, 30], "nota": "En energía e industria abundan azul corporativo y amarillo/naranja de seguridad."}),
    (r"arquitect|constru|inmobil|interior", {"habituales": [30, 0, 60], "nota": "Arquitectura y construcción suelen usar neutros, gris hormigón y madera."}),
    (r"restaur|caf[eé]|comida|gastr|hotel|turis", {"habituales": [20, 40, 0], "nota": "Gastronomía y hospitalidad suelen usar rojos, ocres y negros."}),
    (r"agr[ií]|agro|campo|finca|ganad|caf[eé]", {"habituales": [120, 90, 35], "nota": "Lo agrícola tiende a verdes y tierras."}),
    (r"tecnolog|software|digital|datos|ia\b", {"habituales": [250, 270, 190], "nota": "Tecnología: azules, violetas y degradados neón (muy vistos)."}),
    (r"abogad|legal|finan|banco|seguro|contab", {"habituales": [220, 0, 45], "nota": "Legal y finanzas: azul marino, gris y dorado."}),
]

SEMILLAS_SIN_MARCA = [  # (nombre, hex) — puntos de partida diversos cuando no hay colores de marca
    ("tinta azul profunda", "#1E3A5F"), ("verde abeto", "#1F4D3A"), ("terracota tostada", "#9A4A2F"),
    ("ciruela", "#5B2A4E"), ("ocre mineral", "#A8741A"), ("petróleo", "#0F5257"), ("grafito cálido", "#2E2A27"),
    ("coral profundo", "#C2453A"), ("cobalto", "#2747A8"), ("oliva", "#5E6B2E"),
]


def colores_del_brief(brief: dict) -> list[str]:
    """Colores hex del brief en orden de importancia: existentes, secundarios, preferidos."""
    vistos = []
    for campo in ("colores_existentes", "colores_secundarios", "colores_preferidos"):
        valor = brief.get(campo) or ""
        texto = " ".join(valor) if isinstance(valor, list) else str(valor)
        for h in HEX.findall(texto):
            h = normalizar_hex(h)
            if h not in vistos:
                vistos.append(h)
    return vistos


def _es_neutro(h: str) -> bool:
    return a_oklch(h)[1] < 0.035


def _familia_sector(brief: dict) -> dict:
    texto = f"{brief.get('sector', '')} {brief.get('subsector', '')}".lower()
    for patron, datos in FAMILIAS_SECTOR:
        if re.search(patron, texto):
            return datos
    return {"habituales": [], "nota": "Sector sin familia de color dominante registrada en la fábrica."}


def _dist_tono(a: float, b: float) -> float:
    d = abs(a - b) % 360
    return min(d, 360 - d)


def _estados(fondo: str) -> dict:
    base = {"exito": "#2E7D4F", "aviso": "#A56A00", "error": "#B3261E", "info": "#2457A6"}
    return {k: asegurar_contraste(v, fondo, 4.5) for k, v in base.items()}


def _construir(nombre: str, enfoque: str, primario: str, secundario: str, acento: str, oscura: bool, porque: str,
               fondo_marca: str | None = None) -> dict:
    _, _, hp = a_oklch(primario)
    if not oscura and fondo_marca:
        fondo = normalizar_hex(fondo_marca)
        lf, cf, hf = a_oklch(fondo)
        sup1, sup2, sup3 = de_oklch(lf - 0.03, cf + 0.004, hf), de_oklch(lf - 0.065, cf + 0.008, hf), de_oklch(lf - 0.11, cf + 0.012, hf)
        texto, suave = de_oklch(0.22, 0.025, hp), de_oklch(0.42, 0.025, hp)
    elif oscura:
        fondo = de_oklch(0.17, 0.025, hp)
        sup1, sup2, sup3 = de_oklch(0.22, 0.03, hp), de_oklch(0.27, 0.035, hp), de_oklch(0.33, 0.04, hp)
        texto, suave = de_oklch(0.96, 0.012, hp), de_oklch(0.80, 0.02, hp)
    else:
        fondo = de_oklch(0.975, 0.012, hp)
        sup1, sup2, sup3 = de_oklch(0.945, 0.018, hp), de_oklch(0.91, 0.025, hp), de_oklch(0.86, 0.03, hp)
        texto, suave = de_oklch(0.22, 0.025, hp), de_oklch(0.42, 0.025, hp)
    suave = asegurar_contraste(suave, fondo, 4.5)
    cta = primario if oscura else asegurar_contraste(primario, fondo, 3.0)
    if oscura:
        cta = acento if contraste(acento, fondo) >= 3 else asegurar_contraste(acento, fondo, 3.0)
    cta_texto = texto_sobre(cta)
    if contraste(cta_texto, cta) < 4.5:  # el texto del botón manda: se ajusta el botón, no el texto
        cta = asegurar_contraste(cta, cta_texto, 4.5)
    L, C, H = a_oklch(cta)
    cta_hover = de_oklch(L - 0.06 if not oscura else min(1, L + 0.06), C, H)
    enlace = asegurar_contraste(primario if not oscura else acento, fondo, 4.5)
    paleta = {
        "nombre": nombre, "enfoque": enfoque, "modo": "oscuro" if oscura else "claro", "porque": porque,
        "colores": {
            "primario": normalizar_hex(primario), "secundario": normalizar_hex(secundario), "acento": normalizar_hex(acento),
            "fondo": fondo, "superficie_1": sup1, "superficie_2": sup2, "superficie_3": sup3,
            "texto": texto, "texto_suave": suave, "enlace": enlace, "borde": de_oklch(0.80 if not oscura else 0.40, 0.02, hp),
            "foco": asegurar_contraste(acento, fondo, 3.0),
        },
        "estados": _estados(fondo),
        "cta": {"fondo": cta, "texto": cta_texto, "hover": cta_hover, "secundario_borde": asegurar_contraste(primario if not oscura else texto, fondo, 3.0)},
    }
    paleta["contrastes"] = revisar_contrastes(paleta)
    paleta["cumple_aa"] = all(c["cumple"] for c in paleta["contrastes"])
    return paleta


def revisar_contrastes(p: dict) -> list[dict]:
    c, cta = p["colores"], p["cta"]
    pares = [
        ("texto sobre fondo", c["texto"], c["fondo"], 4.5), ("texto suave sobre fondo", c["texto_suave"], c["fondo"], 4.5),
        ("texto sobre superficie 2", c["texto"], c["superficie_2"], 4.5), ("enlace sobre fondo", c["enlace"], c["fondo"], 4.5),
        ("texto del botón principal", cta["texto"], cta["fondo"], 4.5), ("botón principal contra el fondo", cta["fondo"], c["fondo"], 3.0),
        ("anillo de foco contra el fondo", c["foco"], c["fondo"], 3.0),
    ] + [(f"estado {k}", v, c["fondo"], 4.5) for k, v in p["estados"].items()]
    return [{"par": n, "a": a, "b": b, "ratio": contraste(a, b), "minimo": m, "cumple": contraste(a, b) >= m} for n, a, b, m in pares]


def proponer_paletas(brief: dict, tonos_usados: list[float] | None = None) -> dict:
    """Tres propuestas visualmente distintas. Respeta los colores del cliente si existen."""
    marca = colores_del_brief(brief)
    familia = _familia_sector(brief)
    tonos_usados = tonos_usados or []
    fondo_marca = next((h for h in marca if _es_neutro(h) and a_oklch(h)[0] > 0.9), None)
    if marca and any(not _es_neutro(h) for h in marca):
        # el primer color cromático del brief (en orden de importancia) es el protagonista;
        # un neutro claro de marca (marfil, blanco roto) se usa como fondo
        cromaticos = [h for h in marca if not _es_neutro(h)]
        primario = cromaticos[0]
        secundario = cromaticos[1] if len(cromaticos) > 1 and a_oklch(cromaticos[1])[1] > 0.04 else ajustar(primario, L=0.85, C=0.04)
        origen = "colores de marca del brief: " + ", ".join(marca)
    else:
        evitar = familia["habituales"] + tonos_usados
        candidatos = sorted(SEMILLAS_SIN_MARCA, key=lambda s: -min([_dist_tono(a_oklch(s[1])[2], t) for t in evitar] or [180]))
        primario, secundario = candidatos[0][1], candidatos[1][1]
        origen = f"sin colores de marca: se partió de «{candidatos[0][0]}», el tono más alejado de lo habitual en el sector y de otros proyectos de la fábrica"
    _, cp, hp = a_oklch(primario)
    acento_frio_calido = de_oklch(0.62, max(0.12, cp), (hp + 150) % 360)   # complementario dividido
    acento_analogo = de_oklch(0.58, max(0.10, cp), (hp + 35) % 360)
    acento_luz = de_oklch(0.80, 0.12, (hp + 200) % 360)
    p1 = _construir("A · Marca protagonista", "Claro y sereno; el color de marca conduce las acciones.", primario, secundario,
                    acento_analogo, False, "Máxima coherencia con la marca y lectura cómoda; riesgo: puede verse contenida si no hay imágenes fuertes.",
                    fondo_marca)
    p2 = _construir("B · Contraste nocturno", "Fondo profundo teñido del tono de marca, textos claros y un acento luminoso.",
                    primario, secundario, acento_luz, True, "Más dramática y cinematográfica, da profundidad a la fotografía; riesgo: menos cálida para sectores de confianza cotidiana.")
    p3 = _construir("C · Acento inesperado", "Neutros cálidos con un acento complementario que guía la mirada a la acción.",
                    ajustar(primario, L=0.38), secundario, acento_frio_calido, False,
                    "Diferencia frente al sector y jerarquía clara de la llamada a la acción; riesgo: el acento debe usarse con disciplina.")
    return {"origen": origen, "colores_marca": marca, "sector": familia, "propuestas": [p1, p2, p3],
            "nota": "Las asociaciones color-emoción son HIPÓTESIS de diseño (dependen de cultura, sector y experiencia previa). Validar con usuarios o analítica cuando existan datos."}


def css_paleta(p: dict) -> str:
    c, cta, e = p["colores"], p["cta"], p["estados"]
    lineas = [f"  --color-{k.replace('_', '-')}: {v};" for k, v in c.items()]
    lineas += [f"  --color-{k}: {v};" for k, v in e.items()]
    lineas += [f"  --cta-fondo: {cta['fondo']};", f"  --cta-texto: {cta['texto']};", f"  --cta-hover: {cta['hover']};", f"  --cta-borde-secundario: {cta['secundario_borde']};"]
    return "\n".join(lineas)


VARIABLES_PARES = [  # pares que el QA comprueba en tokens.css si existen las variables
    ("--color-texto", "--color-fondo", 4.5), ("--color-texto-suave", "--color-fondo", 4.5),
    ("--cta-texto", "--cta-fondo", 4.5), ("--color-enlace", "--color-fondo", 4.5),
    ("--color-acento-texto", "--color-acento", 4.5),
]


def verificar_tokens(css: str) -> list[dict]:
    """Comprueba los pares de contraste declarados en tokens.css (solo valores hex directos)."""
    valores = {}
    for nombre, valor in re.findall(r"(--[\w-]+)\s*:\s*([^;}]+)[;}]", css):
        m = HEX.search(valor)
        if m and valor.strip().startswith("#"):
            valores[nombre] = normalizar_hex(m.group(0))
    salida = []
    for a, b, minimo in VARIABLES_PARES:
        if a in valores and b in valores:
            r = contraste(valores[a], valores[b])
            salida.append({"par": f"{a} / {b}", "ratio": r, "minimo": minimo, "cumple": r >= minimo})
    return salida


# ------------------------------------------------------------------ tipografía

POR_DEFECTO_DE_MODA = {"inter", "poppins", "montserrat", "roboto", "open sans", "lato"}

PERSONALIDADES = [  # palabra clave del brief → estilos del catálogo (display, texto), ratio de escala
    (r"editorial|elegan|exclusiv|lujo|sereno|serena|clásic|sofistic", ("Editorial clásico (serif)", "Humanista y cercano"), 1.333),
    (r"t[eé]cnic|industri|precis|ingenier|energ|datos|tecnol", ("Técnico y preciso", "Técnico y preciso"), 1.25),
    (r"moderno|limpi|minimal|geom[eé]tric|corporativ", ("Moderno geométrico", "Humanista y cercano"), 1.25),
    (r"cercan|familiar|amable|c[aá]lid|humano|confian", ("Humanista y cercano", "Humanista y cercano"), 1.2),
    (r"audaz|express|juven|atrevid|creativ|energ[eé]tic|impact", ("Expresivo / display", "Moderno geométrico"), 1.414),
]


def _personalidad_texto(brief: dict) -> str:
    return " ".join(str(brief.get(c) or "") for c in ("personalidad_marca", "estilo_deseado", "sensacion_deseada", "preferencias_creativas",
                                                     "tipografia_estilo", "posicionamiento", "sector", "instrucciones_adicionales")).lower()


def proponer_tipografia(brief: dict, fuentes_usadas: set[str] | None = None) -> dict:
    fuentes_usadas = {f.lower() for f in (fuentes_usadas or set())}
    pedidas = T.pedidas(brief)
    cat = T.catalogo()
    texto = _personalidad_texto(brief)
    estilos = []
    for patron, par, ratio in PERSONALIDADES:
        if re.search(patron, texto):
            estilos.append((par, ratio))
    for par, ratio in [(("Editorial clásico (serif)", "Humanista y cercano"), 1.333), (("Moderno geométrico", "Técnico y preciso"), 1.25),
                       (("Expresivo / display", "Humanista y cercano"), 1.414)]:
        if (par, ratio) not in estilos:
            estilos.append((par, ratio))

    def elegir(estilo: str, excluir: set[str]) -> dict | None:
        opciones = [f for f in cat if f["estilo"] == estilo and f["nombre"].lower() not in excluir
                    and f["nombre"].lower() not in POR_DEFECTO_DE_MODA and f["categoria"] != "handwriting"]
        nuevas = [f for f in opciones if f["nombre"].lower() not in fuentes_usadas]
        return (nuevas or opciones or [None])[0]

    def elegir_texto(estilo: str, excluir: set[str], display: dict) -> dict | None:
        excluir = excluir | {f["nombre"].lower() for f in cat if f["categoria"] == "monospace"}  # nunca mono para texto corrido
        # con titulares serif o display, el texto corrido funciona mejor en una sans legible
        if display["categoria"] == "serif" or display["estilo"].startswith("Expresivo"):
            sans = [f for f in cat if f["categoria"] == "sans-serif" and f["estilo"] in (estilo, "Humanista y cercano")
                    and f["nombre"].lower() not in excluir | POR_DEFECTO_DE_MODA | fuentes_usadas]
            if sans:
                return sans[0]
        return elegir(estilo, excluir)

    propuestas, ya = [], set()
    for (est_display, est_texto), ratio in estilos[:3]:
        d = elegir(est_display, ya)
        if not d:
            continue
        t = elegir_texto(est_texto, ya | {d["nombre"].lower()}, d)
        if not t:
            continue
        ya |= {d["nombre"].lower(), t["nombre"].lower()}
        propuestas.append({"display": d["nombre"], "texto": t["nombre"], "licencias": f"{d['licencia']} / {t['licencia']} ({d['origen']})",
                           "estilo": f"{est_display} + {est_texto}", "escala": ratio,
                           "repetida_en_otro_proyecto": bool({d['nombre'].lower(), t['nombre'].lower()} & fuentes_usadas)})
    return {"pedidas_por_diego": pedidas, "obligatorio": bool(pedidas),
            "propuestas": propuestas,
            "regla": ("Diego definió tipografía: es OBLIGATORIO respetarla; las propuestas solo sirven para roles que no definió." if pedidas else
                      "Elegir una de las propuestas o una mejor del catálogo, justificándolo por la personalidad de la marca. Nunca Inter/Poppins/Montserrat por inercia."),
            "fuentes_ya_usadas_en_la_fabrica": sorted(fuentes_usadas)}


# ------------------------------------------------------------------ movimiento

PERFILES_MOVIMIENTO = {
    "editorial-lento": {"para": "arquitectura, lujo, arte, hoteles boutique", "duracion": 1100, "duracion_corta": 380, "curva": "cubic-bezier(0.16, 1, 0.3, 1)",
                        "distancia": 28, "escalonado": 110, "parallax": 0.12, "intensidad": "media", "escenas": ["revelado tipográfico por líneas", "imagen que se descubre con máscara", "transición de fondo entre secciones"]},
    "sereno-preciso": {"para": "salud, legal, finanzas, servicios de confianza", "duracion": 750, "duracion_corta": 260, "curva": "cubic-bezier(0.22, 1, 0.36, 1)",
                       "distancia": 18, "escalonado": 70, "parallax": 0.06, "intensidad": "baja", "escenas": ["aparición suave escalonada", "diagrama que se dibuja", "contador de datos reales"]},
    "tecnico-dinamico": {"para": "tecnología, energía, industria", "duracion": 650, "duracion_corta": 200, "curva": "cubic-bezier(0.65, 0, 0.35, 1)",
                         "distancia": 24, "escalonado": 45, "parallax": 0.1, "intensidad": "media-alta", "escenas": ["línea de proceso ligada al scroll", "datos que se construyen", "rejilla que se activa"]},
    "cinematografico": {"para": "hoteles, turismo, gastronomía, automóviles", "duracion": 1300, "duracion_corta": 420, "curva": "cubic-bezier(0.7, 0, 0.2, 1)",
                        "distancia": 40, "escalonado": 130, "parallax": 0.2, "intensidad": "alta", "escenas": ["escena fijada con progreso de scroll", "zoom lento de fotografía", "cortinilla entre capítulos"]},
    "vivaz-cercano": {"para": "comercio, educación, marcas jóvenes", "duracion": 520, "duracion_corta": 180, "curva": "cubic-bezier(0.34, 1.56, 0.64, 1)",
                      "distancia": 20, "escalonado": 55, "parallax": 0.08, "intensidad": "media", "escenas": ["microinteracciones con rebote", "tarjetas que reaccionan al cursor", "iconos animados"]},
}


def proponer_movimiento(brief: dict) -> dict:
    texto = _personalidad_texto(brief)
    intensidad = str(brief.get("intensidad_animacion") or "")
    if re.search(r"arquitect|lujo|exclusiv|editorial|arte|galer", texto):
        clave = "editorial-lento"
    elif re.search(r"hotel|turis|restaur|gastr|autom|cine", texto):
        clave = "cinematografico"
    elif re.search(r"tecnol|energ|industri|software|ingenier", texto):
        clave = "tecnico-dinamico"
    elif re.search(r"tienda|comerci|juven|educa|niñ", texto):
        clave = "vivaz-cercano"
    else:
        clave = "sereno-preciso"
    perfil = dict(PERFILES_MOVIMIENTO[clave])
    if intensidad.startswith("Mínima"):
        perfil.update(parallax=0.0, distancia=max(10, perfil["distancia"] // 2), intensidad="mínima")
    elif intensidad.startswith("Alta"):
        perfil.update(parallax=round(perfil["parallax"] * 1.5, 2), intensidad="alta")
    return {"perfil": clave, **perfil, "alternativas": [k for k in PERFILES_MOVIMIENTO if k != clave],
            "css": css_movimiento(perfil)}


def css_movimiento(p: dict) -> str:
    return "\n".join([
        f"  --mov-duracion: {p['duracion']}ms;", f"  --mov-duracion-corta: {p['duracion_corta']}ms;",
        f"  --mov-curva: {p['curva']};", f"  --mov-distancia: {p['distancia']}px;",
        f"  --mov-escalonado: {p['escalonado']}ms;", f"  --mov-parallax: {p['parallax']};",
    ])


# ------------------------------------------------------------------ antirrepetición y huella

def rasgos_de_otros(slug: str) -> dict:
    """Rasgos de diseño abstractos ya usados por OTROS proyectos (sin nombres ni datos de clientes)."""
    rasgos = {"heroes": set(), "composiciones": set(), "fuentes": set(), "tonos": [], "animaciones": set()}
    base = P.carpeta_clientes()
    if not base.exists():
        return {k: (sorted(v) if isinstance(v, set) else v) for k, v in rasgos.items()}
    for carpeta in sorted(base.iterdir()):
        archivo = carpeta / "diseno" / "identidad.json"
        if carpeta.name == slug or not archivo.exists():
            continue
        try:
            ident = json.loads(archivo.read_text(encoding="utf-8"))
        except ValueError:
            continue
        rasgos["heroes"].add(str(ident.get("hero_tipo", "")))
        rasgos["composiciones"].add(str(ident.get("composicion", "")))
        rasgos["fuentes"].update(str(f) for f in ident.get("tipografias", []))
        rasgos["animaciones"].update(str(a) for a in ident.get("animaciones", []))
        for h in (ident.get("paleta") or {}).values():
            if isinstance(h, str) and HEX.fullmatch(h.strip()) and a_oklch(h)[1] > 0.04:
                rasgos["tonos"].append(round(a_oklch(h)[2]))
    return {k: (sorted(x for x in v if x) if isinstance(v, set) else v) for k, v in rasgos.items()}


CAMPOS_ESTRATEGIA = ["nombre_empresa", "sector", "subsector", "pais", "ciudad", "descripcion_breve", "tipo_cliente", "competidores",
                     "servicios_principales", "productos", "propuesta_valor", "diferenciadores", "objetivos", "objetivo_principal",
                     "accion_visitante", "posicionamiento", "sensacion_deseada", "personalidad_marca"]


def huella_brief(brief: dict) -> str:
    """Huella de los campos que afectan a la investigación: si no cambia, se reutiliza la investigación."""
    datos = {c: brief.get(c) for c in CAMPOS_ESTRATEGIA}
    return hashlib.sha256(json.dumps(datos, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:16]


def investigacion_reutilizable(slug: str) -> bool:
    carpeta = P.ruta_cliente(slug)
    marca = carpeta / "investigacion" / ".huella"
    return (carpeta / "investigacion" / "analisis.md").exists() and marca.exists() and \
        marca.read_text(encoding="utf-8").strip() == huella_brief(P.leer_brief(slug))


def sellar_investigacion(slug: str) -> None:
    carpeta = P.ruta_cliente(slug) / "investigacion"
    if (carpeta / "analisis.md").exists():
        (carpeta / ".huella").write_text(huella_brief(P.leer_brief(slug)), encoding="utf-8")


# ------------------------------------------------------------------ kit para Claude

def preparar_kit(slug: str) -> dict:
    brief = P.leer_brief(slug)
    otros = rasgos_de_otros(slug)
    paletas = proponer_paletas(brief, otros["tonos"])
    tipos = proponer_tipografia(brief, set(otros["fuentes"]))
    mov = proponer_movimiento(brief)
    kit = {"slug": slug, "huella_brief": huella_brief(brief), "investigacion_reutilizable": investigacion_reutilizable(slug),
           "paletas": paletas, "tipografia": tipos, "movimiento": mov, "evitar_repetir": otros,
           "avisos": avisos_estrategicos(brief, paletas)}
    destino = P.ruta_cliente(slug) / "diseno"
    destino.mkdir(parents=True, exist_ok=True)
    (destino / "kit-direccion.json").write_text(json.dumps(kit, ensure_ascii=False, indent=2), encoding="utf-8")
    (destino / "kit-direccion.md").write_text(kit_a_markdown(kit), encoding="utf-8")
    return kit


def avisos_estrategicos(brief: dict, paletas: dict) -> list[str]:
    salida = []
    marca = paletas["colores_marca"]
    if marca:
        calidos_claros = [h for h in marca if a_oklch(h)[0] > 0.9 and 40 <= a_oklch(h)[2] <= 110]
        terracotas = [h for h in marca if 20 <= a_oklch(h)[2] <= 55 and a_oklch(h)[1] > 0.06]
        if calidos_claros and terracotas:
            salida.append("Los colores de marca forman «fondo crema + acento terracota», una combinación que la propia regla anti-genérico señala. "
                          "Se respetan, pero la diferenciación debe venir de la composición, la fotografía y el movimiento (o de usar la propuesta B/C como variación autorizada).")
    if str(brief.get("fotografias", "")) in ("No", "No sé") and "Imágenes del cliente" not in (brief.get("fuentes_imagenes") or []):
        salida.append("No hay fotografías del cliente: el plan de imágenes debe usar bancos con licencia comercial, recursos programados o IA autorizada; una web sin imágenes queda plana.")
    if brief.get("estado_negocio") == "demostrativo":
        salida.append("Demo: cualquier foto de personas o instalaciones es ilustrativa y debe rotularse como tal; nunca presentarla como del negocio.")
    return salida


def kit_a_markdown(k: dict) -> str:
    l = [f"# Kit de dirección · {k['slug']}", "",
         "Calculado por `core/direccion.py` (sin IA). Son **puntos de partida verificados**, no decisiones finales: "
         "Claude elige, ajusta y justifica. Los contrastes están medidos con la fórmula WCAG 2.x.", ""]
    if k["avisos"]:
        l += ["## Avisos", *[f"- {a}" for a in k["avisos"]], ""]
    p = k["paletas"]
    l += ["## Motor cromático", f"Origen: {p['origen']}.", f"Sector: {p['sector']['nota']} (HIPÓTESIS)", ""]
    for prop in p["propuestas"]:
        c = prop["colores"]
        l += [f"### {prop['nombre']} — {prop['enfoque']}", f"Por qué / riesgo: {prop['porque']}",
              "| Rol | Color |", "|---|---|", *[f"| {r} | `{v}` |" for r, v in c.items()],
              f"| estados | " + ", ".join(f"{a} `{b}`" for a, b in prop["estados"].items()) + " |",
              f"| CTA | fondo `{prop['cta']['fondo']}` · texto `{prop['cta']['texto']}` · hover `{prop['cta']['hover']}` |",
              f"Contraste AA: {'cumple en todos los pares' if prop['cumple_aa'] else 'NO cumple: ' + ', '.join(x['par'] for x in prop['contrastes'] if not x['cumple'])}.",
              "```css", ":root {", css_paleta(prop), "}", "```", ""]
    t = k["tipografia"]
    l += ["## Motor tipográfico", t["regla"]]
    if t["pedidas_por_diego"]:
        l.append("Pedidas por Diego: " + ", ".join(f"{a}: {b}" for a, b in t["pedidas_por_diego"].items()))
    for i, prop in enumerate(t["propuestas"], 1):
        l.append(f"{i}. **{prop['display']}** (titulares) + **{prop['texto']}** (texto) · {prop['estilo']} · escala {prop['escala']} · {prop['licencias']}"
                 + (" · ⚠ ya usada en otro proyecto" if prop["repetida_en_otro_proyecto"] else ""))
    m = k["movimiento"]
    l += ["", "## Perfil de movimiento", f"**{m['perfil']}** (intensidad {m['intensidad']}; adecuado para {m['para']}). Alternativas: {', '.join(m['alternativas'])}.",
          "Escenas sugeridas: " + "; ".join(m["escenas"]) + ".", "```css", ":root {", m["css"], "}", "```",
          "Motor reutilizable: `design-system/motion/` (se copia a `sitio/base/motion/`). Ver `references/16-motor-de-movimiento.md`.", ""]
    e = k["evitar_repetir"]
    l += ["## Ya usado en otros proyectos de la fábrica (no repetir sin razón)",
          f"- Tipos de hero: {', '.join(e['heroes']) or 'ninguno'}", f"- Composiciones: {', '.join(e['composiciones']) or 'ninguna'}",
          f"- Fuentes: {', '.join(e['fuentes']) or 'ninguna'}", f"- Animaciones: {', '.join(e['animaciones']) or 'ninguna'}", ""]
    l += ["## Investigación", "Reutilizable (el brief no cambió desde la última investigación): **" + ("sí" if k["investigacion_reutilizable"] else "no") + "**."]
    return "\n".join(l) + "\n"


# ------------------------------------------------------------------ instalación del motor de movimiento

BIBLIOTECAS = {"gsap": "gsap-3.15.0", "lenis": "lenis-1.3.26", "three": "three-0.186.1"}


def instalar_movimiento(slug: str, bibliotecas: list[str]) -> list[str]:
    """Copia el motor de movimiento propio a sitio/base/motion/ y, si la dirección las pidió,
    las bibliotecas locales a sitio/base/vendor/<nombre>/. Es código de la fábrica: se actualiza siempre."""
    import shutil
    sitio = P.ruta_cliente(slug) / "sitio"
    origen = P.RAIZ / "design-system"
    destino = sitio / "base" / "motion"
    destino.mkdir(parents=True, exist_ok=True)
    for nombre in ("signature-motion.js", "signature-motion.css"):
        shutil.copy2(origen / "motion" / nombre, destino / nombre)
    instaladas = []
    for b in bibliotecas:
        carpeta = BIBLIOTECAS.get(b)
        if not carpeta:
            continue
        final = sitio / "base" / "vendor" / b
        final.mkdir(parents=True, exist_ok=True)
        for archivo in (origen / "vendor" / carpeta).iterdir():
            if archivo.is_file():
                shutil.copy2(archivo, final / archivo.name)
        instaladas.append(b)
    return instaladas
