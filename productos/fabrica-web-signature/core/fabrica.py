"""FÁBRICA WEB SIGNATURE — línea de comandos.

Uso:  python core/fabrica.py <comando> [opciones]
      (en Windows también:  fabrica <comando>  desde la carpeta de la fábrica)

Comandos:
  diagnostico                         Revisa el entorno (Python, Node, git, skill, Hostinger)
  nuevo --brief archivo.json [--slug] Crea un cliente desde un brief
  validar-brief archivo.json          Comprueba un brief sin crear nada
  listar                              Muestra todos los clientes y su etapa
  estado <slug> [etapa --nota "..."]  Muestra o avanza la etapa de un cliente
  iniciar-sitio <slug>                Copia la base técnica (no visual) a sitio/
  cambio <slug> "texto"               Registra un cambio pedido en lenguaje natural
  vista-previa <slug> [--puerto 8080] Sirve el sitio en http://127.0.0.1:<puerto>
  qa <slug>                           Ejecuta el control de calidad automático
  similitud <slug>                    Compara la identidad con proyectos anteriores
  respaldo <slug>                     Copia sitio/ a respaldos/<fecha>
  seo <slug> --dominio https://...    Genera sitemap.xml y robots.txt
  preparar-produccion <slug> --dominio https://... [--destino "..."]
                                      Prueba y empaqueta para Hostinger (NO publica)
  registrar-publicacion <slug> --dominio ... --aprobado "..."
                                      Registra una publicación real ya hecha
  entrega <slug>                      Crea el zip de entrega al cliente
  aprendizaje "lección"               Añade una lección a docs/aprendizaje.md
  instalar-skill [--forzar]           Instala la skill como personal (~/.claude/skills)

Motor automático (Claude Code en modo no interactivo):
  motor-diagnostico                   ¿Claude Code instalado y con sesión? Navegador de pruebas
  conectar-claude                     Inicia sesión de Claude Code (una vez; abre el navegador)
  generar <slug> [--sin-revision] [--si]
                                      Genera la página completa (pide confirmar el consumo)
  aplicar-cambio <slug> "texto" [--si] Aplica un cambio con Claude, prueba y guarda historial
  motor-estado <slug>                 Progreso de la última ejecución del motor
  navegador <slug>                    Pruebas reales en Chrome/Edge (capturas, consola, desbordes)
"""
from __future__ import annotations

import argparse
import functools
import http.server
import json
import os
import platform
import shutil
from datetime import datetime
import socket
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

import deploy
import motor as M
import navegador as NAV
import proyectos as P
import qa as Q
import similitud as S


def cmd_diagnostico(_):
    print("FÁBRICA WEB SIGNATURE — diagnóstico\n")
    print(f"Sistema:      {platform.system()} {platform.release()} ({platform.version()})")
    print(f"Python:       {sys.version.split()[0]}  ({sys.executable})")
    for prog in ("node", "npm", "git", "claude", "curl"):
        ruta = shutil.which(prog)
        version = ""
        if ruta:
            try:
                version = subprocess.run([ruta, "--version"], capture_output=True, text=True, timeout=10).stdout.strip().splitlines()[0]
            except Exception:
                version = "(no respondió)"
        print(f"{prog:<13} {'sí ' + version if ruta else 'no instalado'}")
    print(f"\nCarpeta de la fábrica: {P.RAIZ}")
    print(f"Clientes:              {P.carpeta_clientes()}  ({len(P.listar_proyectos())} proyectos)")
    proyecto = P.RAIZ / ".claude" / "skills" / "fabrica-web-signature" / "SKILL.md"
    personal = Path.home() / ".claude" / "skills" / "fabrica-web-signature" / "SKILL.md"
    print(f"Skill de proyecto:     {'sí' if proyecto.exists() else 'NO'}  ({proyecto})")
    print(f"Skill personal:        {'sí' if personal.exists() else 'no instalada (opcional: instalar-skill)'}")
    plugin = list((Path.home() / ".claude" / "plugins").rglob("fabrica-web-signature")) if (Path.home() / ".claude" / "plugins").exists() else []
    print(f"Plugin antiguo (nube): {'instalado: ' + str(plugin[0]) if plugin else 'no instalado en este equipo'}")
    print("\nHostinger: la conexión se comprueba desde Claude (conector 'Hostinger' en claude.ai o")
    print("'claude mcp add --transport http hostinger https://mcp.hostinger.com'). Ver docs/hostinger.md.")
    if not shutil.which("node"):
        print("\nNota: sin Node.js la fábrica produce sitios estáticos (HTML/CSS/JS), que funcionan en")
        print("cualquier plan de Hostinger. Node solo hace falta para proyectos con framework (Astro/Next).")


