"""SIGNATURE STUDIO — interfaz local de FÁBRICA WEB SIGNATURE.

Servidor solo en 127.0.0.1 (nadie fuera de este equipo puede entrar).
Todo lo que hace lo hace de verdad a través del motor de core/:
crear y editar briefs, listar clientes, ver estado, servir vistas previas,
ejecutar el QA automático, registrar cambios y preparar producción.
Lo que necesita a Claude (diseñar y programar la web) queda escrito como
orden de trabajo y se indica así en la interfaz.
"""
from __future__ import annotations

import hmac
import json
import mimetypes
import secrets
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "core"))
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import deploy  # noqa: E402
import proyectos as P  # noqa: E402
import qa as Q  # noqa: E402
import similitud as S  # noqa: E402
import negocio as N  # noqa: E402
import motor as M  # noqa: E402
import navegador as NAV  # noqa: E402
import tipografia as TIPO  # noqa: E402

_DIAGNOSTICO = {"t": 0, "datos": None}


def diagnostico_motor(forzar: bool = False) -> dict:
    """Estado de Claude Code y del navegador (se guarda 60 s: consultar no gasta tokens, pero tarda)."""
    import time
    if forzar or not _DIAGNOSTICO["datos"] or time.time() - _DIAGNOSTICO["t"] > 60:
        _DIAGNOSTICO.update(t=time.time(), datos=M.diagnostico_claude())
    return {**_DIAGNOSTICO["datos"], "costo_generar": M.estimacion_costo("generar"), "costo_modificar": M.estimacion_costo("modificar"),
            "modos": {m: {"descripcion": d, "costo": M.estimacion_costo("generar", modo=m)} for m, d in M.MODOS.items()},
            "en_uso": M.bloqueo_actual()}

ESTATICOS = Path(__file__).resolve().parent / "static"
PUERTO = 4100
TEXTO_LEGIBLE = {".md", ".json", ".txt", ".css", ".js", ".html", ".xml"}
COOKIE = "studio_llave"
SIN_LLAVE = """<!doctype html><html lang="es"><meta charset="utf-8"><title>Signature Studio</title>
<body style="font:16px system-ui;padding:40px;max-width:560px">
<h1>Signature Studio está protegido</h1><p>Ábrelo con doble clic en <b>Abrir-Signature-Studio.cmd</b>.
Si ya está abierto, usa el enlace que aparece en su ventana negra.</p></body></html>"""


def dentro_de(base: Path, relativo: str) -> Path | None:
    """Resuelve una ruta impidiendo salir de la carpeta base."""
    destino = (base / relativo).resolve()
    try:
        destino.relative_to(base.resolve())
    except ValueError:
        return None
    return destino


