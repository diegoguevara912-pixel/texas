"""Preparación de producción, respaldos, entrega y registro de publicación.

Este módulo NUNCA publica. Prepara el paquete y la lista de verificación;
la publicación la ejecuta Claude con el conector oficial de Hostinger solo
después de la confirmación explícita de Diego, y luego se registra aquí.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import zipfile
from datetime import datetime
from pathlib import Path

from proyectos import ErrorFabrica, IDS_ETAPAS, ahora, guardar_estado, leer_estado, registrar_historial, ruta_cliente
from qa import ejecutar_qa

EXCLUIR = {".DS_Store", "Thumbs.db", "desktop.ini"}


def _archivos_sitio(sitio: Path):
    for p in sorted(sitio.rglob("*")):
        if p.is_file() and p.name not in EXCLUIR and "respaldos" not in p.parts and not p.name.endswith((".md", ".bak")):
            yield p


def generar_seo(slug: str, dominio: str) -> list[str]:
    """Escribe sitemap.xml y robots.txt para el dominio final. Demos: no indexables."""
    dominio = dominio.strip().rstrip("/")
    if not re.fullmatch(r"https://[a-z0-9.-]+\.[a-z]{2,}", dominio):
        raise ErrorFabrica("El dominio debe tener la forma https://midominio.com")
    estado = leer_estado(slug)
    sitio = ruta_cliente(slug) / "sitio"
    if not (sitio / "index.html").exists():
        raise ErrorFabrica("No hay sitio construido todavía.")
    escritos = []
    if estado.get("demo"):
        (sitio / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
        escritos.append("robots.txt (demo: no indexar)")
    else:
        urls = []
        for p in sorted(sitio.rglob("*.html")):
            if p.name == "404.html" or "respaldos" in p.parts:
                continue
            rel = str(p.relative_to(sitio)).replace("\\", "/")
            rel = "" if rel == "index.html" else rel.replace("/index.html", "/")
            urls.append(f"  <url><loc>{dominio}/{rel}</loc><lastmod>{datetime.now():%Y-%m-%d}</lastmod></url>")
        (sitio / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n", encoding="utf-8")
        (sitio / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {dominio}/sitemap.xml\n", encoding="utf-8")
        escritos += ["sitemap.xml", "robots.txt"]
    registrar_historial(slug, f"SEO generado para {dominio}: {', '.join(escritos)}.")
    return escritos


def respaldar_sitio(slug: str, motivo: str = "") -> Path:
    carpeta = ruta_cliente(slug)
    sitio = carpeta / "sitio"
    if not sitio.exists():
        raise ErrorFabrica("No hay sitio que respaldar.")
    destino = carpeta / "respaldos" / datetime.now().strftime("%Y%m%d-%H%M%S")
    shutil.copytree(sitio, destino)
    registrar_historial(slug, f"Respaldo de sitio/ en {destino.relative_to(carpeta)}. {motivo}".strip())
    return destino


def preparar_produccion(slug: str, dominio: str, destino_hosting: str = "") -> dict:
    """Pruebas + paquete zip + checklist. Requiere aprobación registrada y QA sin fallos críticos."""
    carpeta = ruta_cliente(slug)
    estado = leer_estado(slug)
    if IDS_ETAPAS.index(estado["etapa"]) < IDS_ETAPAS.index("aprobado"):
        raise ErrorFabrica("Este proyecto no tiene aprobación registrada. Cuando Diego apruebe, registra: estado <slug> aprobado --nota \"...\"")
    generar_seo(slug, dominio)
    qa = ejecutar_qa(slug)
    bloqueos = [r["prueba"] + ": " + r["detalle"] for r in qa["resultados"] if r["estado"] == "fallida" and (r["severidad"] == "critica" or r["id"] == "pendientes")]
    if bloqueos:
        raise ErrorFabrica("No se puede preparar producción con estos fallos:\n- " + "\n- ".join(bloqueos))
    sitio = carpeta / "sitio"
    deploy = carpeta / "entrega" / "deploy"
    deploy.mkdir(parents=True, exist_ok=True)
    marca = datetime.now().strftime("%Y%m%d-%H%M%S")
    zip_ruta = deploy / f"{slug}-{marca}.zip"
    manifiesto = []
    with zipfile.ZipFile(zip_ruta, "w", zipfile.ZIP_DEFLATED) as z:
        for p in _archivos_sitio(sitio):
            rel = str(p.relative_to(sitio)).replace("\\", "/")
            z.write(p, rel)
            manifiesto.append({"archivo": rel, "bytes": p.stat().st_size, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()})
    version = len(estado.get("publicacion", {}).get("versiones", [])) + 1
    info = {"slug": slug, "version": version, "dominio": dominio, "destino_hosting": destino_hosting, "paquete": zip_ruta.name,
            "fecha": ahora(), "qa": qa["veredicto"], "archivos": manifiesto}
    (deploy / f"{slug}-{marca}.manifiesto.json").write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
    checklist = CHECKLIST.format(nombre=estado["nombre"], dominio=dominio, paquete=zip_ruta.name, version=version,
                                 qa=qa["veredicto"], destino=destino_hosting or "[confirmar con el conector de Hostinger]",
                                 n=len(manifiesto), slug=slug)
    (deploy / "CHECKLIST-PUBLICACION.md").write_text(checklist, encoding="utf-8")
    estado.setdefault("publicacion", {})["preparado"] = {"version": version, "paquete": zip_ruta.name, "fecha": ahora(), "dominio": dominio}
    guardar_estado(slug, estado)
    registrar_historial(slug, f"Producción preparada: versión {version}, paquete {zip_ruta.name}. NO publicado.")
    return info


CHECKLIST = """# Lista de verificación de publicación — {nombre}