def cmd_nuevo(a):
    datos = json.loads(Path(a.brief).read_text(encoding="utf-8"))
    slug = P.crear_proyecto(datos, a.slug)
    print(f"✓ Proyecto creado: clients/{slug}/")
    print(f"  Siguiente paso en Claude Code:  /fabrica-web-signature desarrollar {slug}")


def cmd_validar(a):
    datos = P.normalizar_brief(json.loads(Path(a.archivo).read_text(encoding="utf-8")))
    problemas = P.validar_brief(datos)
    if problemas:
        print("✗ El brief tiene problemas:")
        for p in problemas:
            print("  -", p)
        sys.exit(1)
    print("✓ Brief válido.")


def cmd_listar(_):
    lista = P.listar_proyectos()
    if not lista:
        print("No hay clientes todavía. Crea uno desde Signature Studio o con: nuevo --brief archivo.json")
        return
    print(f"{'Cliente':<34} {'Sector':<22} {'Etapa':<36} Sitio  Publicación")
    for e in lista:
        etapa = P.NOMBRE_ETAPA.get(e["etapa"], e["etapa"])
        demo = " (demo)" if e.get("demo") else ""
        print(f"{(e['slug'] + demo)[:33]:<34} {e.get('sector', '')[:21]:<22} {etapa[:35]:<36} {'sí' if e['tiene_sitio'] else 'no':<6} {e.get('publicacion', {}).get('estado', '')}")


def cmd_estado(a):
    if a.etapa:
        P.avanzar_etapa(a.slug, a.etapa, a.nota or "")
    print((P.ruta_cliente(a.slug) / "ESTADO.md").read_text(encoding="utf-8") if (P.ruta_cliente(a.slug) / "ESTADO.md").exists() else P.estado_a_markdown(P.leer_estado(a.slug)))


def cmd_iniciar_sitio(a):
    copiados = P.iniciar_sitio(a.slug)
    print(f"✓ Base técnica en clients/{a.slug}/sitio/: {', '.join(copiados) or 'ya estaba'}")


def cmd_cambio(a):
    P.solicitar_cambio(a.slug, a.texto)
    print(f"✓ Cambio registrado en clients/{a.slug}/cambios-solicitados.md")


def puerto_libre(preferido: int) -> int:
    for puerto in range(preferido, preferido + 30):
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", puerto)) != 0:
                return puerto
    raise P.ErrorFabrica("No encontré un puerto libre.")


def cmd_vista_previa(a):
    sitio = P.ruta_cliente(a.slug) / "sitio"
    if not (sitio / "index.html").exists():
        raise P.ErrorFabrica("Este cliente todavía no tiene sitio construido.")
    puerto = puerto_libre(a.puerto)
    manejador = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(sitio))
    print(f"Vista previa de {a.slug}: http://127.0.0.1:{puerto}/   (Ctrl+C para detener)")
    P.registrar_historial(a.slug, f"Vista previa local en el puerto {puerto}.")
    http.server.ThreadingHTTPServer(("127.0.0.1", puerto), manejador).serve_forever()


def cmd_qa(a):
    r = Q.ejecutar_qa(a.slug)
    print(Q.qa_a_markdown(r))
    print(f"Guardado en clients/{a.slug}/qa/ULTIMO.md")
    if r["fallidas_criticas"]:
        sys.exit(2)


def cmd_similitud(a):
    r = S.analizar(a.slug)
    if not r["comparaciones"]:
        print("No hay proyectos anteriores con identidad para comparar.")
    for c in r["comparaciones"]:
        print(f"{c['con']:<32} {c['puntuacion']:>3}/100  {c['nivel']:<13} {c['detalle']}")
    print(f"\nVeredicto: {r['veredicto']}  (≥{S.UMBRAL_EXCESIVO} excesiva · ≥{S.UMBRAL_REVISAR} revisar)")


def cmd_respaldo(a):
    print(f"✓ Respaldo: {deploy.respaldar_sitio(a.slug, 'manual')}")


def cmd_seo(a):
    print("✓ Generado:", ", ".join(deploy.generar_seo(a.slug, a.dominio)))


