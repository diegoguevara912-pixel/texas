/* Signature Studio — interfaz de la Fábrica Web Signature.
   Todo pasa por la API local (server.py). Nada se simula. */
(function () {
  'use strict';
  var vista = document.getElementById('vista');
  var esquema = null;

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function aviso(texto, error) {
    var caja = document.createElement('div');
    caja.textContent = texto;
    if (error) caja.className = 'error';
    document.getElementById('aviso').appendChild(caja);
    setTimeout(function () { caja.remove(); }, error ? 9000 : 4500);
  }
  function api(metodo, ruta, cuerpo) {
    return fetch(ruta, {
      method: metodo,
      headers: cuerpo ? { 'Content-Type': 'application/json' } : {},
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error(d.error || 'Error');
        return d;
      });
    });
  }
  var fuentes = [];
  function cargarEsquema() {
    if (esquema) return Promise.resolve(esquema);
    return Promise.all([api('GET', '/api/esquema'), api('GET', '/api/fuentes').catch(function () { return []; })]).then(function (r) {
      esquema = r[0]; fuentes = r[1]; return esquema;
    });
  }
  function datalistFuentes() {
    return '<datalist id="catalogo-fuentes">' + fuentes.map(function (f) {
      return '<option value="' + esc(f.nombre) + '">' + esc(f.categoria + ' · ' + f.estilo + ' · ' + f.licencia) + '</option>';
    }).join('') + '</datalist>';
  }
  function muestraFuente(input) {
    var caja = document.getElementById(input.id + '-muestra');
    if (!caja) return;
    var nombre = input.value.trim();
    var f = fuentes.filter(function (x) { return x.nombre.toLowerCase() === nombre.toLowerCase(); })[0];
    if (!nombre) { caja.textContent = 'Sin elegir: Claude escogerá una combinación adecuada.'; caja.style.fontFamily = ''; return; }
    if (f) {
      var id = 'gf-' + f.nombre.replace(/\W+/g, '-');
      if (!document.getElementById(id)) {
        var l = document.createElement('link');
        l.id = id; l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(f.nombre).replace(/%20/g, '+') + ':wght@400;700&display=swap';
        document.head.appendChild(l);
      }
      caja.style.fontFamily = '"' + f.nombre + '", system-ui';
      caja.textContent = 'Aa Bb Cc — Una experiencia digital Signature · ' + f.licencia + ', ' + f.origen;
    } else {
      caja.style.fontFamily = '"' + nombre + '", system-ui';
      caja.textContent = 'Fuera del catálogo: Claude confirmará que existe y que su licencia permite uso web.';
    }
  }
  function activarCampos(form) {
    form.querySelectorAll('input[list="catalogo-fuentes"]').forEach(function (i) {
      muestraFuente(i);
      i.addEventListener('input', function () { muestraFuente(i); });
    });
    form.querySelectorAll('input[type=color][data-para]').forEach(function (c) {
      c.addEventListener('input', function () {
        var t = document.getElementById(c.getAttribute('data-para'));
        var partes = t.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
        if (c.dataset.editando === '1' && partes.length && /^#[0-9a-f]{6}$/i.test(partes[partes.length - 1])) partes[partes.length - 1] = c.value.toUpperCase();
        else partes.push(c.value.toUpperCase());
        c.dataset.editando = '1';
        t.value = partes.join(', ');
      });
      c.addEventListener('change', function () { c.dataset.editando = ''; });
    });
  }
  function marcarNav(nombre) {
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === nombre) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  function copiar(texto) {
    (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject()).then(
      function () { aviso('Copiado. Pégalo en Claude Code.'); },
      function () { window.prompt('Copia este texto:', texto); }
    );
  }
  window.__copiar = copiar;

  /* ------------------------------------------------------------ clientes */
  function pista(estado, etapas) {
    var hechas = {};
    (estado.historial || []).forEach(function (h) { hechas[h.etapa] = true; });
    return '<div class="pista" aria-hidden="true">' + etapas.map(function (e) {
      var c = e[0] === estado.etapa ? 'actual' : (hechas[e[0]] ? 'hecha' : '');
      return '<span class="' + c + '"></span>';
    }).join('') + '</div>';
  }
  var ETAPAS = [['brief', 'A. Información recibida'], ['analisis', 'B. Negocio comprendido'], ['concepto', 'C. Dirección creativa (3 conceptos)'], ['identidad', 'D. Sistema visual'], ['desarrollo', 'E. Web construida'], ['recursos', 'F. Recursos incorporados'], ['calidad', 'G. Pruebas'], ['mejora', 'H. Mejoras aplicadas'], ['vista_previa', 'I. Vista previa entregada'], ['cambios', 'J. Cambios solicitados'], ['aprobado', 'K. Aprobado por Diego'], ['publicado', 'L. Publicado'], ['guardado', 'M. Guardado y documentado']];
  function nombreEtapa(id) { var e = ETAPAS.filter(function (x) { return x[0] === id; })[0]; return e ? e[1] : id; }

  function verClientes() {
    marcarNav('clientes');
    vista.innerHTML = '<h1>Clientes</h1><p class="bajada">Cada cliente es un proyecto aislado en <code>clients/</code>. Abre uno para ver su estado, su vista previa, sus pruebas y su publicación.</p><div id="lista">Cargando…</div>';
    api('GET', '/api/clientes').then(function (lista) {
      var caja = document.getElementById('lista');
      if (!lista.length) {
        caja.innerHTML = '<div class="vacio"><h3>Todavía no hay clientes</h3><p>Llena el Brief Inteligente Signature para crear el primero.</p><a class="boton" href="#/nuevo">Nuevo cliente</a></div>';
        return;
      }
      caja.innerHTML = '<div class="rejilla">' + lista.map(function (e) {
        return '<a class="tarjeta-cliente" href="#/cliente/' + esc(e.slug) + '">' +
          '<h3>' + esc(e.nombre) + '</h3><div class="meta">' + esc(e.sector) + '</div>' +
          pista(e, ETAPAS) +
          '<div class="meta">' + esc(nombreEtapa(e.etapa)) + '</div>' +
          '<div style="margin-top:10px">' + (e.demo ? '<span class="etiqueta demo">demo</span>' : '') +
          '<span class="etiqueta">' + esc(e.tipo_web) + '</span>' +
          '<span class="etiqueta">' + (e.tiene_sitio ? 'con sitio' : 'sin sitio') + '</span></div></a>';
      }).join('') + '</div>';
    }).catch(function (err) { aviso(err.message, true); });
  }

  /* ------------------------------------------------------------ formulario brief */
  function campoHTML(c, valor) {
    var id = 'f-' + c.id;
    var req = c.obligatorio ? ' <span class="obligatorio" aria-hidden="true">*</span>' : '';
    var ayuda = c.ayuda ? '<p class="ayuda" id="' + id + '-ayuda">' + esc(c.ayuda) + '</p>' : '';
    var desc = c.ayuda ? ' aria-describedby="' + id + '-ayuda"' : '';
    var v = valor == null ? (c.defecto || '') : valor;
    var reqAttr = c.obligatorio ? ' required aria-required="true"' : '';
    if (c.tipo === 'fuente') return '<div class="campo"><label for="' + id + '">' + esc(c.label) + req + '</label>' + ayuda + '<input type="text" list="catalogo-fuentes" autocomplete="off" id="' + id + '" name="' + c.id + '" value="' + esc(v) + '" placeholder="Escribe o elige del catálogo"' + desc + '><p class="muestra-fuente" id="' + id + '-muestra" aria-live="polite"></p></div>';
    if (c.tipo === 'colores') return '<div class="campo"><label for="' + id + '">' + esc(c.label) + req + '</label>' + ayuda + '<div class="con-color"><input type="text" id="' + id + '" name="' + c.id + '" value="' + esc(v) + '" placeholder="Ej.: azul marino #0B2545, arena #E8DCC8"' + desc + '><input type="color" data-para="' + id + '" aria-label="Elegir un color para ' + esc(c.label) + '" value="#1F3BD6"></div></div>';
    if (c.tipo === 'texto') return '<div class="campo"><label for="' + id + '">' + esc(c.label) + req + '</label>' + ayuda + '<input type="text" id="' + id + '" name="' + c.id + '" value="' + esc(v) + '"' + desc + reqAttr + '></div>';
    if (c.tipo === 'parrafo') return '<div class="campo"><label for="' + id + '">' + esc(c.label) + req + '</label>' + ayuda + '<textarea id="' + id + '" name="' + c.id + '"' + desc + reqAttr + '>' + esc(v) + '</textarea></div>';
    if (c.tipo === 'opcion') return '<div class="campo"><label for="' + id + '">' + esc(c.label) + req + '</label>' + ayuda + '<select id="' + id + '" name="' + c.id + '"' + desc + reqAttr + '><option value="">— Elegir —</option>' +
      c.opciones.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></div>';
    if (c.tipo === 'multiple') {
      var sel = Array.isArray(valor) ? valor : [];
      return '<div class="campo" role="group" aria-labelledby="' + id + '-l"><span class="lbl" id="' + id + '-l">' + esc(c.label) + req + '</span>' + ayuda + '<div class="opciones">' +
        c.opciones.map(function (o, i) { return '<label><input type="checkbox" name="' + c.id + '" value="' + esc(o) + '"' + (sel.indexOf(o) >= 0 ? ' checked' : '') + '> ' + esc(o) + '</label>'; }).join('') + '</div></div>';
    }
    return '';
  }
  function formularioBrief(e, datos) {
    return '<form class="brief" novalidate>' + e.secciones.map(function (s, i) {
      return '<fieldset><legend>' + esc(s.id + '. ' + s.titulo) + '</legend>' +
        (s.nota ? '<p class="ayuda">' + esc(s.nota) + '</p>' : '') + s.campos.map(function (c) { return campoHTML(c, datos ? datos[c.id] : null); }).join('') + '</fieldset>';
    }).join('') + datalistFuentes() + '<div class="acciones"><button type="submit">Guardar brief</button><span class="tipo auto">Automático</span>' +
      (datos ? '' : '<button type="submit" class="generar" data-generar="1">GENERAR PÁGINA WEB SIGNATURE</button><span class="tipo claude">Claude Code</span>') + '</div></form>';
  }
  function leerFormulario(form, e) {
    var datos = {};
    e.secciones.forEach(function (s) {
      s.campos.forEach(function (c) {
        if (c.tipo === 'multiple') {
          datos[c.id] = Array.prototype.map.call(form.querySelectorAll('input[name="' + c.id + '"]:checked'), function (x) { return x.value; });
        } else {
          var el = form.elements[c.id];
          if (el) datos[c.id] = el.value;
        }
      });
    });
    return datos;
  }

  function verNuevo() {
    marcarNav('nuevo');
    cargarEsquema().then(function (e) {
      vista.innerHTML = '<h1>Nuevo cliente</h1><p class="bajada">' + esc(e.nota) + ' Los campos con <span class="obligatorio">*</span> son obligatorios.</p>' + formularioBrief(e, null);
      var form = vista.querySelector('form');
      activarCampos(form);
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var generar = ev.submitter && ev.submitter.getAttribute('data-generar') === '1';
        var botones = form.querySelectorAll('button[type=submit]');
        botones.forEach(function (b) { b.disabled = true; });
        api('POST', '/api/clientes', { brief: leerFormulario(form, e) }).then(function (r) {
          aviso('Proyecto creado: ' + r.slug);
          if (generar) window.StudioMotor.pedirGeneracion = r.slug;
          location.hash = '#/cliente/' + r.slug + (generar ? '/generar' : '');
        }).catch(function (err) { aviso(err.message, true); botones.forEach(function (b) { b.disabled = false; }); });
      });
    });
  }

  /* ------------------------------------------------------------ detalle */
  var PESTANAS = [['resumen', 'Resumen'], ['generar', 'Generación'], ['brief', 'Brief'], ['preview', 'Vista previa'], ['calidad', 'Calidad'], ['cambios', 'Cambios'], ['dominio', 'Dominio'], ['negocio', 'Plan y pagos'], ['archivos', 'Archivos'], ['publicacion', 'Publicación']];

  function verCliente(slug, pestana) {
    marcarNav('clientes');
    pestana = pestana || 'resumen';
    api('GET', '/api/clientes/' + encodeURIComponent(slug)).then(function (d) {
      var e = d.estado;
      vista.innerHTML = '<p class="meta"><a href="#/">← Clientes</a></p><h1>' + esc(e.nombre) + '</h1>' +
        '<p class="bajada">' + esc(e.sector) + ' · <code>' + esc(e.slug) + '</code> ' + (e.demo ? '<span class="etiqueta demo">demo, no indexable</span>' : '') + '</p>' +
        '<div class="pestanas" role="tablist">' + PESTANAS.map(function (p) {
          return '<button role="tab" aria-selected="' + (p[0] === pestana) + '" data-p="' + p[0] + '">' + p[1] + '</button>';
        }).join('') + '</div><section id="contenido-p" role="tabpanel"></section>';
      vista.querySelectorAll('[role=tab]').forEach(function (b) {
        b.addEventListener('click', function () { location.hash = '#/cliente/' + slug + '/' + b.getAttribute('data-p'); });
      });
      var panel = document.getElementById('contenido-p');
      ({ resumen: pResumen, brief: pBrief, preview: pPreview, calidad: pCalidad, cambios: pCambios, archivos: pArchivos, publicacion: window.StudioMotor.pPublicacion, generar: window.StudioMotor.pGenerar, dominio: window.StudioExtra.pestanas.dominio, negocio: window.StudioExtra.pestanas.negocio }[pestana] || pResumen)(panel, d, slug);
    }).catch(function (err) { vista.innerHTML = '<h1>No encontrado</h1><p>' + esc(err.message) + '</p>'; });
  }

  function siguientePaso(d) {
    var e = d.estado;
    var orden = '/fabrica-web-signature ficha ' + e.slug;
    if (e.etapa === 'aprobado') orden = '/fabrica-web-signature publicar ' + e.slug;
    else if (['vista_previa', 'cambios', 'publicado', 'guardado'].indexOf(e.etapa) >= 0) orden = '/fabrica-web-signature modificar ' + e.slug;
    return orden;
  }

  function pResumen(panel, d, slug) {
    var e = d.estado;
    var hechas = {};
    (e.historial || []).forEach(function (h) { hechas[h.etapa] = h; });
    var orden = siguientePaso(d);
    var id = d.identidad;
    panel.innerHTML =
      '<div class="paso-siguiente"><span class="tipo claude">Claude Code</span><h3 style="margin-top:10px">' + (d.tiene_sitio ? 'Página generada' : 'Crear la página') + '</h3>' +
      '<p>' + (d.tiene_sitio ? 'Revisa la vista previa, pide cambios en «Cambios» o vuelve a generar desde «Generación».' : 'Studio inicia Claude Code, que analiza el negocio, diseña, programa y prueba la página. Verás cada etapa en «Generación».') + '</p>' +
      '<a class="boton generar" href="#/cliente/' + esc(slug) + '/generar">' + (d.tiene_sitio ? 'Ver la generación' : 'GENERAR PÁGINA WEB SIGNATURE') + '</a>' +
      '<details class="otras"><summary>Otras formas (manuales)</summary>' +
      '<p>Orden para pegar en una sesión de Claude Code:</p><code>' + esc(orden) + '</code><button type="button" id="copiar-orden">Copiar orden</button>' +
      '<p style="margin-top:12px">Ficha para Hostinger AI Builder: Claude define el sitio en una ficha y el constructor de Hostinger la construye.</p>' +
      '<button type="button" id="crear-ficha" style="margin-top:4px">Crear ficha base desde el brief</button> <span class="tipo auto">Automático</span></details></div>' +
      '<h2>Etapas</h2><ol class="etapas">' + d.etapas.map(function (et) {
        var h = hechas[et[0]];
        var cls = et[0] === e.etapa ? 'actual' : (h ? 'hecha' : '');
        return '<li class="' + cls + '"><span class="marca-e">' + (h ? '✓' : (cls ? '→' : '·')) + '</span><span>' + esc(et[1]) + (h && h.nota ? ' <small>— ' + esc(h.nota) + '</small>' : '') + '</span><small>' + (h ? esc(h.fecha) : '') + '</small></li>';
      }).join('') + '</ol>' +
      (id ? '<h2>Identidad: ' + esc(id.concepto) + '</h2><p>' + esc(id.idea || '') + '</p><div class="paleta">' +
        Object.keys(id.paleta || {}).map(function (k) { return '<span style="background:' + esc(id.paleta[k]) + '" title="' + esc(k) + '"><b style="background:#fff;padding:1px 3px">' + esc(k) + '</b></span>'; }).join('') + '</div>' : '') +
      (e.pendientes && e.pendientes.length ? '<h2>Pendientes</h2><ul>' + e.pendientes.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : '') +
      '<h2>Carpeta</h2><p class="mono">' + esc(d.carpeta) + '</p>';
    document.getElementById('copiar-orden').addEventListener('click', function () { copiar(orden); });
    document.getElementById('crear-ficha').addEventListener('click', function () {
      api('POST', '/api/clientes/' + slug + '/ficha', {}).then(function (r) { aviso('Ficha creada: ' + r.ruta + '\nClaude completa los apartados marcados.'); })
        .catch(function (err) { aviso(err.message, true); });
    });
  }

  function pBrief(panel, d, slug) {
    cargarEsquema().then(function (e) {
      panel.innerHTML = '<p class="bajada">Al guardar, la versión anterior queda en <code>historial/</code>.</p>' + formularioBrief(e, d.brief);
      var form = panel.querySelector('form');
      activarCampos(form);
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        api('POST', '/api/clientes/' + slug + '/brief', { brief: leerFormulario(form, e) }).then(function () { aviso('Brief guardado.'); })
          .catch(function (err) { aviso(err.message, true); });
      });
    });
  }

  function pPreview(panel, d, slug) {
    if (!d.tiene_sitio) {
      panel.innerHTML = '<div class="vacio"><h3>Aún no hay sitio</h3><p>El sitio aparece aquí cuando Claude lo construye en <code>sitio/</code>.</p></div>';
      return;
    }
    var url = '/preview/' + slug + '/';
    panel.innerHTML = '<div class="acciones" style="margin:0 0 12px"><span class="tipo auto">Automático</span>' +
      '<div class="dispositivos"><button class="secundario" data-w="390">Móvil</button><button class="secundario" data-w="820">Tableta</button><button class="secundario" data-w="">Escritorio</button></div>' +
      '<a class="boton secundario" href="' + url + '" target="_blank" rel="noopener">Abrir en pestaña nueva</a></div>' +
      '<div class="marco-preview" id="mp"><iframe src="' + url + '" title="Vista previa de ' + esc(d.estado.nombre) + '"></iframe></div>';
    panel.querySelectorAll('[data-w]').forEach(function (b) {
      b.addEventListener('click', function () {
        var w = b.getAttribute('data-w');
        var mp = document.getElementById('mp');
        mp.style.maxWidth = w ? w + 'px' : '';
        mp.style.margin = w ? '0 auto' : '';
      });
    });
  }

  function tablaQA(r) {
    var cls = r.veredicto.indexOf('NO') === 0 ? 'no' : (r.veredicto.indexOf('AJUSTES') >= 0 ? 'ajustes' : 'si');
    var txt = { aprobada: '✓ aprobada', fallida: '✗ fallida', no_ejecutada: '○ no ejecutada' };
    return '<p><span class="veredicto ' + cls + '">' + esc(r.veredicto) + '</span> <span class="meta">' + esc(r.fecha) + ' · ' + r.aprobadas + ' aprobadas · ' + r.fallidas_criticas + ' críticas · ' + r.advertencias + ' advertencias · ' + r.no_ejecutadas + ' no ejecutadas</span></p>' +
      '<table class="tabla"><thead><tr><th>Prueba</th><th>Resultado</th><th>Detalle</th></tr></thead><tbody>' +
      r.resultados.map(function (x) {
        return '<tr><td>' + esc(x.prueba) + '</td><td class="r-' + x.estado + '">' + txt[x.estado] + (x.severidad ? ' <small>(' + esc(x.severidad) + ')</small>' : '') + '</td><td>' + esc(x.detalle) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function pCalidad(panel, d, slug) {
    panel.innerHTML = '<div class="acciones" style="margin-top:0"><button type="button" id="correr">Ejecutar pruebas automáticas</button><span class="tipo auto">Automático</span>' +
      '<button type="button" class="secundario" id="simil">Comparar con otros proyectos</button><span class="tipo auto">Automático</span></div>' +
      '<p class="meta">La revisión visual en navegador y la rúbrica Signature las hace Claude <span class="tipo claude">Claude Code</span> y quedan en <code>qa/</code>.</p>' +
      '<div id="res">' + (d.qa ? tablaQA(d.qa) : '<p>Sin pruebas todavía.</p>') + '</div><div id="res-s"></div>';
    document.getElementById('correr').addEventListener('click', function () {
      var b = this; b.disabled = true;
      api('POST', '/api/clientes/' + slug + '/qa', {}).then(function (r) { document.getElementById('res').innerHTML = tablaQA(r); b.disabled = false; })
        .catch(function (err) { aviso(err.message, true); b.disabled = false; });
    });
    document.getElementById('simil').addEventListener('click', function () {
      api('POST', '/api/clientes/' + slug + '/similitud', {}).then(function (r) {
        document.getElementById('res-s').innerHTML = '<h2>Similitud creativa: ' + esc(r.veredicto) + '</h2>' + (r.comparaciones.length ? '<table class="tabla"><thead><tr><th>Proyecto</th><th>Puntuación</th><th>Nivel</th></tr></thead><tbody>' +
          r.comparaciones.map(function (c) { return '<tr><td>' + esc(c.con) + '</td><td>' + c.puntuacion + '/100</td><td>' + esc(c.nivel) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p>No hay otros proyectos con identidad para comparar.</p>');
      }).catch(function (err) { aviso(err.message, true); });
    });
  }

  function pCambios(panel, d, slug) {
    panel.innerHTML = '<form id="f-cambio" class="panel"><div class="campo"><label for="t-cambio">Describe el cambio con tus palabras</label>' +
      '<p class="ayuda">Ej.: "Cambia el botón principal a Agendar cita y agrega la sección de horarios".</p><textarea id="t-cambio" required></textarea></div>' +
      '<div class="acciones"><button type="button" id="aplicar-cambio"' + (d.tiene_sitio ? '' : ' disabled title="Primero genera la página"') + '>Aplicar cambio con Claude</button><span class="tipo claude">Claude Code</span>' +
      '<button type="submit" class="secundario">Solo registrar</button><span class="tipo auto">Automático</span></div>' +
      '<p class="meta">«Aplicar» respalda el sitio, Claude cambia solo lo pedido, se repiten las pruebas, se actualiza la vista previa y queda en el historial. Consumo estimado: una fracción de una generación.</p>' +
      '<label class="confirma"><input type="checkbox" id="ok-costo-mod"> Entiendo que aplicar el cambio usa mi plan de Claude</label>' +
      '<button type="button" class="secundario" id="copiar-mod" style="margin-top:10px">Copiar orden para una sesión manual</button></form>' +
      '<h2>Registro</h2><pre class="visor">' + esc(d.cambios || 'Sin cambios solicitados.') + '</pre>';
    document.getElementById('f-cambio').addEventListener('submit', function (ev) {
      ev.preventDefault();
      api('POST', '/api/clientes/' + slug + '/cambio', { texto: document.getElementById('t-cambio').value }).then(function () {
        aviso('Cambio registrado.'); verCliente(slug, 'cambios');
      }).catch(function (err) { aviso(err.message, true); });
    });
    document.getElementById('copiar-mod').addEventListener('click', function () { copiar('/fabrica-web-signature modificar ' + slug); });
    document.getElementById('aplicar-cambio').addEventListener('click', function () {
      var b = this, texto = document.getElementById('t-cambio').value;
      if (!texto.trim()) { aviso('Escribe el cambio que quieres.', true); return; }
      if (!document.getElementById('ok-costo-mod').checked) { aviso('Marca la casilla de consumo para continuar.', true); return; }
      b.disabled = true;
      api('POST', '/api/clientes/' + slug + '/modificar', { texto: texto, confirmo_costo: true }).then(function () {
        aviso('Claude está aplicando el cambio.'); location.hash = '#/cliente/' + slug + '/generar';
      }).catch(function (err) { aviso(err.message, true); b.disabled = false; });
    });
  }

  function pArchivos(panel, d, slug) {
    panel.innerHTML = '<ul class="lista-archivos">' + d.archivos.map(function (a) {
      var legible = /\.(md|json|txt|css|js|html|xml)$/i.test(a.ruta);
      return '<li>' + (legible ? '<button type="button" data-r="' + esc(a.ruta) + '">' + esc(a.ruta) + '</button>' : esc(a.ruta)) + ' <span class="meta">' + a.kb + ' KB</span></li>';
    }).join('') + '</ul><div id="visor"></div>';
    panel.querySelectorAll('[data-r]').forEach(function (b) {
      b.addEventListener('click', function () {
        api('GET', '/api/clientes/' + slug + '/archivo/' + b.getAttribute('data-r').split('/').map(encodeURIComponent).join('/')).then(function (r) {
          document.getElementById('visor').innerHTML = '<h2>' + esc(r.ruta) + '</h2><pre class="visor">' + esc(r.contenido) + '</pre>';
          document.getElementById('visor').scrollIntoView({ behavior: 'smooth' });
        }).catch(function (err) { aviso(err.message, true); });
      });
    });
  }

  function pPublicacion(panel, d, slug) {
    var e = d.estado;
    var pub = e.publicacion || {};
    var aprobado = (e.historial || []).some(function (h) { return h.etapa === 'aprobado'; });
    panel.innerHTML =
      '<p class="bajada">Estado: <b>' + esc(pub.estado || 'no publicado') + '</b>' + (pub.preparado ? ' · versión ' + pub.preparado.version + ' preparada (' + esc(pub.preparado.paquete) + ')' : '') + '</p>' +
      '<div class="rejilla">' +
      '<form class="panel" id="f-aprobar"><h3>1. Registrar tu aprobación</h3><span class="tipo manual">Manual</span>' +
      '<p class="meta">Solo cuando hayas revisado la vista previa y estés de acuerdo.</p>' +
      '<div class="campo"><label for="nota-ap">Qué apruebas</label><input type="text" id="nota-ap" required value="' + (aprobado ? 'Ya aprobado' : '') + '" placeholder="Ej.: Apruebo la versión revisada del 20/10"></div>' +
      '<button type="submit"' + (aprobado ? ' disabled' : '') + '>Registrar aprobación</button></form>' +
      '<form class="panel" id="f-preparar"><h3>2. Preparar producción</h3><span class="tipo auto">Automático</span>' +
      '<p class="meta">Ejecuta pruebas, genera sitemap/robots y crea el paquete zip y la lista de verificación. No publica.</p>' +
      '<div class="campo"><label for="dom">Dominio final</label><input type="text" id="dom" required placeholder="https://midominio.com"></div>' +
      '<button type="submit">Preparar paquete</button></form>' +
      '<div class="panel"><h3>3. Publicar en Hostinger</h3><span class="tipo claude">Claude Code</span> <span class="tipo manual">Tu confirmación</span>' +
      '<p class="meta">Claude comprueba el destino con el conector de Hostinger, te muestra qué se reemplaza y espera tu "Autorizo publicar…". Studio nunca publica.</p>' +
      '<button type="button" class="secundario" id="copiar-pub">Copiar orden</button></div></div>' +
      (pub.versiones && pub.versiones.length ? '<h2>Versiones publicadas</h2><table class="tabla"><thead><tr><th>Versión</th><th>Dominio</th><th>Fecha</th><th>Aprobación</th></tr></thead><tbody>' +
        pub.versiones.map(function (v) { return '<tr><td>' + v.version + '</td><td>' + esc(v.dominio) + '</td><td>' + esc(v.publicado) + '</td><td>' + esc(v.aprobacion) + '</td></tr>'; }).join('') + '</tbody></table>' : '');
    document.getElementById('f-aprobar').addEventListener('submit', function (ev) {
      ev.preventDefault();
      api('POST', '/api/clientes/' + slug + '/aprobar', { nota: document.getElementById('nota-ap').value }).then(function () { aviso('Aprobación registrada.'); verCliente(slug, 'publicacion'); })
        .catch(function (err) { aviso(err.message, true); });
    });
    document.getElementById('f-preparar').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var b = this.querySelector('button'); b.disabled = true;
      api('POST', '/api/clientes/' + slug + '/preparar', { dominio: document.getElementById('dom').value.trim() }).then(function (r) {
        aviso('Versión ' + r.version + ' preparada: ' + r.paquete + '\nNo se publicó nada.'); verCliente(slug, 'publicacion');
      }).catch(function (err) { aviso(err.message, true); b.disabled = false; });
    });
    document.getElementById('copiar-pub').addEventListener('click', function () { copiar('/fabrica-web-signature publicar ' + slug); });
  }

  /* ------------------------------------------------------------ guía */
  function verGuia() {
    marcarNav('guia');
    vista.innerHTML = '<h1>Cómo funciona</h1><p class="bajada">Studio administra. Claude crea. Tú decides.</p>' +
      '<table class="tabla"><thead><tr><th>Paso</th><th>Dónde</th><th>Tipo</th></tr></thead><tbody>' +
      [['1. Llenar el brief del cliente (tipografía, colores, funciones)', 'Studio → Nuevo cliente', 'auto'],
       ['2. GENERAR: análisis, 3 conceptos, identidad, código, pruebas y revisión Signature', 'Studio → botón GENERAR (Claude Code trabaja solo)', 'claude'],
       ['3. Seguir el avance etapa por etapa', 'Studio → cliente → Generación', 'auto'],
       ['4. Ver la web', 'Studio → cliente → Vista previa', 'auto'],
       ['5. Pedir cambios', 'Studio → Cambios → Aplicar cambio con Claude', 'claude'],
       ['6. Aprobar y preparar el paquete', 'Studio → Publicación → APROBAR Y PREPARAR PUBLICACIÓN', 'manual'],
       ['7. Publicar en Hostinger', 'Studio → PUBLICAR EN HOSTINGER (resumen) y Claude Code con tu frase de autorización', 'claude']].map(function (f) {
        var t = { auto: 'Automático', claude: 'Claude Code', manual: 'Manual' }[f[2]];
        return '<tr><td>' + f[0] + '</td><td>' + f[1] + '</td><td><span class="tipo ' + f[2] + '">' + t + '</span></td></tr>';
      }).join('') + '</tbody></table>' +
      '<h2>Manual completo</h2><p>El archivo <code>README.md</code> en la carpeta de la fábrica explica todo en detalle.</p>';
  }

  /* ------------------------------------------------------------ rutas */
  function enrutar() {
    var h = location.hash.replace(/^#\/?/, '').split('/');
    if (h[0] === 'nuevo') verNuevo();
    else if (h[0] === 'guia') verGuia();
    else if (h[0] === 'negocio') window.StudioExtra.vistas.negocio(vista);
    else if (h[0] === 'privacidad') window.StudioExtra.vistas.privacidad(vista);
    else if (h[0] === 'cliente' && h[1]) verCliente(decodeURIComponent(h[1]), h[2]);
    else verClientes();
    vista.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  window.Studio = { esc: esc, api: api, aviso: aviso, marcarNav: marcarNav, copiar: copiar, verCliente: verCliente, pPublicacionBasica: pPublicacion };
  window.addEventListener('hashchange', enrutar);
  enrutar();
})();
