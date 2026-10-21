"""Negocio: planes y precios, dominios, ventas y métricas de crecimiento.

Datos del negocio de Diego (no de los clientes) en negocio/ (fuera de git).
Datos comerciales de cada cliente en clients/<slug>/negocio.json, dentro de
su propia carpeta para mantener el aislamiento entre clientes.
Nada de esto inventa precios: los valores vacíos quedan como "por definir".
"""
from __future__ import annotations

import json
import math
import os
from datetime import date, datetime, timedelta
from pathlib import Path

from proyectos import RAIZ, ErrorFabrica, ahora, leer_estado, listar_proyectos, registrar_historial, ruta_cliente


def carpeta_negocio() -> Path:
    otra = os.environ.get("FABRICA_NEGOCIO")
    return Path(otra) if otra else RAIZ / "negocio"


PLANES_INICIALES = {
    "moneda": "USD",
    "nota": "Los valores de cada página los define Diego. Ningún precio se inventa.",
    "dominio_referencia": {
        "extension": ".com",
        "primer_anio": 9.99,
        "renovacion_anual": 19.99,
        "fuente": "Rastreador domainoffer.net (mayo 2026), precio de Hostinger. Confirmar en hostinger.com antes de cotizar.",
        "margen_pct": 0,
    },
    "planes": [
        {"id": "esencial", "nombre": "Esencial", "valor_pagina": None, "mensualidad": None, "incluye_dominio": True, "descripcion": "Por definir"},
        {"id": "signature", "nombre": "Signature", "valor_pagina": None, "mensualidad": None, "incluye_dominio": True, "descripcion": "Por definir"},
    ],
}

CONCEPTOS_VENTA = ("pagina", "suscripcion", "dominio", "otro")
ESTADOS_PAGO = ("pagado", "pendiente")
ESTADOS_DOMINIO = ("pagado", "pendiente", "no aplica")
ESTADOS_SUSCRIPCION = ("activa", "pausada", "cancelada", "sin suscripción")


def _leer(ruta: Path, defecto):
    return json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else json.loads(json.dumps(defecto))


def _guardar(ruta: Path, datos) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")


def _num(valor, campo: str, permitir_vacio=True):
    if valor in (None, ""):
        if permitir_vacio:
            return None
        raise ErrorFabrica(f"Falta {campo}.")
    try:
        n = float(valor)
    except (TypeError, ValueError):
        raise ErrorFabrica(f"{campo}: escribe solo un número.")
    if n < 0:
        raise ErrorFabrica(f"{campo} no puede ser negativo.")
    return round(n, 2)


def _fecha(valor, campo: str, permitir_vacio=True):
    if valor in (None, ""):
        if permitir_vacio:
            return None
        raise ErrorFabrica(f"Falta {campo}.")
    try:
        return datetime.strptime(str(valor), "%Y-%m-%d").date().isoformat()
    except ValueError:
        raise ErrorFabrica(f"{campo}: usa el formato AAAA-MM-DD.")


# ---------------------------------------------------------------- planes y precios

def leer_planes() -> dict:
    return _leer(carpeta_negocio() / "planes.json", PLANES_INICIALES)


def guardar_planes(datos: dict) -> dict:
    ref = datos.get("dominio_referencia", {})
    limpio = {
        "moneda": (datos.get("moneda") or "USD").strip()[:6],
        "nota": PLANES_INICIALES["nota"],
        "dominio_referencia": {
            "extension": str(ref.get("extension") or ".com")[:20],
            "primer_anio": _num(ref.get("primer_anio"), "Precio del dominio el primer año"),
            "renovacion_anual": _num(ref.get("renovacion_anual"), "Renovación anual del dominio"),
            "fuente": str(ref.get("fuente") or "")[:300],
            "margen_pct": _num(ref.get("margen_pct"), "Margen sobre el dominio") or 0,
        },
        "planes": [],
    }
    ids = set()
    for p in datos.get("planes", []):
        nombre = str(p.get("nombre") or "").strip()
        if not nombre:
            continue
        pid = "".join(c for c in nombre.lower() if c.isalnum()) or f"plan{len(ids) + 1}"
        while pid in ids:
            pid += "x"
        ids.add(pid)
        limpio["planes"].append({
            "id": p.get("id") or pid, "nombre": nombre[:60],
            "valor_pagina": _num(p.get("valor_pagina"), f"Valor de la página ({nombre})"),
            "mensualidad": _num(p.get("mensualidad"), f"Mensualidad ({nombre})"),
            "incluye_dominio": bool(p.get("incluye_dominio")),
            "descripcion": str(p.get("descripcion") or "")[:300],
        })
    _guardar(carpeta_negocio() / "planes.json", limpio)
    return limpio


def precio_dominio(planes: dict) -> dict:
    ref = planes["dominio_referencia"]
    factor = 1 + (ref.get("margen_pct") or 0) / 100
    calc = lambda v: round(v * factor, 2) if v is not None else None
    return {"primer_anio": calc(ref.get("primer_anio")), "renovacion_anual": calc(ref.get("renovacion_anual"))}