Versión {version} · Paquete `{paquete}` ({n} archivos) · QA: {qa}

Esto NO se ha publicado. Publicar requiere que Diego escriba una confirmación
explícita del tipo: "Autorizo publicar {slug} versión {version} en {dominio}".

## Antes de publicar (Claude, con el conector de Hostinger, solo lectura)
- [ ] Confirmar la cuenta y el sitio de destino: {destino}
- [ ] Confirmar que el plan admite sitios estáticos (todos los planes web lo admiten).
- [ ] Listar los archivos actuales del destino para saber qué se reemplaza.
- [ ] Respaldar el contenido actual (descargar desde hPanel o con el conector).
- [ ] Presentar a Diego: dominio, qué se reemplaza y cómo volver atrás. Esperar su "sí".

## Publicación (solo con confirmación)
1. Subir el zip con "Generate upload URL" + subida TUS (curl.exe en Windows).
2. Ejecutar "Deploy static site archive" con la ruta del zip. Atención: reemplaza el contenido del sitio.
3. Consultar el estado hasta que termine (las operaciones son asíncronas).

## Después
- [ ] Abrir {dominio}: HTTPS, portada, páginas, WhatsApp, formularios, móvil.
- [ ] Registrar: python core/fabrica.py registrar-publicacion {slug} --dominio {dominio} --aprobado "texto de la aprobación"
- [ ] Si algo falla: volver a desplegar el respaldo y avisar a Diego.