def cmd_preparar(a):
    info = deploy.preparar_produccion(a.slug, a.dominio, a.destino or "")
    print(f"✓ Versión {info['version']} preparada: clients/{a.slug}/entrega/deploy/{info['paquete']}")
    print(f"  Lista de verificación: clients/{a.slug}/entrega/deploy/CHECKLIST-PUBLICACION.md")
    print("  NO se ha publicado nada. Publicar requiere la confirmación explícita de Diego.")


def cmd_registrar_pub(a):
    e = deploy.registrar_publicacion(a.slug, a.dominio, a.aprobado)
    print(f"✓ Registrado: {e['publicacion']['estado']}")


def cmd_entrega(a):
    print(f"✓ Paquete de entrega: {deploy.empaquetar_entrega(a.slug)}")


def cmd_aprendizaje(a):
    archivo = P.RAIZ / "docs" / "aprendizaje.md"
    with archivo.open("a", encoding="utf-8") as f:
        f.write(f"- {P.ahora()} — {a.texto.strip()}\n")
    print("✓ Lección guardada en docs/aprendizaje.md")


def cmd_instalar_skill(a):
    origen = P.RAIZ / ".claude" / "skills" / "fabrica-web-signature"
    destino = Path.home() / ".claude" / "skills" / "fabrica-web-signature"
    if destino.exists() and not a.forzar:
        print(f"Ya existe {destino}. No lo sobrescribo. Usa --forzar para actualizarlo (la copia anterior se guarda en ~/.claude/skills-respaldo).")
        return
    if destino.exists():
        # La copia anterior va fuera de skills/: dentro, Claude Code la cargaría como una segunda skill.
        # Cada copia anterior se guarda con fecha: no se borra ningún respaldo (un archivo bloqueado no rompe la instalación).
        anterior = Path.home() / ".claude" / "skills-respaldo" / f"fabrica-web-signature.{datetime.now():%Y%m%d-%H%M%S}"
        anterior.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(destino, anterior)
        # Claude Code puede tener la carpeta abierta: se reemplazan los archivos en lugar de borrar la carpeta.
        for viejo in sorted(destino.rglob("*"), reverse=True):
            if viejo.is_file():
                viejo.unlink()
    vieja = destino.with_name("fabrica-web-signature.anterior")
    if vieja.exists():
        respaldo = Path.home() / ".claude" / "skills-respaldo" / "fabrica-web-signature.anterior-2"
        respaldo.parent.mkdir(parents=True, exist_ok=True)
        if respaldo.exists():
            shutil.rmtree(respaldo)
        shutil.move(str(vieja), str(respaldo))
    shutil.copytree(origen, destino, dirs_exist_ok=True)
    skill = destino / "SKILL.md"
    skill.write_text(skill.read_text(encoding="utf-8").replace("{{RUTA_FABRICA}}", str(P.RAIZ)), encoding="utf-8")
    print(f"✓ Skill personal instalada en {destino}")
    print("  Ahora /fabrica-web-signature funciona en Claude Code desde cualquier carpeta de este equipo.")


def _confirmar_costo(a, tipo) -> bool:
    print(M.estimacion_costo(tipo, not getattr(a, "sin_revision", False), getattr(a, "modo", None))["texto"])
    if a.si:
        return True
    return input("¿Continuar? Escribe si: ").strip().lower() in ("si", "sí", "s")


def cmd_motor_diagnostico(_):
    d = M.diagnostico_claude()
    print(f"Claude Code:  {'sí ' + d['version'] if d['encontrado'] else 'no encontrado'}  ({d['ruta']})")
    print(f"Sesión:       {'iniciada (' + d['metodo'] + ')' if d['sesion'] else 'sin iniciar'}")
    print(f"Navegador:    {d['navegador'] or 'no encontrado'}")
    if d["mensaje"]:
        print("\n" + d["mensaje"])


def cmd_conectar_claude(_):
    cmd = M.localizar_claude()
    if not cmd:
        raise P.ErrorFabrica("No encontré Claude Code. Instala la app de escritorio de Claude.")
    print("Abriendo el inicio de sesión de Claude Code (sigue los pasos en tu navegador)…")
    subprocess.run(cmd + ["auth", "login"])
    cmd_motor_diagnostico(None)


def _seguir(slug, ident):
    vistos = 0
    while True:
        e = M.leer_ejecucion(slug, ident)
        registro = M.carpeta_motor(slug) / ident / "registro.txt"
        lineas = registro.read_text(encoding="utf-8", errors="replace").splitlines() if registro.exists() else []
        for linea in lineas[vistos:]:
            print(linea)
        vistos = len(lineas)
        if e["estado"] != "en_curso":
            print(f"\n{e['estado'].upper()}: {e['mensaje']}")
            return
        import time
        time.sleep(2)