def cotizar(planes: dict) -> list[dict]:
    """Precio por plan = valor de la página + dominio (+ 12 mensualidades si las hay)."""
    dom = precio_dominio(planes)
    filas = []
    for p in planes["planes"]:
        dominio = dom["primer_anio"] if p["incluye_dominio"] else 0
        faltan = [n for n, v in (("valor de la página", p["valor_pagina"]), ("precio del dominio", dominio)) if v is None]
        primer_anio = None if faltan else round(p["valor_pagina"] + dominio + (p["mensualidad"] or 0) * 12, 2)
        renovacion = None
        if p["incluye_dominio"] and dom["renovacion_anual"] is None:
            faltan.append("renovación del dominio")
        else:
            renovacion = round((dom["renovacion_anual"] if p["incluye_dominio"] else 0) + (p["mensualidad"] or 0) * 12, 2)
        filas.append({**p, "dominio_primer_anio": dominio, "total_primer_anio": primer_anio,
                      "total_anios_siguientes": renovacion, "faltan": faltan})
    return filas


# ---------------------------------------------------------------- datos comerciales del cliente

NEGOCIO_CLIENTE = {"plan": None, "suscripcion": {"estado": "sin suscripción", "inicio": None},
                   "dominio": {"nombre": "", "proveedor": "Hostinger", "vence": None, "estado": "no aplica", "monto": None, "notas": "", "historial": []},
                   "ventas": []}


def leer_negocio_cliente(slug: str) -> dict:
    leer_estado(slug)  # valida que el cliente exista
    return _leer(ruta_cliente(slug) / "negocio.json", NEGOCIO_CLIENTE)


def actualizar_dominio(slug: str, datos: dict) -> dict:
    neg = leer_negocio_cliente(slug)
    estado = datos.get("estado", "no aplica")
    if estado not in ESTADOS_DOMINIO:
        raise ErrorFabrica(f"Estado de renovación no válido. Usa: {', '.join(ESTADOS_DOMINIO)}")
    anterior = neg["dominio"].get("estado")
    nuevo = {
        "nombre": str(datos.get("nombre") or "").strip()[:120],
        "proveedor": str(datos.get("proveedor") or "Hostinger").strip()[:60],
        "vence": _fecha(datos.get("vence"), "Fecha de vencimiento"),
        "estado": estado,
        "monto": _num(datos.get("monto"), "Monto de la renovación"),
        "notas": str(datos.get("notas") or "").strip()[:500],
        "historial": neg["dominio"].get("historial", []),
    }
    if estado != anterior or nuevo["vence"] != neg["dominio"].get("vence"):
        nuevo["historial"].append({"fecha": ahora(), "estado": estado, "vence": nuevo["vence"]})
    neg["dominio"] = nuevo
    _guardar(ruta_cliente(slug) / "negocio.json", neg)
    registrar_historial(slug, f"Dominio {nuevo['nombre'] or '(sin nombre)'}: renovación {estado}, vence {nuevo['vence'] or 'sin fecha'}.")
    return neg


def actualizar_suscripcion(slug: str, datos: dict) -> dict:
    neg = leer_negocio_cliente(slug)
    planes = {p["id"] for p in leer_planes()["planes"]}
    plan = datos.get("plan") or None
    if plan and plan not in planes:
        raise ErrorFabrica("Ese plan no existe. Créalo primero en Negocio → Planes y precios.")
    estado = datos.get("estado", "sin suscripción")
    if estado not in ESTADOS_SUSCRIPCION:
        raise ErrorFabrica(f"Estado de suscripción no válido. Usa: {', '.join(ESTADOS_SUSCRIPCION)}")
    neg["plan"] = plan
    neg["suscripcion"] = {"estado": estado, "inicio": _fecha(datos.get("inicio"), "Fecha de inicio")}
    _guardar(ruta_cliente(slug) / "negocio.json", neg)
    registrar_historial(slug, f"Plan {plan or 'ninguno'}, suscripción {estado}.")
    return neg


def registrar_venta(slug: str, datos: dict) -> dict:
    neg = leer_negocio_cliente(slug)
    concepto = datos.get("concepto")
    if concepto not in CONCEPTOS_VENTA:
        raise ErrorFabrica(f"Concepto no válido. Usa: {', '.join(CONCEPTOS_VENTA)}")
    estado = datos.get("estado", "pagado")
    if estado not in ESTADOS_PAGO:
        raise ErrorFabrica("El estado del pago debe ser pagado o pendiente.")
    venta = {"fecha": _fecha(datos.get("fecha"), "Fecha", permitir_vacio=False), "concepto": concepto,
             "monto": _num(datos.get("monto"), "Monto", permitir_vacio=False), "estado": estado,
             "nota": str(datos.get("nota") or "").strip()[:200]}
    neg["ventas"].append(venta)
    _guardar(ruta_cliente(slug) / "negocio.json", neg)
    registrar_historial(slug, f"Venta registrada: {concepto} {venta['monto']} ({estado}).")
    return neg


