/* Signature Studio — motor de generación: botón GENERAR, progreso real, publicación.
   Todo viene de la API local; los estados reflejan archivos y procesos reales. */
(function () {
  'use strict';
  function S() { return window.Studio; }
  function esc(t) { return S().esc(t); }
  var temporizador = null;
  var MARCAS = { hecho: '✓', en_curso: '●', pendiente: '·', error: '✗', incompleto: '!', omitido: '–', no_ejecutado: '○' };
  var TEXTO_ESTADO = { en_curso: 'Trabajando', terminado: 'Terminado', error: 'Detenido por un error', cancelado: 'Cancelado', interrumpido: 'Interrumpido' };

  function detener() { if (temporizador) { clearTimeout(temporizador); temporizador = null; } }
  window.addEventListener('hashchange', detener);

  /* ---------------------------------------------------------- pestaña Generación */
  function pGenerar(panel, d, slug) {
    detener();
    panel.innerHTML = '<div id="motor-diag" class="panel">Comprobando Claude Code…</div><div id="motor-ej"></div>';
    Promise.all([S().api('GET', '/api/motor/diagnostico'), S().api('GET', '/api/clientes/' + slug + '/motor')]).then(function (r) {
      pintarDiagnostico(r[0], d, slug, r[1]);
      pintarEjecucion(r[1], slug);
      if (window.StudioMotor.pedirGeneracion === slug) {
        window.StudioMotor.pedirGeneracion = null;
        var caja = document.getElementById('ok-costo');
        if (caja) caja.focus();
      }
    }).catch(function (err) { S().aviso(err.message, true); });
  }

  function pintarDiagnostico(dg, d, slug, motor) {
    var caja = document.getElementById('motor-diag');
    var trabajando = motor.ultima && motor.ultima.estado === 'en_curso';
    var listo = dg.encontrado && dg.sesion;
    var ocupado = dg.en_uso && dg.en_uso.slug !== slug;
    caja.innerHTML =
      '<div class="motor-cabecera"><div><h3>Motor de generación</h3>' +
      '<p class="meta">Claude Code ' + (dg.encontrado ? esc(dg.version || '') : 'no encontrado') + ' · sesión: <b>' + (dg.sesion ? 'iniciada' : 'sin iniciar') + '</b> · navegador de pruebas: ' + (dg.navegador ? 'disponible' : 'no encontrado') + '</p></div>' +
      '<button type="button" class="secundario" id="re-diag">Volver a comprobar</button></div>' +
      (dg.mensaje ? '<p class="alerta">' + esc(dg.mensaje) + '</p>' : '') +
      '<details class="costo"><summary>¿Cuánto consume?</summary><p>' + esc(dg.costo_generar.texto) + '</p>' +
      '<p class="meta">Claude trabaja con permisos limitados: solo escribe en la carpeta de este cliente, no ejecuta comandos, no lee otros clientes ni tus datos de negocio y nunca publica.</p></details>' +
      '<label class="confirma"><input type="checkbox" id="ok-costo"> Entiendo el consumo estimado y quiero que Claude genere la página</label>' +
      '<fieldset class="modos"><legend>Modo de generación</legend>' + Object.keys(dg.modos || {}).filter(function (m) {
        return d.tiene_sitio || (m !== 'refinamiento' && m !== 'redireccion');
      }).map(function (m, i) {
        var nombres = { completo: 'Signature completo', rapido: 'Prueba rápida', refinamiento: 'Refinamiento Signature', redireccion: 'Cambiar dirección creativa' };
        return '<label class="modo"><input type="radio" name="modo" value="' + m + '"' + (m === 'completo' ? ' checked' : '') + '> <b>' + nombres[m] + '</b>' +
          '<span class="meta">' + esc(dg.modos[m].descripcion.split(':').slice(1).join(':')) + ' Consumo: ' + esc(dg.modos[m].costo.rango) + ' (' + esc(dg.modos[m].costo.fuente) + ').</span></label>';
      }).join('') +
      '<div id="caja-concepto" hidden><label for="concepto">¿Qué concepto adoptar? (1, 2, 3 o su nombre, ver diseno/conceptos.md)</label><input id="concepto" maxlength="120"></div>' +
      '<label class="confirma"><input type="checkbox" id="dos-rondas"> Dos rondas de crítica y corrección (más calidad, más consumo)</label>' +
      '<label class="confirma"><input type="checkbox" id="con-revision" checked> Incluir la auditoría visual independiente y la corrección</label></fieldset>' +
      '<div class="acciones"><button type="button" class="generar" id="btn-generar"' + (!listo || trabajando || ocupado ? ' disabled' : '') + '>' +
      (d.tiene_sitio ? 'VOLVER A GENERAR LA PÁGINA' : 'GENERAR PÁGINA WEB SIGNATURE') + '</button><span class="tipo claude">Claude Code</span>' +
      (ocupado ? '<span class="meta">El motor está ocupado con «' + esc(dg.en_uso.slug) + '».</span>' : '') + '</div>' +
      (d.tiene_sitio ? '<p class="meta">Volver a generar rehace la página desde el brief (el historial git del cliente guarda la versión actual). Para ajustes, usa «Cambios».</p>' : '');
    caja.querySelectorAll('input[name=modo]').forEach(function (r) {
      r.addEventListener('change', function () { document.getElementById('caja-concepto').hidden = r.value !== 'redireccion' || !r.checked; });
    });
    document.getElementById('re-diag').addEventListener('click', function () {
      S().api('GET', '/api/motor/diagnostico?forzar=1').then(function (n) { pintarDiagnostico(n, d, slug, motor); });
    });
    document.getElementById('btn-generar').addEventListener('click', function () {
      var b = this;
      if (!document.getElementById('ok-costo').checked) { S().aviso('Marca la casilla de consumo para continuar.', true); return; }
      b.disabled = true;
      var modo = (document.querySelector('input[name=modo]:checked') || {}).value || 'completo';
      var concepto = (document.getElementById('concepto') || {}).value || '';
      if (modo === 'redireccion' && !concepto.trim()) { S().aviso('Escribe qué concepto adoptar.', true); b.disabled = false; return; }
      S().api('POST', '/api/clientes/' + slug + '/generar', { confirmo_costo: true, revision: document.getElementById('con-revision').checked,
        modo: modo, concepto: concepto, rondas: document.getElementById('dos-rondas').checked ? 2 : 1 })
        .then(function () { S().aviso('Generación iniciada. Puedes cerrar el navegador: el trabajo sigue y se conserva.'); refrescar(slug); })
        .catch(function (err) { S().aviso(err.message, true); b.disabled = false; });
    });
  }

  function refrescar(slug) {
    S().api('GET', '/api/clientes/' + slug + '/motor').then(function (m) { pintarEjecucion(m, slug); })
      .catch(function (err) { S().aviso(err.message, true); });
  }

  function pintarEjecucion(m, slug) {
    var caja = document.getElementById('motor-ej');
    if (!caja) return detener();
    var e = m.ultima;
    if (!e) {
      caja.innerHTML = '<div class="vacio"><h3>Sin ejecuciones todavía</h3><p>Cuando pulses GENERAR verás aquí cada etapa, con lo que Claude va haciendo.</p></div>';
      return;
    }
    var c = e.consumo || {};
    var activo = e.estado === 'en_curso';
    var posicion = window.scrollY;
    caja.style.minHeight = caja.offsetHeight + 'px';  // evita saltos al refrescar
    caja.innerHTML =
      '<h2>' + (e.tipo === 'generar' ? 'Generación' + (e.modo ? ' · ' + esc(e.modo) : '') : 'Modificación') + ' ' + esc(e.id) + '</h2>' +
      '<p><span class="veredicto ' + ({ terminado: 'si', error: 'no', cancelado: 'no', interrumpido: 'ajustes' }[e.estado] || 'ajustes') + '">' + esc(TEXTO_ESTADO[e.estado] || e.estado) + '</span> ' +
      '<span class="meta">' + esc(e.mensaje || '') + '</span></p>' +
      (e.texto ? '<p class="meta">Cambio pedido: «' + esc(e.texto) + '»</p>' : '') +
      '<ol class="etapas motor">' + e.etapas.map(function (x) {
        return '<li class="m-' + x.estado + '"><span class="marca-e">' + (MARCAS[x.estado] || '·') + '</span><span>' + esc(x.nombre) +
          (x.detalle ? ' <small>— ' + esc(x.detalle) + '</small>' : '') + '</span><small>' + esc((x.fecha || '').slice(11, 16)) + '</small></li>';
      }).join('') + '</ol>' +
      '<div class="acciones">' +
      (activo ? '<button type="button" class="secundario" id="m-cancelar">Cancelar</button>' : '') +
      (['interrumpido', 'error', 'cancelado'].indexOf(e.estado) >= 0 ? '<button type="button" id="m-reanudar">Reanudar lo pendiente</button>' : '') +
      (e.estado === 'terminado' ? '<a class="boton" href="#/cliente/' + esc(slug) + '/preview">Ver la vista previa</a>' : '') +
      '</div>' +
      '<p class="meta">Consumo informado por Claude Code: US$' + Number(c.costo_usd || 0).toFixed(2) + ' equivalentes · ' + (c.turnos || 0) + ' turnos · ' +
      Number((c.tokens_entrada || 0) + (c.tokens_salida || 0) + (c.tokens_cache || 0)).toLocaleString('es-HN') + ' tokens (con plan Pro/Max no se cobra aparte).</p>' +
      (e.errores && e.errores.length ? '<h2>Errores</h2>' + e.errores.map(function (x) {
        return '<div class="alerta"><b>' + esc(x.mensaje) + '</b>' + (x.tecnico ? '<details><summary>Detalle técnico</summary><pre class="visor">' + esc(x.tecnico) + '</pre></details>' : '') + '</div>';
      }).join('') : '') +
      (e.avisos && e.avisos.length ? '<h2>Avisos</h2><ul>' + e.avisos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' : '') +
      '<h2>Registro de actividad</h2><pre class="visor" id="m-registro">' + esc((e.registro || []).join('\n') || 'Esperando a Claude…') + '</pre>' +
      (m.anteriores && m.anteriores.length ? '<h2>Ejecuciones anteriores</h2><ul>' + m.anteriores.map(function (a) {
        return '<li><code>' + esc(a.id) + '</code> ' + esc(a.tipo) + ' · ' + esc(TEXTO_ESTADO[a.estado] || a.estado) + '</li>';
      }).join('') + '</ul>' : '');
    var reg = document.getElementById('m-registro');
    reg.scrollTop = reg.scrollHeight;
    caja.style.minHeight = '';
    window.scrollTo(0, posicion);
    var bc = document.getElementById('m-cancelar');
    if (bc) bc.addEventListener('click', function () {
      if (!window.confirm('¿Cancelar? Lo que Claude ya hizo se conserva.')) return;
      S().api('POST', '/api/clientes/' + slug + '/motor/cancelar', { id: e.id }).then(function () { refrescar(slug); }).catch(function (err) { S().aviso(err.message, true); });
    });
    var br = document.getElementById('m-reanudar');
    if (br) br.addEventListener('click', function () {
      br.disabled = true;
      S().api('POST', '/api/clientes/' + slug + '/motor/reanudar', { id: e.id }).then(function () { refrescar(slug); }).catch(function (err) { S().aviso(err.message, true); br.disabled = false; });
    });
    detener();
    if (activo) temporizador = setTimeout(function () { refrescar(slug); }, 2500);
    var boton = document.getElementById('btn-generar');
    if (boton) boton.disabled = activo || boton.disabled;
  }

  /* ---------------------------------------------------------- pestaña Publicación */
  function pPublicacion(panel, d, slug) {
    var e = d.estado;
    var aprobado = (e.historial || []).some(function (h) { return h.etapa === 'aprobado'; });
    panel.innerHTML =
      '<div class="rejilla">' +
      '<form class="panel" id="f-ap-prep"><h3>Aprobar y preparar</h3><span class="tipo manual">Tu decisión</span> <span class="tipo auto">Automático</span>' +
      '<p class="meta">Registra tu aprobación, prueba el sitio, genera sitemap y robots, y crea el paquete zip con su lista de verificación. No publica nada.</p>' +
      '<div class="campo"><label for="ap-nota">Qué apruebas</label><input type="text" id="ap-nota" ' + (aprobado ? 'value="Ya aprobado" disabled' : 'placeholder="Ej.: Apruebo la versión revisada del 20/10"') + '></div>' +
      '<div class="campo"><label for="ap-dom">Dominio final</label><input type="text" id="ap-dom" placeholder="https://midominio.com" value="' + esc((d.brief || {}).dominio ? (/^https?:/.test(d.brief.dominio) ? d.brief.dominio : 'https://' + d.brief.dominio) : '') + '"></div>' +
      '<button type="submit" class="generar"' + (d.tiene_sitio ? '' : ' disabled') + '>APROBAR Y PREPARAR PUBLICACIÓN</button></form>' +
      '<div class="panel"><h3>Publicar en Hostinger</h3><span class="tipo claude">Claude Code</span> <span class="tipo manual">Tu confirmación</span>' +
      '<p class="meta">Muestra lo que se publicaría y cómo autorizarlo. Studio nunca publica por sí mismo.</p>' +
      '<button type="button" class="generar" id="btn-publicar">PUBLICAR EN HOSTINGER</button></div></div>' +
      '<div id="resumen-pub"></div>' +
      '<details class="otras"><summary>Pasos por separado (como antes)</summary><div id="pub-basica"></div></details>';
    S().pPublicacionBasica(document.getElementById('pub-basica'), d, slug);
    document.getElementById('f-ap-prep').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var b = this.querySelector('button');
      var nota = aprobado ? 'Ya aprobado' : document.getElementById('ap-nota').value.trim();
      if (!nota) { S().aviso('Escribe qué apruebas.', true); return; }
      b.disabled = true;
      S().api('POST', '/api/clientes/' + slug + '/aprobar-preparar', { nota: nota, dominio: document.getElementById('ap-dom').value.trim() })
        .then(function (r) { S().aviso('Versión ' + r.version + ' preparada: ' + r.paquete + '\nNo se publicó nada.'); S().verCliente(slug, 'publicacion'); })
        .catch(function (err) { S().aviso(err.message, true); b.disabled = false; });
    });
    document.getElementById('btn-publicar').addEventListener('click', function () {
      S().api('GET', '/api/clientes/' + slug + '/publicacion-resumen').then(function (r) { pintarResumen(r); })
        .catch(function (err) { S().aviso(err.message, true); });
    });
  }

  function pintarResumen(r) {
    var caja = document.getElementById('resumen-pub');
    var listo = r.aprobado && r.preparado;
    caja.innerHTML = '<h2>Antes de publicar</h2><table class="tabla"><tbody>' +
      fila('Proyecto', r.proyecto.nombre + ' (' + r.proyecto.slug + ')' + (r.proyecto.demo ? ' · DEMO' : '')) +
      fila('Dominio o destino', r.destino) +
      fila('Aprobación', r.aprobado ? 'registrada' : 'falta: usa APROBAR Y PREPARAR PUBLICACIÓN') +
      fila('Paquete', r.preparado ? r.preparado.paquete + ' (versión ' + r.preparado.version + ')' : 'sin preparar') +
      fila('Archivos que se publicarán', r.archivos.length ? r.archivos.length + ': ' + r.archivos.slice(0, 14).join(', ') + (r.archivos.length > 14 ? '…' : '') : '—') +
      fila('Resultado de las pruebas', r.pruebas ? r.pruebas.veredicto + ' (' + r.pruebas.criticas + ' críticas, ' + r.pruebas.advertencias + ' advertencias, ' + r.pruebas.fecha + ')' : 'sin pruebas') +
      fila('Sitios que podrían resultar afectados', r.sitios_afectados) +
      fila('Posibles costos', r.costos) +
      fila('Operaciones necesarias', r.operaciones.map(function (o, i) { return (i + 1) + '. ' + o; }).join(' · ')) +
      '</tbody></table>' +
      (r.demo_bloqueo ? '<p class="alerta">' + esc(r.demo_bloqueo) + '</p>' : '') +
      (listo ? '<div class="paso-siguiente" style="margin-top:14px"><p>Abre Claude Code en la carpeta de la fábrica (con el conector de Hostinger) y pega la orden. Claude comprobará el destino en modo lectura, te mostrará qué se reemplaza y solo publicará cuando escribas exactamente:</p>' +
        '<code>' + esc(r.frase_autorizacion) + '</code><code>' + esc(r.orden_claude) + '</code>' +
        '<button type="button" id="copiar-pub2">Copiar orden</button></div>' : '<p class="alerta">Todavía no se puede publicar: falta aprobar y preparar el paquete.</p>');
    var b = document.getElementById('copiar-pub2');
    if (b) b.addEventListener('click', function () { S().copiar(r.orden_claude); });
    caja.scrollIntoView({ behavior: 'smooth' });
  }
  function fila(a, b) { return '<tr><th>' + esc(a) + '</th><td>' + esc(b) + '</td></tr>'; }

  window.StudioMotor = { pGenerar: pGenerar, pPublicacion: pPublicacion, pedirGeneracion: null };
})();