def cmd_generar(a):
    if not _confirmar_costo(a, "generar"):
        return print("Cancelado.")
    e = M.iniciar(a.slug, "generar", confirmo_costo=True, revision=not a.sin_revision, modo=a.modo,
                  concepto=getattr(a, "concepto", "") or "", rondas=a.rondas)
    print(f"✓ Generación {e['id']} ({e['modo']}) iniciada. Puedes cerrar esta ventana: el trabajo sigue (míralo en Studio → Generación).")
    _seguir(a.slug, e["id"])


def cmd_aplicar_cambio(a):
    if not _confirmar_costo(a, "modificar"):
        return print("Cancelado.")
    e = M.iniciar(a.slug, "modificar", texto=a.texto, confirmo_costo=True)
    print(f"✓ Modificación {e['id']} iniciada.")
    _seguir(a.slug, e["id"])


def cmd_motor_estado(a):
    m = M.estado_para_studio(a.slug)
    e = m["ultima"]
    if not e:
        return print("Este cliente no tiene ejecuciones del motor.")
    print(f"{e['tipo']} {e['id']} — {e['estado']}: {e['mensaje']}")
    for x in e["etapas"]:
        print(f"  {dict(hecho='✓', en_curso='●', error='✗', incompleto='!', omitido='–').get(x['estado'], '·')} {x['nombre']}  {x['detalle']}")


def cmd_kit(a):
    import direccion as D
    k = D.preparar_kit(a.slug)
    print(f"✓ Kit de dirección en clients/{a.slug}/diseno/kit-direccion.md")
    for p in k["paletas"]["propuestas"]:
        print(f"  Paleta {p['nombre']}: {'cumple AA' if p['cumple_aa'] else 'NO cumple AA'} · CTA {p['cta']['fondo']} / {p['cta']['texto']}")
    for t in k["tipografia"]["propuestas"]:
        print(f"  Tipografía: {t['display']} + {t['texto']} ({t['estilo']})")
    print(f"  Movimiento: {k['movimiento']['perfil']} · investigación reutilizable: {'sí' if k['investigacion_reutilizable'] else 'no'}")
    for aviso in k["avisos"]:
        print(f"  ⚠ {aviso}")


def cmd_imagenes(a):
    import imagenes as I
    if a.accion == "credito":
        if not a.id or a.creditos is None:
            raise P.ErrorFabrica("Uso: fabrica imagenes <cliente> credito <id> <créditos>")
        return print(f"✓ Créditos registrados. Total en este cliente: {I.registrar_credito(a.slug, a.id, a.creditos)['total']}")
    if a.accion == "podar":
        r = I.podar(a.slug)
        return print(f"✓ Usadas: {', '.join(r['usadas']) or 'ninguna'} · retiradas del sitio: {len(r['movidas'])}")
    reg = I.obtener(a.slug, solo=[a.id] if a.id else None)
    for ident, e in reg["imagenes"].items():
        print(f"  {ident}: {e['estado']} · {len(e['candidatos'])} opciones" + (f" · {e['notas'][0]}" if e["notas"] else ""))
    print(f"✓ Hoja de contactos: clients/{a.slug}/recursos/hoja-contactos.png · licencias: recursos/licencias-imagenes.md")


def cmd_navegador(a):
    r = NAV.probar(a.slug)
    for x in r["resultados"]:
        print(f"{'✓' if x['estado'] == 'aprobada' else '✗'} {x['prueba']}  {x['detalle']}")


