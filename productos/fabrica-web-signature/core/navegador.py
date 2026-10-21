"""Pruebas de navegador reales con Chrome o Edge (sin instalar nada).

Abre el sitio del cliente en un navegador sin ventana (modo headless) y, mediante el
protocolo de depuración de Chrome (CDP), mide en 390, 820 y 1440 px:
  - desbordes horizontales,
  - errores de JavaScript y recursos que no cargan,
  - qué tipografías se aplican de verdad a titulares y textos,
  - capturas de pantalla (qa/capturas/auto-*.png) para la revisión visual de Claude.
Los resultados quedan en qa/navegador.json y el QA los incorpora.
Solo biblioteca estándar de Python.
"""
from __future__ import annotations

import base64
import functools
import http.server
import json
import os
import re
import shutil
import socket
import struct
import subprocess
import tempfile
import threading
import time
import urllib.request
from pathlib import Path

from proyectos import ErrorFabrica, registrar_historial, ruta_cliente

RUTAS_NAVEGADOR = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


def localizar_navegador() -> str | None:
    otro = os.environ.get("FABRICA_NAVEGADOR")
    if otro:
        return otro if Path(otro).exists() else None
    for r in RUTAS_NAVEGADOR:
        if Path(r).exists():
            return r
    for nombre in ("chrome", "msedge", "chromium", "google-chrome"):
        if shutil.which(nombre):
            return shutil.which(nombre)
    return None


# ------------------------------------------------------------------ websocket mínimo

