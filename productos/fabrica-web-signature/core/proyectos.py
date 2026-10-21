"""Motor de proyectos de FÁBRICA WEB SIGNATURE.

Crea, identifica, valida y registra el estado de cada cliente. Cada cliente
vive aislado en clients/<slug>/ y nada de un cliente se copia a otro.
Solo usa la biblioteca estándar de Python.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PLANTILLAS = RAIZ / "templates"
ESQUEMA_BRIEF = PLANTILLAS / "brief" / "brief-schema.json"


def carpeta_clientes() -> Path:
    """Carpeta de clientes. FABRICA_CLIENTES permite usar otra (pruebas)."""
    otra = os.environ.get("FABRICA_CLIENTES")
    return Path(otra) if otra else RAIZ / "clients"


# Etapas del flujo permanente (sección 33 de la especificación).
ETAPAS = [
    ("brief", "A. Información recibida"),
    ("analisis", "B. Negocio comprendido"),
    ("concepto", "C. Dirección creativa (3 conceptos)"),
    ("identidad", "D. Sistema visual"),
    ("desarrollo", "E. Web construida"),
    ("recursos", "F. Recursos incorporados"),
    ("calidad", "G. Pruebas"),
    ("mejora", "H. Mejoras aplicadas"),
    ("vista_previa", "I. Vista previa entregada"),
    ("cambios", "J. Cambios solicitados"),
    ("aprobado", "K. Aprobado por Diego"),
    ("publicado", "L. Publicado"),
    ("guardado", "M. Guardado y documentado"),
]
IDS_ETAPAS = [e[0] for e in ETAPAS]
NOMBRE_ETAPA = dict(ETAPAS)


class ErrorFabrica(Exception):
    """Error comprensible para mostrar a Diego tal cual."""


def ahora() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def slugificar(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    texto = re.sub(r"[^a-zA-Z0-9]+", "-", texto).strip("-").lower()
    return texto[:60].strip("-") or "cliente"


SLUG_VALIDO = re.compile(r"^[a-z0-9][a-z0-9-]{0,59}$")


def ruta_cliente(slug: str) -> Path:
    """Devuelve la carpeta del cliente, impidiendo salir de clients/."""
    if not SLUG_VALIDO.match(slug or ""):
        raise ErrorFabrica(f"Identificador de cliente no válido: {slug!r}")
    return carpeta_clientes() / slug


# ---------------------------------------------------------------- brief

def cargar_esquema() -> dict:
    return json.loads(ESQUEMA_BRIEF.read_text(encoding="utf-8"))


def campos_esquema() -> list[dict]:
    return [c for s in cargar_esquema()["secciones"] for c in s["campos"]]


def normalizar_brief(datos: dict) -> dict:
    """Aplica valores por defecto y limpia espacios. No inventa contenido."""
    limpio = {}
    for campo in campos_esquema():
        valor = datos.get(campo["id"])
        if isinstance(valor, str):
            valor = valor.strip()
        if valor in (None, "", []) and "defecto" in campo:
            valor = campo["defecto"]
        if valor not in (None, "", []):
            limpio[campo["id"]] = valor
    # Campos extra que no están en el esquema se conservan aparte.
    extra = {k: v for k, v in datos.items() if k not in limpio and k not in {c["id"] for c in campos_esquema()}}
    if extra:
        limpio["_extra"] = extra
    limpio["nivel_creativo"] = "SIGNATURE"
    return limpio


def validar_brief(datos: dict) -> list[str]:
    """Lista de problemas. Vacía = brief válido."""
    problemas = []
    for campo in campos_esquema():
        valor = datos.get(campo["id"])
        if campo.get("obligatorio") and valor in (None, "", []):
            problemas.append(f"Falta el campo obligatorio: {campo['label']}")
        if valor in (None, "", []):
            continue
        if campo["tipo"] == "opcion" and valor not in campo["opciones"]:
            problemas.append(f"{campo['label']}: '{valor}' no es una opción válida ({', '.join(campo['opciones'])})")
        if campo["tipo"] == "multiple":
            if not isinstance(valor, list):
                problemas.append(f"{campo['label']}: debe ser una lista")
            else:
                malos = [v for v in valor if v not in campo["opciones"]]
                if malos:
                    problemas.append(f"{campo['label']}: opciones no válidas {malos}")
    wa = str(datos.get("whatsapp", ""))
    if wa and not re.fullmatch(r"\+?\d{8,15}", wa.replace(" ", "").replace("-", "")):
        problemas.append("WhatsApp: usa solo números con código de país, ej. 50499998888")
    correo = str(datos.get("correo", ""))
    if correo and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", correo):
        problemas.append("Correo electrónico con formato no válido")
    return problemas


def brief_a_markdown(brief: dict) -> str:
    esquema = cargar_esquema()
    lineas = [f"# Brief Inteligente Signature — {brief.get('nombre_empresa', '')}", "",
              "Nivel creativo: **SIGNATURE — experiencia digital extraordinaria**", ""]
    for seccion in esquema["secciones"]:
        filas = []
        for campo in seccion["campos"]:
            valor = brief.get(campo["id"])
            if valor in (None, "", []):
                continue
            if isinstance(valor, list):
                valor = ", ".join(valor)
            filas.append(f"- **{campo['label']}:** {str(valor).replace(chr(10), '  ' + chr(10) + '  ')}")
        if filas:
            lineas += [f"## {seccion['id']}. {seccion['titulo']}", *filas, ""]
    vacios = [c["label"] for c in campos_esquema() if brief.get(c["id"]) in (None, "", [])]
    if vacios:
        lineas += ["## Campos vacíos (la fábrica decide o queda como [PENDIENTE])",
                   ", ".join(vacios), ""]
    return "\n".join(lineas)


# ---------------------------------------------------------------- estado

def leer_estado(slug: str) -> dict:
    archivo = ruta_cliente(slug) / "estado.json"
    if not archivo.exists():
        raise ErrorFabrica(f"No existe el cliente '{slug}'.")
    return json.loads(archivo.read_text(encoding="utf-8"))


def guardar_estado(slug: str, estado: dict) -> None:
    carpeta = ruta_cliente(slug)
    (carpeta / "estado.json").write_text(json.dumps(estado, ensure_ascii=False, indent=2), encoding="utf-8")
    (carpeta / "ESTADO.md").write_text(estado_a_markdown(estado), encoding="utf-8")


def estado_a_markdown(estado: dict) -> str:
    lineas = [f"# {estado['nombre']}", "",
              f"- Identificador: `{estado['slug']}`",
              f"- Etapa actual: **{NOMBRE_ETAPA.get(estado['etapa'], estado['etapa'])}**",
              f"- Tipo: {estado.get('tipo_web', '')} · Negocio {estado.get('estado_negocio', '')}",
              f"- Publicación: {estado.get('publicacion', {}).get('estado', 'no publicado')}",
              "", "| Etapa | Estado | Fecha | Nota |", "|---|---|---|---|"]
    hechas = {h["etapa"]: h for h in estado.get("historial", [])}
    for eid, nombre in ETAPAS:
        h = hechas.get(eid)
        marca = "✓" if h else ("→" if eid == estado["etapa"] else "")
        lineas.append(f"| {nombre} | {marca} | {h['fecha'] if h else ''} | {h.get('nota', '') if h else ''} |")
    creditos = estado.get("creditos_hostinger", [])
    if creditos:
        lineas += ["", "## Créditos de Hostinger", "| Fecha | Mensaje | Créditos |", "|---|---|---|"]
        lineas += [f"| {c['fecha']} | {c['mensaje']} | {c['creditos']} |" for c in creditos]
        lineas.append(f"| | **Total** | **{sum(c['creditos'] for c in creditos)}** |")
    if estado.get("pendientes"):
        lineas += ["", "## Pendientes", *[f"- {p}" for p in estado["pendientes"]]]
    return "\n".join(lineas) + "\n"


def avanzar_etapa(slug: str, etapa: str, nota: str = "") -> dict:
    if etapa not in IDS_ETAPAS:
        raise ErrorFabrica(f"Etapa desconocida '{etapa}'. Válidas: {', '.join(IDS_ETAPAS)}")
    if etapa in ("publicado",):
        raise ErrorFabrica("La etapa 'publicado' solo se registra con 'registrar-publicacion' tras una publicación real y autorizada.")
    estado = leer_estado(slug)
    if etapa == "aprobado" and not nota:
        raise ErrorFabrica("Para registrar la aprobación indica en la nota quién aprobó y qué (ej. 'Diego aprobó la versión 2 el 20/10').")
    estado["etapa"] = etapa
    estado["historial"] = [h for h in estado.get("historial", []) if h["etapa"] != etapa]
    estado["historial"].append({"etapa": etapa, "fecha": ahora(), "nota": nota})
    estado["actualizado"] = ahora()
    guardar_estado(slug, estado)
    registrar_historial(slug, f"Etapa → {NOMBRE_ETAPA[etapa]}. {nota}".strip())
    return estado


def registrar_creditos(slug: str, mensaje: str, creditos: float) -> dict:
    """Anota créditos gastados en Hostinger AI Builder para medir el costo real por página."""
    if creditos < 0:
        raise ErrorFabrica("Los créditos no pueden ser negativos.")
    estado = leer_estado(slug)
    estado.setdefault("creditos_hostinger", []).append({"fecha": ahora(), "mensaje": mensaje.strip()[:120], "creditos": creditos})
    guardar_estado(slug, estado)
    registrar_historial(slug, f"Créditos de Hostinger: {creditos} ({mensaje.strip()[:60]}).")
    return estado


def registrar_historial(slug: str, texto: str) -> None:
    archivo = ruta_cliente(slug) / "HISTORIAL.md"
    with archivo.open("a", encoding="utf-8") as f:
        f.write(f"- {ahora()} — {texto}\n")


# ---------------------------------------------------------------- creación

ORDEN_CLAUDE = """# Orden de trabajo para Claude Code — {nombre}