def main():
    ap = argparse.ArgumentParser(prog="fabrica", description="FÁBRICA WEB SIGNATURE", formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    sub = ap.add_subparsers(dest="comando", required=True)
    sub.add_parser("diagnostico").set_defaults(f=cmd_diagnostico)
    s = sub.add_parser("nuevo"); s.add_argument("--brief", required=True); s.add_argument("--slug"); s.set_defaults(f=cmd_nuevo)
    s = sub.add_parser("validar-brief"); s.add_argument("archivo"); s.set_defaults(f=cmd_validar)
    sub.add_parser("listar").set_defaults(f=cmd_listar)
    s = sub.add_parser("estado"); s.add_argument("slug"); s.add_argument("etapa", nargs="?", choices=P.IDS_ETAPAS); s.add_argument("--nota"); s.set_defaults(f=cmd_estado)
    s = sub.add_parser("iniciar-sitio"); s.add_argument("slug"); s.set_defaults(f=cmd_iniciar_sitio)
    s = sub.add_parser("cambio"); s.add_argument("slug"); s.add_argument("texto"); s.set_defaults(f=cmd_cambio)
    s = sub.add_parser("vista-previa"); s.add_argument("slug"); s.add_argument("--puerto", type=int, default=8080); s.set_defaults(f=cmd_vista_previa)
    s = sub.add_parser("qa"); s.add_argument("slug"); s.set_defaults(f=cmd_qa)
    s = sub.add_parser("similitud"); s.add_argument("slug"); s.set_defaults(f=cmd_similitud)
    s = sub.add_parser("respaldo"); s.add_argument("slug"); s.set_defaults(f=cmd_respaldo)
    s = sub.add_parser("seo"); s.add_argument("slug"); s.add_argument("--dominio", required=True); s.set_defaults(f=cmd_seo)
    s = sub.add_parser("preparar-produccion"); s.add_argument("slug"); s.add_argument("--dominio", required=True); s.add_argument("--destino"); s.set_defaults(f=cmd_preparar)
    s = sub.add_parser("registrar-publicacion"); s.add_argument("slug"); s.add_argument("--dominio", required=True); s.add_argument("--aprobado", required=True); s.set_defaults(f=cmd_registrar_pub)
    s = sub.add_parser("ficha"); s.add_argument("slug"); s.set_defaults(f=lambda a: print(f"✓ Ficha: {deploy.generar_ficha(a.slug)}"))
    s = sub.add_parser("creditos"); s.add_argument("slug"); s.add_argument("mensaje"); s.add_argument("creditos", type=float)
    s.set_defaults(f=lambda a: print(f"✓ Total de créditos: {sum(c['creditos'] for c in P.registrar_creditos(a.slug, a.mensaje, a.creditos)['creditos_hostinger'])}"))
    s = sub.add_parser("entrega");s.add_argument("slug"); s.set_defaults(f=cmd_entrega)
    s = sub.add_parser("aprendizaje"); s.add_argument("texto"); s.set_defaults(f=cmd_aprendizaje)
    s = sub.add_parser("instalar-skill"); s.add_argument("--forzar", action="store_true"); s.set_defaults(f=cmd_instalar_skill)
    sub.add_parser("motor-diagnostico").set_defaults(f=cmd_motor_diagnostico)
    sub.add_parser("conectar-claude").set_defaults(f=cmd_conectar_claude)
    s = sub.add_parser("generar"); s.add_argument("slug"); s.add_argument("--sin-revision", action="store_true"); s.add_argument("--si", action="store_true")
    s.add_argument("--modo", choices=list(M.MODOS), default="completo"); s.add_argument("--concepto", default=""); s.add_argument("--rondas", type=int, choices=(1, 2), default=1)
    s.set_defaults(f=cmd_generar)
    s = sub.add_parser("refinar"); s.add_argument("slug"); s.add_argument("--si", action="store_true"); s.add_argument("--rondas", type=int, choices=(1, 2), default=1)
    s.set_defaults(f=cmd_generar, modo="refinamiento", sin_revision=False)
    s = sub.add_parser("cambiar-concepto"); s.add_argument("slug"); s.add_argument("concepto"); s.add_argument("--si", action="store_true")
    s.set_defaults(f=cmd_generar, modo="redireccion", sin_revision=False, rondas=1)
    s = sub.add_parser("kit"); s.add_argument("slug"); s.set_defaults(f=cmd_kit)
    s = sub.add_parser("imagenes"); s.add_argument("slug"); s.add_argument("accion", nargs="?", choices=("obtener", "credito", "podar"), default="obtener")
    s.add_argument("id", nargs="?"); s.add_argument("creditos", nargs="?", type=float); s.set_defaults(f=cmd_imagenes)
    s = sub.add_parser("aplicar-cambio"); s.add_argument("slug"); s.add_argument("texto"); s.add_argument("--si", action="store_true"); s.set_defaults(f=cmd_aplicar_cambio)
    s = sub.add_parser("motor-estado"); s.add_argument("slug"); s.set_defaults(f=cmd_motor_estado)
    s = sub.add_parser("navegador"); s.add_argument("slug"); s.set_defaults(f=cmd_navegador)
    a = ap.parse_args()
    try:
        a.f(a)
    except P.ErrorFabrica as e:
        print(f"✗ {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nDetenido.")


if __name__ == "__main__":
    main()