class WS:
    """Cliente WebSocket mínimo (texto, con máscara) suficiente para CDP."""

    def __init__(self, url: str, espera: float = 30):
        m = re.match(r"ws://([^:/]+):(\d+)(/.*)", url)
        if not m:
            raise ErrorFabrica(f"Dirección de depuración no válida: {url}")
        host, puerto, ruta = m.group(1), int(m.group(2)), m.group(3)
        self.s = socket.create_connection((host, puerto), timeout=espera)
        clave = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((f"GET {ruta} HTTP/1.1\r\nHost: {host}:{puerto}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                        f"Sec-WebSocket-Key: {clave}\r\nSec-WebSocket-Version: 13\r\n\r\n").encode())
        cabecera = b""
        while b"\r\n\r\n" not in cabecera:
            trozo = self.s.recv(1)
            if not trozo:
                raise ErrorFabrica("El navegador cerró la conexión de depuración.")
            cabecera += trozo
        if b" 101 " not in cabecera.split(b"\r\n")[0]:
            raise ErrorFabrica("El navegador rechazó la conexión de depuración.")
        self.n = 0
        self.eventos: list[dict] = []

    def _leer(self, n: int) -> bytes:
        datos = b""
        while len(datos) < n:
            trozo = self.s.recv(n - len(datos))
            if not trozo:
                raise ErrorFabrica("Conexión con el navegador interrumpida.")
            datos += trozo
        return datos

    def enviar(self, metodo: str, params: dict | None = None) -> int:
        self.n += 1
        carga = json.dumps({"id": self.n, "method": metodo, "params": params or {}}).encode()
        mascara = os.urandom(4)
        largo = len(carga)
        if largo < 126:
            cab = struct.pack("!BB", 0x81, 0x80 | largo)
        elif largo < 65536:
            cab = struct.pack("!BBH", 0x81, 0x80 | 126, largo)
        else:
            cab = struct.pack("!BBQ", 0x81, 0x80 | 127, largo)
        self.s.sendall(cab + mascara + bytes(b ^ mascara[i % 4] for i, b in enumerate(carga)))
        return self.n

    def recibir(self) -> dict:
        mensaje = b""
        while True:
            b1, b2 = self._leer(2)
            largo = b2 & 0x7F
            if largo == 126:
                largo = struct.unpack("!H", self._leer(2))[0]
            elif largo == 127:
                largo = struct.unpack("!Q", self._leer(8))[0]
            if b2 & 0x80:
                mascara = self._leer(4)
                datos = bytes(b ^ mascara[i % 4] for i, b in enumerate(self._leer(largo)))
            else:
                datos = self._leer(largo)
            op = b1 & 0x0F
            if op == 0x8:
                raise ErrorFabrica("El navegador cerró la sesión.")
            if op in (0x9, 0xA):
                continue
            mensaje += datos
            if b1 & 0x80:
                return json.loads(mensaje.decode("utf-8", errors="replace"))

    def llamar(self, metodo: str, params: dict | None = None, espera: float = 30) -> dict:
        ident = self.enviar(metodo, params)
        limite = time.time() + espera
        while time.time() < limite:
            m = self.recibir()
            if m.get("id") == ident:
                if "error" in m:
                    raise ErrorFabrica(f"{metodo}: {m['error'].get('message')}")
                return m.get("result", {})
            self.eventos.append(m)
        raise ErrorFabrica(f"El navegador no respondió a {metodo}.")

    def esperar_evento(self, metodo: str, espera: float = 20) -> bool:
        limite = time.time() + espera
        if any(e.get("method") == metodo for e in self.eventos):
            return True
        self.s.settimeout(2)
        try:
            while time.time() < limite:
                try:
                    m = self.recibir()
                except socket.timeout:
                    continue
                self.eventos.append(m)
                if m.get("method") == metodo:
                    return True
        finally:
            self.s.settimeout(30)
        return False

    def cerrar(self):
        try:
            self.s.close()
        except OSError:
            pass

# ------------------------------------------------------------------ sesión de navegador reutilizable

class _Servidor(http.server.ThreadingHTTPServer):
    def handle_error(self, request, client_address):
        pass  # el navegador corta conexiones al cerrar: no es un error del sitio


def _servir(sitio: Path):
    manejador = functools.partial(_Silencioso, directory=str(sitio))
    srv = _Servidor(("127.0.0.1", 0), manejador)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


class _Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def _abrir_navegador(ruta: str, perfil: str):
    proc = subprocess.Popen([ruta, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
                             "--remote-debugging-port=0", "--remote-allow-origins=*", f"--user-data-dir={perfil}",
                             "--hide-scrollbars", "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    limite = time.time() + 30
    while time.time() < limite:
        linea = proc.stderr.readline()
        m = re.search(r"DevTools listening on (ws://\S+)", linea or "")
        if m:
            threading.Thread(target=lambda: [None for _ in proc.stderr], daemon=True).start()
            return proc, m.group(1)
        if proc.poll() is not None:
            break
    proc.kill()
    raise ErrorFabrica("No se pudo abrir el navegador en modo de pruebas.")


class Sesion:
    """Chrome/Edge sin ventana + servidor local de una carpeta. Uso: with Sesion(carpeta) as s: ..."""

    def __init__(self, carpeta: Path):
        self.carpeta = Path(carpeta)
        self.ruta = localizar_navegador()
        if not self.ruta:
            raise ErrorFabrica("No encontré Chrome ni Edge en este equipo para las pruebas de navegador.")
        self.ws = None
        self.proc = None
        self.srv = None

    def __enter__(self):
        self.srv = _servir(self.carpeta)
        self.base = f"http://127.0.0.1:{self.srv.server_port}/"
        self.perfil = tempfile.mkdtemp(prefix="fws-nav-")
        try:
            self.proc, ws_navegador = _abrir_navegador(self.ruta, self.perfil)
            puerto = re.search(r":(\d+)/", ws_navegador).group(1)
            with urllib.request.urlopen(urllib.request.Request(f"http://127.0.0.1:{puerto}/json/new?about:blank", method="PUT"), timeout=15) as r:
                pagina = json.loads(r.read())
            self.ws = WS(pagina["webSocketDebuggerUrl"])
            for dominio in ("Page", "Runtime", "Network", "Log"):
                self.ws.llamar(f"{dominio}.enable")
        except Exception:
            self.__exit__(None, None, None)
            raise
        return self

    def __exit__(self, *_):
        if self.ws:
            self.ws.cerrar()
        if self.proc:
            self.proc.kill()
            try:
                self.proc.wait(timeout=15)
            except subprocess.TimeoutExpired:
                pass
            self.proc.stderr.close()
        if self.srv:
            self.srv.shutdown()
            self.srv.server_close()
        shutil.rmtree(self.perfil, ignore_errors=True)

    def tamano(self, ancho: int, alto: int, movil: bool | None = None):
        self.ws.llamar("Emulation.setDeviceMetricsOverride", {"width": ancho, "height": alto, "deviceScaleFactor": 1,
                                                              "mobile": ancho < 700 if movil is None else movil})

    def movimiento_reducido(self, activo: bool):
        self.ws.llamar("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "reduce" if activo else ""}]})

    def abrir(self, ruta_rel: str = "", espera: float = 1.5):
        self.ws.eventos.clear()
        self.ws.llamar("Page.navigate", {"url": self.base + ruta_rel})
        self.ws.esperar_evento("Page.loadEventFired", 25)
        time.sleep(espera)

    def evaluar(self, js: str, espera: float = 60):
        r = self.ws.llamar("Runtime.evaluate", {"expression": js, "returnByValue": True, "awaitPromise": True}, espera=espera)
        if r.get("exceptionDetails"):
            raise ErrorFabrica("Error al evaluar en el navegador: " + str(r["exceptionDetails"].get("text", ""))[:200])
        return r.get("result", {}).get("value")

    def recorrer(self):
        """Baja por toda la página para que se disparen las apariciones y vuelve arriba."""
        self.evaluar("""(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
          const h = document.documentElement.scrollHeight, paso = Math.max(300, innerHeight * 0.6);
          for (let y = 0; y < h; y += paso) { scrollTo(0, y); await w(120); }
          scrollTo(0, h); await w(900); scrollTo(0, 0); await w(500);
          return true; })()""")

    def capturar(self, destino: Path, completa: bool = False, recorte: dict | None = None, max_alto: int = 9000):
        params = {"format": "png"}
        if completa or recorte:
            # Los elementos fijos (cabecera, botón de WhatsApp) se repetirían en mitad de la captura:
            # se ocultan solo durante la captura larga y se restauran después.
            self.evaluar("""(() => { document.querySelectorAll('body *').forEach(e => { const p = getComputedStyle(e).position;
              if (p === 'fixed' || (p === 'sticky' && e.parentElement === document.body)) { e.dataset.fwsOculto = e.style.visibility || '-'; e.style.visibility = 'hidden'; } }); return 1; })()""")
            if recorte:
                clip = recorte
            else:
                ancho = self.evaluar("document.documentElement.clientWidth")
                alto = min(max_alto, self.evaluar("document.documentElement.scrollHeight"))
                clip = {"x": 0, "y": 0, "width": ancho, "height": alto}
            params.update(captureBeyondViewport=True, clip={**clip, "scale": 1})
        datos = self.ws.llamar("Page.captureScreenshot", params, espera=60)["data"]
        if completa or recorte:
            self.evaluar("""(() => { document.querySelectorAll('[data-fws-oculto]').forEach(e => {
              e.style.visibility = e.dataset.fwsOculto === '-' ? '' : e.dataset.fwsOculto; delete e.dataset.fwsOculto; }); return 1; })()""")
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(base64.b64decode(datos))
        return destino


# ------------------------------------------------------------------ pruebas de un sitio

TAMANOS = [("movil", 390, 844), ("tableta", 820, 1180), ("escritorio", 1440, 900)]
MAX_PAGINAS = 8
MAX_SECCIONES = 12

EVALUAR = r"""(() => {
  const fam = el => el ? getComputedStyle(el).fontFamily : '';
  const h = document.querySelector('h1');
  const p = document.querySelector('main p, p');
  return JSON.stringify({
    ancho: document.documentElement.scrollWidth, vista: window.innerWidth, alto: document.documentElement.scrollHeight,
    h1: fam(h), texto: fam(p), titulo: document.title,
    cargadas: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/["']/g, '')),
    imgsRotas: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && !/\.svg/.test(i.src)).map(i => i.getAttribute('src')).slice(0, 5)
  });
})()"""

# Métricas visuales medidas (no opiniones): contraste real de textos, objetivos táctiles, imágenes,
# ritmo de secciones y elementos que siguen ocultos.
OCULTO_JS = r"""const esOculto = el => {
    if (el.closest('[aria-hidden="true"],[hidden],dialog,[role=dialog],[inert],nav,header,[data-menu]')) return false;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (!(r.width > 40 && r.height > 16 && +cs.opacity === 0 && el.textContent.trim().length > 8)) return false;
    return !el.parentElement || +getComputedStyle(el.parentElement).opacity !== 0; };"""

METRICAS = r"""(() => { """ + OCULTO_JS + r"""
  const lum = c => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r,g,b,a] = m.map(Number);
    if (a !== undefined && a < 0.95) return null;
    const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const fondo = el => { let e = el; while (e) { const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none') return null;
      const l = lum(cs.backgroundColor); if (l !== null) return l; e = e.parentElement; }
    return lum(getComputedStyle(document.body).backgroundColor) ?? 1; };
  const fallos = [], vistos = new Set(); let medidos = 0;
  document.querySelectorAll('h1,h2,h3,h4,p,li,a,button,label,span,small,figcaption,blockquote,dd,dt,td,th').forEach(el => {
    if (medidos > 500) return;
    const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
    if (!txt) return; const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) return;
    const lt = lum(cs.color), lf = fondo(el); if (lt === null || lf === null) return;
    medidos++;
    const ratio = (Math.max(lt, lf) + 0.05) / (Math.min(lt, lf) + 0.05);
    const tam = parseFloat(cs.fontSize), negrita = +cs.fontWeight >= 700;
    const minimo = (tam >= 24 || (tam >= 18.66 && negrita)) ? 3 : 4.5;
    if (ratio < minimo) { const k = txt.slice(0, 40); if (!vistos.has(k)) { vistos.add(k); fallos.push('«' + k + '» ' + ratio.toFixed(2) + ':1 (mín. ' + minimo + ')'); } }
  });
  const pequenos = [...document.querySelectorAll('a[href],button,input,select,textarea,[role=button]')].filter(el => {
    const r = el.getBoundingClientRect(); return r.width && r.height && (r.width < 24 || r.height < 24) && getComputedStyle(el).display !== 'inline';
  }).map(el => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30)).slice(0, 8);
  const imgs = [...document.images].filter(i => !/\.svg(\?|$)/.test(i.currentSrc || i.src));
  const sinDimensiones = imgs.filter(i => !i.getAttribute('width') && !i.getAttribute('height') && getComputedStyle(i).aspectRatio === 'auto').length;
  const pesadas = performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img' && r.transferSize > 400000).map(r => r.name.split('/').pop());
  const ocultos = [...document.querySelectorAll('main *, body > section *')].filter(esOculto).length;
  const secciones = [...document.querySelectorAll('main > section, body > section, main > div > section, [data-seccion], body > footer')]
    .map(s => { const r = s.getBoundingClientRect(); return { x: 0, y: Math.round(r.top + scrollY), width: document.documentElement.clientWidth, height: Math.round(r.height),
      fondo: getComputedStyle(s).backgroundColor, id: s.id || String(s.className).split(' ')[0] || s.tagName.toLowerCase() }; })
    .filter(s => s.height > 120);
  return JSON.stringify({ contraste_medidos: medidos, contraste_fallos: fallos.slice(0, 12), objetivos_pequenos: pequenos,
    imagenes_bitmap: imgs.length, imagenes_sin_dimensiones: sinDimensiones, imagenes_pesadas: pesadas, ocultos_tras_recorrer: ocultos,
    secciones: secciones, fondos_distintos: new Set(secciones.map(s => s.fondo)).size,
    peso_kb: Math.round(performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0) / 1024) });
})()"""

OCULTOS_REDUCIDO = r"""(() => { """ + OCULTO_JS + r""" return JSON.stringify({
  ocultos: [...document.querySelectorAll('main *, body > section *')].filter(esOculto).length,
  animaciones: document.getAnimations().filter(a => a.playState === 'running' && ((a.effect && a.effect.getTiming().duration) || 0) > 50).length
}); })()"""


def _r(id_, nombre, ok, detalle="", severidad="critica"):
    return {"id": id_, "prueba": nombre, "estado": "aprobada" if ok else "fallida",
            "severidad": "" if ok else severidad, "detalle": detalle}


def _paginas(sitio: Path) -> list[str]:
    paginas = ["index.html"] + sorted(p.name for p in sitio.glob("*.html") if p.name != "index.html")
    return [p for p in paginas if (sitio / p).exists()][:MAX_PAGINAS]


def _leer_eventos(ws, base, errores_js, fallos_red):
    for e in ws.eventos:
        m, p = e.get("method"), e.get("params", {})
        if m == "Runtime.exceptionThrown":
            d = p.get("exceptionDetails", {})
            errores_js.append((d.get("exception", {}) or {}).get("description") or d.get("text", "error"))
        elif m == "Runtime.consoleAPICalled" and p.get("type") == "error":
            errores_js.append(" ".join(str(a.get("value", a.get("description", ""))) for a in p.get("args", [])))
        elif m == "Network.responseReceived" and p.get("response", {}).get("status", 200) >= 400 and p["response"]["url"].startswith(base) \
                and not p["response"]["url"].endswith("/favicon.ico"):
            fallos_red.append(f"{p['response']['status']} {p['response']['url'][len(base) - 1:]}")
        elif m == "Network.loadingFailed" and not p.get("canceled") and p.get("type") != "Font":
            fallos_red.append(p.get("errorText", "fallo"))


def probar(slug: str, completo: bool = True, destino: Path | None = None) -> dict:
    """Pruebas de navegador del sitio de un cliente → qa/navegador.json y capturas en qa/capturas/.

    completo=True añade: páginas completas de todas las páginas, recortes por sección (escritorio y móvil),
    métricas visuales medidas y la prueba de movimiento reducido. `destino` escribe capturas e informe en
    otra carpeta (auditorías que no deben tocar el proyecto)."""
    carpeta = ruta_cliente(slug)
    sitio = carpeta / "sitio"
    if not (sitio / "index.html").exists():
        raise ErrorFabrica("Este cliente todavía no tiene sitio construido.")
    capturas = Path(destino) if destino else carpeta / "qa" / "capturas"
    capturas.mkdir(parents=True, exist_ok=True)
    for viejo in list(capturas.glob("pagina-*.png")) + list(capturas.glob("seccion-*.png")):
        viejo.unlink(missing_ok=True)  # evita revisar capturas de una versión anterior
    marca_tiempo = time.time()
    medidas, metricas, errores_js, fallos_red, archivos, reducido = {}, {}, [], [], [], {}
    paginas = _paginas(sitio)
    with Sesion(sitio) as s:
        for nombre, ancho, alto in TAMANOS:
            s.tamano(ancho, alto)
            s.abrir("", espera=2.6)  # deja terminar las animaciones de entrada: se evalúa lo que ve el visitante
            medidas[nombre] = json.loads(s.evaluar(EVALUAR) or "{}")
            _leer_eventos(s.ws, s.base, errores_js, fallos_red)
            archivos.append(s.capturar(capturas / f"auto-{nombre}.png"))  # primera pantalla
            if completo and nombre in ("movil", "escritorio"):
                s.recorrer()
                metricas[nombre] = json.loads(s.evaluar(METRICAS) or "{}")
                archivos.append(s.capturar(capturas / f"pagina-index-{nombre}.png", completa=True))
                for i, sec in enumerate(metricas[nombre].get("secciones", [])[:MAX_SECCIONES], 1):
                    recorte = {k: sec[k] for k in ("x", "y", "width", "height")}
                    recorte["height"] = min(recorte["height"], 2200)
                    archivos.append(s.capturar(capturas / f"seccion-{nombre}-{i:02d}.png", recorte=recorte))
        if completo:
            for etiqueta, ancho, alto, max_alto in (("escritorio", 1440, 900, 6000), ("movil", 390, 844, 7000)):
                s.tamano(ancho, alto)
                for pagina in paginas[1:]:
                    s.abrir(pagina, espera=1.0)
                    _leer_eventos(s.ws, s.base, errores_js, fallos_red)
                    s.recorrer()
                    archivos.append(s.capturar(capturas / f"pagina-{Path(pagina).stem}-{etiqueta}.png", completa=True, max_alto=max_alto))
            # movimiento reducido: sin recorrer, todo el contenido debe verse
            s.tamano(1440, 900)
            s.movimiento_reducido(True)
            s.abrir("", espera=1.2)
            reducido = json.loads(s.evaluar(OCULTOS_REDUCIDO) or "{}")
            s.movimiento_reducido(False)

    def rel(p):
        p = Path(p)
        return p.name if destino else str(p.relative_to(carpeta)).replace("\\", "/")
    archivos = [rel(a) for a in archivos]
    resultados = []
    desbordes = [f"{n}: {m['ancho']}px en {m['vista']}px" for n, m in medidas.items() if m.get("ancho", 0) > m.get("vista", 0) + 1]
    resultados.append(_r("desborde", "Sin scroll horizontal en 390, 820 y 1440 px", not desbordes, "; ".join(desbordes)))
    errores_js = sorted(set(errores_js))
    resultados.append(_r("consola", "Errores de JavaScript en consola", not errores_js, " | ".join(errores_js[:5])))
    fallos_red = sorted(set(fallos_red))
    resultados.append(_r("recursos", "Todos los recursos del sitio cargan (sin 404)", not fallos_red, ", ".join(fallos_red[:6]), "advertencia"))
    rotas = sorted({i for m in medidas.values() for i in m.get("imgsRotas", [])})
    resultados.append(_r("imagenes_nav", "Imágenes visibles en el navegador", not rotas, ", ".join(rotas)))
    escritorio = medidas.get("escritorio", {})
    resultados.append(_r("navegador", "Capturas reales para la revisión visual", bool(archivos),
                         f"{len(archivos)} capturas (primera pantalla, páginas completas y secciones). La valoración estética la hace la crítica Signature.", "advertencia"))
    resultados.append({"id": "fuentes_reales", "prueba": "Tipografías aplicadas en el navegador", "estado": "aprobada", "severidad": "",
                       "detalle": f"h1: {escritorio.get('h1', '?')} · texto: {escritorio.get('texto', '?')} · cargadas: {', '.join(sorted(set(escritorio.get('cargadas', []))))[:120] or 'ninguna (¿sin internet?)'}"})
    if completo:
        fallos_c = sorted({f for m in metricas.values() for f in m.get("contraste_fallos", [])})
        medidos = sum(m.get("contraste_medidos", 0) for m in metricas.values())
        resultados.append(_r("contraste", "Contraste de color medido (WCAG AA) en textos reales", not fallos_c,
                             f"{medidos} textos medidos" + ("; fallan: " + "; ".join(fallos_c[:6]) if fallos_c else ""), "advertencia"))
        peq = metricas.get("movil", {}).get("objetivos_pequenos", [])
        resultados.append(_r("tactil", "Objetivos táctiles de al menos 24 px en móvil", not peq, ", ".join(peq), "advertencia"))
        ocultos = metricas.get("escritorio", {}).get("ocultos_tras_recorrer", 0)
        resultados.append(_r("ocultos", "Ningún contenido queda invisible tras recorrer la página", ocultos == 0, f"{ocultos} elementos con texto siguen con opacidad 0", "advertencia"))
        resultados.append(_r("movimiento_reducido", "Con «reducir movimiento» todo el contenido se ve, sin animaciones largas",
                             reducido.get("ocultos", 0) == 0 and reducido.get("animaciones", 0) == 0,
                             f"ocultos: {reducido.get('ocultos', '?')}, animaciones en curso: {reducido.get('animaciones', '?')}"))
        esc = metricas.get("escritorio", {})
        resultados.append(_r("riqueza_visual", "La portada tiene imágenes o recursos visuales además de texto y SVG simples",
                             esc.get("imagenes_bitmap", 0) > 0 or esc.get("fondos_distintos", 0) >= 3,
                             f"{esc.get('imagenes_bitmap', 0)} imágenes de mapa de bits, {esc.get('fondos_distintos', 0)} fondos de sección distintos. "
                             "Una página sin fotografía ni cambios de plano suele verse plana: revisar en la crítica.", "advertencia"))
        sin_dim = metricas.get("escritorio", {}).get("imagenes_sin_dimensiones", 0)
        resultados.append(_r("cls_imagenes", "Imágenes con dimensiones (evita saltos de diseño)", sin_dim == 0, f"{sin_dim} sin width/height ni aspect-ratio", "advertencia"))
        pesadas = metricas.get("escritorio", {}).get("imagenes_pesadas", [])
        resultados.append(_r("peso_imagenes_nav", "Ninguna imagen transferida pesa más de 400 KB", not pesadas, ", ".join(pesadas[:5]), "advertencia"))
    informe = {"slug": slug, "fecha": time.strftime("%Y-%m-%d %H:%M:%S"), "marca_tiempo": marca_tiempo,
               "navegador": Path(localizar_navegador() or "").name, "medidas": medidas, "metricas": metricas,
               "movimiento_reducido": reducido, "paginas": paginas, "capturas": archivos, "resultados": resultados}
    salida = (Path(destino) if destino else carpeta / "qa") / "navegador.json"
    salida.write_text(json.dumps(informe, ensure_ascii=False, indent=2), encoding="utf-8")
    if not destino:
        fallidas = sum(r["estado"] == "fallida" for r in resultados)
        registrar_historial(slug, f"Pruebas de navegador ({informe['navegador']}): {len(resultados) - fallidas} aprobadas, {fallidas} fallidas, {len(archivos)} capturas.")
    return informe


# ------------------------------------------------------------------ utilidades de imagen (sin Pillow)

CONVERTIR = r"""(async (src, anchos, calidad) => {
  const img = new Image(); img.src = src; await img.decode();
  const salida = [];
  const lista = anchos.filter(w => w < img.naturalWidth * 0.98);
  if (img.naturalWidth < Math.max(...anchos)) lista.push(img.naturalWidth);  // la versión más grande es la original
  for (const w of lista) {
    const ancho = Math.min(w, img.naturalWidth), alto = Math.round(img.naturalHeight * ancho / img.naturalWidth);
    const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, ancho, alto);
    let q = calidad, datos = c.toDataURL('image/webp', q).split(',')[1];
    while (datos.length * 0.75 > 380000 && q > 0.5) { q -= 0.06; datos = c.toDataURL('image/webp', q).split(',')[1]; }  // < 380 KB
    salida.push({ ancho: ancho, alto: alto, datos: datos });
  }
  return JSON.stringify({ ancho: img.naturalWidth, alto: img.naturalHeight, salida: salida });
})"""


def convertir_webp(origenes: list[tuple[Path, Path]], anchos=(640, 1280, 1920), calidad: float = 0.76) -> list[dict]:
    """Redimensiona y convierte imágenes a WebP con el propio Chrome (sin instalar nada).
    origenes: [(archivo, prefijo_destino)] → crea {prefijo}-{ancho}.webp."""
    if not origenes:
        return []
    carpeta = Path(tempfile.mkdtemp(prefix="fws-img-"))
    resultados = []
    try:
        for i, (origen, _) in enumerate(origenes):
            shutil.copyfile(origen, carpeta / f"{i}{origen.suffix.lower()}")
        (carpeta / "index.html").write_text("<!doctype html><title>img</title>", encoding="utf-8")
        with Sesion(carpeta) as s:
            s.abrir("index.html", espera=0.2)
            for i, (origen, prefijo) in enumerate(origenes):
                try:
                    datos = json.loads(s.evaluar(f"({CONVERTIR})('{i}{origen.suffix.lower()}', {list(anchos)}, {calidad})", espera=120))
                except (ErrorFabrica, ValueError, TypeError) as e:
                    resultados.append({"origen": str(origen), "error": str(e)})
                    continue
                creados = []
                prefijo.parent.mkdir(parents=True, exist_ok=True)
                for v in datos["salida"]:
                    destino = prefijo.parent / f"{prefijo.name}-{v['ancho']}.webp"
                    destino.write_bytes(base64.b64decode(v["datos"]))
                    creados.append({"archivo": destino, "ancho": v["ancho"], "alto": v["alto"], "kb": round(destino.stat().st_size / 1024)})
                resultados.append({"origen": str(origen), "original": [datos["ancho"], datos["alto"]], "creados": creados})
    finally:
        shutil.rmtree(carpeta, ignore_errors=True)
    return resultados


def capturar_html(html: Path, destino: Path, ancho: int = 1400, alto: int = 900) -> Path:
    """Captura completa de un HTML local (hojas de contacto, comparativas)."""
    with Sesion(html.parent) as s:
        s.tamano(ancho, alto, movil=False)
        s.abrir(html.name, espera=1.5)
        return s.capturar(destino, completa=True, max_alto=12000)