Este archivo lo generó la fábrica. Es la entrada estructurada del proyecto.

Para desarrollar este proyecto abre Claude Code en la carpeta de la fábrica y escribe:

    /fabrica-web-signature desarrollar {slug}

Claude leerá `brief.json` y seguirá el flujo permanente A→M de la skill:
investigación proporcional, tres conceptos creativos, identidad propia,
construcción, pruebas, mejoras y vista previa. No publicará nada sin tu
aprobación explícita.

Cambios solicitados desde Signature Studio: ver `cambios-solicitados.md`.
"""

LICENCIAS = """# Recursos y licencias — {nombre}

| Archivo | Origen | Autor | Licencia | URL | Fecha |
|---|---|---|---|---|---|
"""


def crear_proyecto(datos: dict, slug: str | None = None) -> str:
    """Crea clients/<slug>/ desde un brief. Nunca sobrescribe."""
    brief = normalizar_brief(datos)
    problemas = validar_brief(brief)
    if problemas:
        raise ErrorFabrica("El brief tiene problemas:\n- " + "\n- ".join(problemas))
    slug = slug or slugificar(brief.get("nombre_comercial") or brief["nombre_empresa"])
    carpeta = ruta_cliente(slug)
    if carpeta.exists():
        raise ErrorFabrica(f"Ya existe un proyecto '{slug}'. No se sobrescribe: usa otro identificador o modifica el existente.")
    carpeta_clientes().mkdir(parents=True, exist_ok=True)
    temporal = carpeta.with_name(f".{slug}.creando")
    if temporal.exists():
        shutil.rmtree(temporal)
    temporal.mkdir()
    nombre = brief.get("nombre_comercial") or brief["nombre_empresa"]
    (temporal / "brief.json").write_text(json.dumps(brief, ensure_ascii=False, indent=2), encoding="utf-8")
    (temporal / "brief.md").write_text(brief_a_markdown(brief), encoding="utf-8")
    (temporal / "ORDEN_CLAUDE.md").write_text(ORDEN_CLAUDE.format(nombre=nombre, slug=slug), encoding="utf-8")
    (temporal / "recursos").mkdir()
    (temporal / "recursos" / "licencias.md").write_text(LICENCIAS.format(nombre=nombre), encoding="utf-8")
    (temporal / "HISTORIAL.md").write_text(f"# Historial — {nombre}\n\n", encoding="utf-8")
    temporal.rename(carpeta)
    estado = {
        "slug": slug,
        "nombre": nombre,
        "sector": brief.get("sector", ""),
        "tipo_web": brief.get("tipo_web", ""),
        "estado_negocio": brief.get("estado_negocio", ""),
        "demo": brief.get("estado_negocio") == "demostrativo",
        "etapa": "brief",
        "creado": ahora(),
        "actualizado": ahora(),
        "historial": [{"etapa": "brief", "fecha": ahora(), "nota": "Proyecto creado desde el brief"}],
        "pendientes": [],
        "publicacion": {"estado": "no publicado", "versiones": []},
    }
    guardar_estado(slug, estado)
    registrar_historial(slug, "Proyecto creado desde el Brief Inteligente Signature.")
    return slug


def actualizar_brief(slug: str, datos: dict) -> None:
    """Edita el brief guardando la versión anterior en historial/."""
    carpeta = ruta_cliente(slug)
    if not (carpeta / "brief.json").exists():
        raise ErrorFabrica(f"No existe el cliente '{slug}'.")
    brief = normalizar_brief(datos)
    problemas = validar_brief(brief)
    if problemas:
        raise ErrorFabrica("El brief tiene problemas:\n- " + "\n- ".join(problemas))
    respaldo = carpeta / "historial"
    respaldo.mkdir(exist_ok=True)
    marca = datetime.now().strftime("%Y%m%d-%H%M%S")
    shutil.copy2(carpeta / "brief.json", respaldo / f"brief-{marca}.json")
    (carpeta / "brief.json").write_text(json.dumps(brief, ensure_ascii=False, indent=2), encoding="utf-8")
    (carpeta / "brief.md").write_text(brief_a_markdown(brief), encoding="utf-8")
    estado = leer_estado(slug)
    estado["demo"] = brief.get("estado_negocio") == "demostrativo"
    estado["tipo_web"] = brief.get("tipo_web", "")
    estado["actualizado"] = ahora()
    guardar_estado(slug, estado)
    registrar_historial(slug, f"Brief editado (versión anterior en historial/brief-{marca}.json).")


def leer_brief(slug: str) -> dict:
    return json.loads((ruta_cliente(slug) / "brief.json").read_text(encoding="utf-8"))


def listar_proyectos() -> list[dict]:
    base = carpeta_clientes()
    if not base.exists():
        return []
    proyectos = []
    for carpeta in sorted(base.iterdir()):
        if carpeta.is_dir() and not carpeta.name.startswith(".") and (carpeta / "estado.json").exists():
            estado = json.loads((carpeta / "estado.json").read_text(encoding="utf-8"))
            estado["tiene_sitio"] = (carpeta / "sitio" / "index.html").exists()
            proyectos.append(estado)
    return proyectos


def solicitar_cambio(slug: str, texto: str) -> None:
    """Registra un cambio pedido en lenguaje natural para que Claude lo aplique."""
    if not texto.strip():
        raise ErrorFabrica("Escribe el cambio que quieres.")
    archivo = ruta_cliente(slug) / "cambios-solicitados.md"
    nuevo = not archivo.exists()
    with archivo.open("a", encoding="utf-8") as f:
        if nuevo:
            f.write("# Cambios solicitados\n\nClaude marca cada uno como [hecho] al aplicarlo.\n\n")
        f.write(f"- [pendiente] {ahora()} — {texto.strip()}\n")
    registrar_historial(slug, "Cambio solicitado: " + texto.strip()[:120])


def iniciar_sitio(slug: str) -> list[str]:
    """Copia la base técnica (no visual) a clients/<slug>/sitio/. No pisa archivos."""
    destino = ruta_cliente(slug) / "sitio"
    if not (ruta_cliente(slug) / "estado.json").exists():
        raise ErrorFabrica(f"No existe el cliente '{slug}'.")
    origen = RAIZ / "design-system" / "base-tecnica"
    copiados = []
    for archivo in origen.rglob("*"):
        if archivo.is_file():
            rel = archivo.relative_to(origen)
            final = destino / rel
            if final.exists():
                continue
            final.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(archivo, final)
            copiados.append(str(rel).replace("\\", "/"))
    registrar_historial(slug, f"Base técnica copiada a sitio/ ({len(copiados)} archivos).")
    return copiados