class Manejador(BaseHTTPRequestHandler):
    server_version = "SignatureStudio/1.1"
    # Llave de acceso nueva cada vez que se abre Studio: otras personas u otros
    # programas del equipo no pueden leer ni cambiar datos sin ella.
    LLAVE = secrets.token_urlsafe(24)

    def log_message(self, formato, *args):
        pass

    # ------------------------------------------------------------ respuestas
    def _json(self, datos, codigo=200):
        cuerpo = json.dumps(datos, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(cuerpo)

    def _html(self, texto: str, codigo=200):
        cuerpo = texto.encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def _archivo(self, ruta: Path):
        if not ruta or not ruta.is_file():
            return self._json({"error": "No encontrado"}, 404)
        tipo = mimetypes.guess_type(ruta.name)[0] or "application/octet-stream"
        if tipo.startswith("text/") or tipo in ("application/javascript", "application/json"):
            tipo += "; charset=utf-8"
        datos = ruta.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(datos)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(datos)

    def _cuerpo(self) -> dict:
        largo = int(self.headers.get("Content-Length") or 0)
        if largo > 2_000_000:
            raise P.ErrorFabrica("Solicitud demasiado grande.")
        return json.loads(self.rfile.read(largo) or b"{}")

    def _autorizado(self) -> bool:
        for parte in (self.headers.get("Cookie") or "").split(";"):
            nombre, _, valor = parte.strip().partition("=")
            if nombre == COOKIE and hmac.compare_digest(valor, self.LLAVE):
                return True
        return False

    def _mismo_origen(self) -> bool:
        """Protege las acciones POST de páginas de otros sitios."""
        origen = self.headers.get("Origin")
        return origen is None or origen in (f"http://127.0.0.1:{self.server.server_port}", f"http://localhost:{self.server.server_port}")

    # ------------------------------------------------------------ GET
    def do_GET(self):
        url = urlparse(self.path)
        ruta = unquote(url.path)
        if ruta == "/entrar":
            llave = dict(p.partition("=")[::2] for p in url.query.split("&") if p).get("llave", "")
            if not hmac.compare_digest(llave, self.LLAVE):
                return self._html(SIN_LLAVE, 403)
            self.send_response(302)
            self.send_header("Set-Cookie", f"{COOKIE}={self.LLAVE}; HttpOnly; SameSite=Strict; Path=/")
            self.send_header("Location", "/")
            self.end_headers()
            return
        if not self._autorizado():
            if ruta in ("/", "/index.html"):
                return self._html(SIN_LLAVE, 401)
            return self._json({"error": "Acceso no autorizado. Abre Studio con Abrir-Signature-Studio.cmd."}, 401)
        try:
            if ruta in ("/", "/index.html"):
                return self._archivo(ESTATICOS / "index.html")
            if ruta.startswith("/static/"):
                return self._archivo(dentro_de(ESTATICOS, ruta[len("/static/"):]))
            if ruta == "/api/esquema":
                return self._json(P.cargar_esquema())
            if ruta == "/api/clientes":
                return self._json(P.listar_proyectos())
            if ruta == "/api/motor/diagnostico":
                return self._json(diagnostico_motor("forzar" in url.query))
            if ruta == "/api/fuentes":
                return self._json(TIPO.catalogo())
            if ruta == "/api/negocio":
                planes = N.leer_planes()
                return self._json({"metricas": N.metricas(), "planes": planes, "cotizacion": N.cotizar(planes),
                                   "precio_dominio": N.precio_dominio(planes), "costos": N.leer_costos()})
            partes = ruta.strip("/").split("/")
            if len(partes) >= 3 and partes[:2] == ["api", "clientes"]:
                slug = partes[2]
                carpeta = P.ruta_cliente(slug)
                if len(partes) == 3:
                    return self._json(self._detalle(slug, carpeta))
                if partes[3] == "motor":
                    return self._json(M.estado_para_studio(slug))
                if partes[3] == "publicacion-resumen":
                    return self._json(M.resumen_publicacion(slug))
                if partes[3] == "archivo":
                    rel = "/".join(partes[4:])
                    destino = dentro_de(carpeta, rel)
                    if not destino or destino.suffix.lower() not in TEXTO_LEGIBLE or not destino.is_file():
                        return self._json({"error": "Archivo no disponible"}, 404)
                    return self._json({"ruta": rel, "contenido": destino.read_text(encoding="utf-8", errors="replace")})
            if len(partes) >= 2 and partes[0] == "preview":
                slug = partes[1]
                if not self.path.split("?")[0].endswith("/") and len(partes) == 2:
                    self.send_response(301)
                    self.send_header("Location", f"/preview/{slug}/")
                    self.end_headers()
                    return
                sitio = P.ruta_cliente(slug) / "sitio"
                rel = "/".join(partes[2:]) or "index.html"
                destino = dentro_de(sitio, rel)
                if destino and destino.is_dir():
                    destino = destino / "index.html"
                return self._archivo(destino)
            return self._json({"error": "No encontrado"}, 404)
        except P.ErrorFabrica as e:
            return self._json({"error": str(e)}, 400)

    def _detalle(self, slug: str, carpeta: Path) -> dict:
        estado = P.leer_estado(slug)
        archivos = []
        for p in sorted(carpeta.rglob("*")):
            if p.is_file() and not {"respaldos", "historial", ".git"} & set(p.relative_to(carpeta).parts):
                archivos.append({"ruta": str(p.relative_to(carpeta)).replace("\\", "/"), "kb": round(p.stat().st_size / 1024, 1)})
        cambios = (carpeta / "cambios-solicitados.md")
        identidad = S.leer_identidad(slug)
        return {
            "estado": estado,
            "brief": P.leer_brief(slug),
            "etapas": P.ETAPAS,
            "qa": Q.ultimo_qa(slug),
            "identidad": identidad,
            "tiene_sitio": (carpeta / "sitio" / "index.html").exists(),
            "cambios": cambios.read_text(encoding="utf-8") if cambios.exists() else "",
            "archivos": archivos[:400],
            "carpeta": str(carpeta),
            "negocio": N.leer_negocio_cliente(slug),
            "planes": N.leer_planes()["planes"],
        }

    # ------------------------------------------------------------ POST
    def do_POST(self):
        partes = unquote(urlparse(self.path).path).strip("/").split("/")
        try:
            datos = self._cuerpo()  # se lee siempre, también antes de rechazar
            if not self._mismo_origen():
                return self._json({"error": "Origen no permitido"}, 403)
            if not self._autorizado():
                return self._json({"error": "Acceso no autorizado."}, 401)
            if partes == ["api", "negocio", "planes"]:
                return self._json(N.guardar_planes(datos))
            if partes == ["api", "negocio", "costos"]:
                return self._json(N.registrar_costo(datos))
            if partes == ["api", "clientes"]:
                slug = P.crear_proyecto(datos.get("brief", {}), datos.get("slug") or None)
                return self._json({"ok": True, "slug": slug}, 201)
            if len(partes) == 5 and partes[:2] == ["api", "clientes"] and partes[3] == "motor":
                slug, accion = partes[2], partes[4]
                if accion == "cancelar":
                    return self._json(M.cancelar(slug, str(datos.get("id", ""))))
                if accion == "reanudar":
                    return self._json(M.reanudar(slug, str(datos.get("id", ""))))
            if len(partes) == 4 and partes[:2] == ["api", "clientes"]:
                slug, accion = partes[2], partes[3]
                if accion == "brief":
                    P.actualizar_brief(slug, datos.get("brief", {}))
                    return self._json({"ok": True})
                if accion == "cambio":
                    P.solicitar_cambio(slug, datos.get("texto", ""))
                    return self._json({"ok": True})
                if accion == "generar":
                    return self._json(M.iniciar(slug, "generar", confirmo_costo=datos.get("confirmo_costo") is True,
                                                revision=datos.get("revision", True) is not False,
                                                modo=str(datos.get("modo") or "completo"), concepto=str(datos.get("concepto") or ""),
                                                rondas=2 if datos.get("rondas") == 2 else 1), 202)
                if accion == "modificar":
                    return self._json(M.iniciar(slug, "modificar", texto=str(datos.get("texto", "")),
                                                confirmo_costo=datos.get("confirmo_costo") is True), 202)
                if accion == "navegador":
                    return self._json(NAV.probar(slug))
                if accion == "imagenes":
                    import imagenes as I
                    reg = I.obtener(slug)
                    return self._json({k: {"estado": v["estado"], "opciones": len(v["candidatos"])} for k, v in reg["imagenes"].items()})
                if accion == "aprobar-preparar":
                    if not any(h["etapa"] == "aprobado" for h in P.leer_estado(slug).get("historial", [])):
                        P.avanzar_etapa(slug, "aprobado", str(datos.get("nota", "")).strip())
                    return self._json(deploy.preparar_produccion(slug, str(datos.get("dominio", "")).strip(), str(datos.get("destino", ""))))
                if accion == "qa":
                    return self._json(Q.ejecutar_qa(slug))
                if accion == "dominio":
                    return self._json(N.actualizar_dominio(slug, datos))
                if accion == "suscripcion":
                    return self._json(N.actualizar_suscripcion(slug, datos))
                if accion == "venta":
                    return self._json(N.registrar_venta(slug, datos))
                if accion == "ficha":
                    return self._json({"ok": True, "ruta": str(deploy.generar_ficha(slug).relative_to(P.ruta_cliente(slug))).replace("\\", "/")})
                if accion == "similitud":
                    return self._json(S.analizar(slug))
                if accion == "aprobar":
                    P.avanzar_etapa(slug, "aprobado", datos.get("nota", ""))
                    return self._json({"ok": True})
                if accion == "preparar":
                    return self._json(deploy.preparar_produccion(slug, datos.get("dominio", ""), datos.get("destino", "")))
            return self._json({"error": "Acción desconocida"}, 404)
        except P.ErrorFabrica as e:
            return self._json({"error": str(e)}, 400)
        except json.JSONDecodeError:
            return self._json({"error": "Datos no válidos"}, 400)


def main():
    import argparse
    ap = argparse.ArgumentParser(description="Signature Studio")
    ap.add_argument("--puerto", type=int, default=PUERTO)
    ap.add_argument("--sin-navegador", action="store_true")
    a = ap.parse_args()
    servidor = ThreadingHTTPServer(("127.0.0.1", a.puerto), Manejador)
    url = f"http://127.0.0.1:{a.puerto}/entrar?llave={Manejador.LLAVE}"
    print("SIGNATURE STUDIO funcionando. Enlace de entrada (válido hasta cerrar esta ventana):")
    print(f"  {url}")
    print("Deja esta ventana abierta mientras lo usas. Ctrl+C para cerrar.")
    if not a.sin_navegador:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nStudio cerrado.")


if __name__ == "__main__":
    main()