# ---------------------------------------------------------------- costos del negocio

def leer_costos() -> list[dict]:
    return _leer(carpeta_negocio() / "costos.json", [])


def registrar_costo(datos: dict) -> list[dict]:
    frecuencia = datos.get("frecuencia", "una vez")
    if frecuencia not in ("una vez", "mensual", "anual"):
        raise ErrorFabrica("Frecuencia: una vez, mensual o anual.")
    concepto = str(datos.get("concepto") or "").strip()
    if not concepto:
        raise ErrorFabrica("Escribe el concepto del costo (ej. plan de Hostinger).")
    costos = leer_costos()
    costos.append({"fecha": _fecha(datos.get("fecha"), "Fecha", permitir_vacio=False), "concepto": concepto[:120],
                   "monto": _num(datos.get("monto"), "Monto", permitir_vacio=False), "frecuencia": frecuencia})
    _guardar(carpeta_negocio() / "costos.json", costos)
    return costos


# ---------------------------------------------------------------- métricas

def metricas(hoy: date | None = None) -> dict:
    hoy = hoy or date.today()
    planes = {p["id"]: p for p in leer_planes()["planes"]}
    clientes = []
    for e in listar_proyectos():
        neg = leer_negocio_cliente(e["slug"])
        clientes.append((e, neg))

    ventas = [(e["slug"], v) for e, n in clientes for v in n["ventas"]]
    cobrado = sum(v["monto"] for _, v in ventas if v["estado"] == "pagado")
    por_cobrar = sum(v["monto"] for _, v in ventas if v["estado"] == "pendiente")
    activos = [(e, n) for e, n in clientes if n["suscripcion"]["estado"] == "activa"]
    mrr = sum((planes.get(n["plan"], {}).get("mensualidad") or 0) for _, n in activos)
    sin_precio = [e["slug"] for e, n in activos if not (planes.get(n["plan"], {}).get("mensualidad"))]

    costos = leer_costos()
    costo_total = sum(c["monto"] for c in costos)
    costo_mensual = sum(c["monto"] for c in costos if c["frecuencia"] == "mensual") + sum(c["monto"] / 12 for c in costos if c["frecuencia"] == "anual")

    meses = []
    for i in range(11, -1, -1):
        y, m = hoy.year, hoy.month - i
        while m <= 0:
            m += 12
            y -= 1
        clave = f"{y:04d}-{m:02d}"
        ingreso = sum(v["monto"] for _, v in ventas if v["estado"] == "pagado" and v["fecha"].startswith(clave))
        gasto = sum(c["monto"] for c in costos if c["fecha"].startswith(clave))
        nuevos = sum(1 for e, _ in clientes if str(e.get("creado", "")).startswith(clave))
        meses.append({"mes": clave, "ingresos": round(ingreso, 2), "costos": round(gasto, 2), "clientes_nuevos": nuevos})

    dominios = []
    for e, n in clientes:
        d = n["dominio"]
        if d.get("estado") == "no aplica" and not d.get("vence"):
            continue
        dias = (date.fromisoformat(d["vence"]) - hoy).days if d.get("vence") else None
        alerta = d.get("estado") == "pendiente" and (dias is None or dias <= 30)
        dominios.append({"slug": e["slug"], "cliente": e["nombre"], "dominio": d.get("nombre"), "vence": d.get("vence"),
                         "dias": dias, "estado": d.get("estado"), "alerta": alerta or (dias is not None and dias < 0)})
    dominios.sort(key=lambda x: (x["dias"] is None, x["dias"] if x["dias"] is not None else 0))

    promedio = (mrr / len(activos)) if activos and mrr else None
    equilibrio = math.ceil(costo_mensual / promedio) if promedio and costo_mensual else None
    return {
        "moneda": leer_planes()["moneda"],
        "clientes_total": len(clientes),
        "clientes_demo": sum(1 for e, _ in clientes if e.get("demo")),
        "clientes_activos": len(activos),
        "publicados": sum(1 for e, _ in clientes if e.get("etapa") in ("publicado", "guardado")),
        "cobrado": round(cobrado, 2),
        "por_cobrar": round(por_cobrar, 2),
        "mrr": round(mrr, 2),
        "activos_sin_mensualidad": sin_precio,
        "costo_total": round(costo_total, 2),
        "costo_mensual_recurrente": round(costo_mensual, 2),
        "resultado": round(cobrado - costo_total, 2),
        "clientes_para_equilibrio": equilibrio,
        "cubre_costos_mensuales": (mrr >= costo_mensual) if costo_mensual else None,
        "meses": meses,
        "dominios": dominios,
        "ventas_recientes": sorted(({"slug": s, **v} for s, v in ventas), key=lambda v: v["fecha"], reverse=True)[:15],
    }