## Reversión disponible
- Cada paquete anterior queda en entrega/deploy/ y cada versión de sitio/ en respaldos/.
- Para volver atrás: desplegar el zip de la versión anterior siguiendo los mismos pasos.
"""


def registrar_publicacion(slug: str, dominio: str, aprobado: str) -> dict:
    if not aprobado.strip():
        raise ErrorFabrica("Indica el texto o la referencia de la aprobación de Diego.")
    estado = leer_estado(slug)
    prep = estado.get("publicacion", {}).get("preparado")
    if not prep:
        raise ErrorFabrica("No hay una versión preparada. Ejecuta antes preparar-produccion.")
    pub = estado.setdefault("publicacion", {})
    pub.setdefault("versiones", []).append({**prep, "dominio": dominio, "publicado": ahora(), "aprobacion": aprobado})
    pub["estado"] = f"publicado en {dominio} (v{prep['version']})"
    pub.pop("preparado", None)
    estado["etapa"] = "publicado"
    estado["historial"] = [h for h in estado["historial"] if h["etapa"] != "publicado"] + [{"etapa": "publicado", "fecha": ahora(), "nota": f"{dominio} v{prep['version']}"}]
    guardar_estado(slug, estado)
    registrar_historial(slug, f"PUBLICADO en {dominio}, versión {prep['version']}. Aprobación: {aprobado}")
    return estado


def generar_ficha(slug: str) -> Path:
    """Crea entrega/ficha-hostinger.md con los datos del brief (no sobrescribe)."""
    from proyectos import leer_brief
    b = leer_brief(slug)
    destino = ruta_cliente(slug) / "entrega" / "ficha-hostinger.md"
    if destino.exists():
        raise ErrorFabrica(f"Ya existe {destino.name}. Edítala o bórrala antes de regenerarla.")
    destino.parent.mkdir(exist_ok=True)
    p = lambda k: str(b.get(k) or "[PENDIENTE]")
    contacto = "\n".join(f"- {n}: {b[k]}" for k, n in [("whatsapp", "WhatsApp"), ("telefono", "Teléfono"), ("correo", "Correo"), ("ubicacion", "Dirección"), ("horarios", "Horarios"), ("redes", "Redes")] if b.get(k)) or "[PENDIENTE]"
    plantilla = (Path(__file__).resolve().parent.parent / "biblioteca" / "plantilla-ficha.md").read_text(encoding="utf-8")
    destino.write_text(plantilla.format(
        logo=b.get("logotipo") or "[PENDIENTE]", fotos=b.get("fotografias") or "[PENDIENTE]",
        nombre=b.get("nombre_comercial") or b["nombre_empresa"], descripcion=p("descripcion_breve"), sector=p("sector"),
        ubicacion=", ".join(x for x in (b.get("ciudad"), b.get("pais")) if x) or "[PENDIENTE]", idioma=b.get("idioma", "Español"),
        demo="\n**Sitio de demostración: usar datos de ejemplo marcados como tales y no indexar en buscadores.**\n" if b.get("estado_negocio") == "demostrativo" else "",
        objetivos=", ".join(b.get("objetivos", [])) or "[PENDIENTE]", publico=p("tipo_cliente"),
        evitar=b.get("colores_evitar") or "fondos negro con dorado por defecto, plantillas genéricas",
        servicios=p("servicios_principales"), contacto=contacto), encoding="utf-8")
    registrar_historial(slug, "Ficha para Hostinger creada (entrega/ficha-hostinger.md).")
    return destino


def empaquetar_entrega(slug: str) -> Path:
    """Zip del proyecto para entregar al cliente, sin historial interno ni respaldos."""
    carpeta = ruta_cliente(slug)
    entrega = carpeta / "entrega"
    entrega.mkdir(exist_ok=True)
    destino = entrega / f"{slug}-entrega-{datetime.now():%Y%m%d}.zip"
    incluir = ["sitio", "diseno", "recursos", "brief.md", "entrega/documentacion"]
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        for nombre in incluir:
            ruta = carpeta / nombre
            if ruta.is_file():
                z.write(ruta, nombre)
            elif ruta.is_dir():
                for p in ruta.rglob("*"):
                    if p.is_file() and p.name not in EXCLUIR and not p.name.startswith(".env"):
                        z.write(p, str(p.relative_to(carpeta)).replace("\\", "/"))
    registrar_historial(slug, f"Paquete de entrega creado: {destino.name}")
    return destino
