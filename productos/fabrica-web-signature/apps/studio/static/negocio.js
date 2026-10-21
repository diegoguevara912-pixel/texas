/* Signature Studio — dominio, plan y pagos, panel de negocio y privacidad.
   Usa las utilidades que app.js expone en window.Studio. */
(function () {
  'use strict';
  function S() { return window.Studio; }
  function esc(t) { return S().esc(t); }
  function dinero(v, moneda) {
    if (v == null) return '<span class="meta">por definir</span>';
    return esc((moneda ? moneda + ' ' : '') + Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  function hoyISO() { return new Date().toISOString().slice(0, 10); }
  function opciones(lista, actual) {
    return lista.map(function (o) { return '<option' + (o === actual ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
  }
  function valor(id) { return document.getElementById(id).value.trim(); }
  function vacio(v) { return v == null ? '' : v; }

  /* ---------------------------------------------------------- pestaña Dominio */
  function pDominio(panel, d, slug) {
    var dom = d.negocio.dominio;
    panel.innerHTML = '<form class="panel" id="f-dom"><h3>Renovación del dominio</h3><span class="tipo auto">Automático</span>' +
      '<div class="columnas-2" style="margin-top:12px">' +
      '<div class="campo"><label for="dn">Dominio</label><input type="text" id="dn" value="' + esc(dom.nombre) + '" placeholder="cliente.com"></div>' +
      '<div class="campo"><label for="dp">Proveedor</label><input type="text" id="dp" value="' + esc(dom.proveedor) + '"></div>' +
      '<div class="campo"><label for="dv">Vence el</label><input type="text" id="dv" value="' + esc(vacio(dom.vence)) + '" placeholder="AAAA-MM-DD"></div>' +
      '<div class="campo"><label for="de">Renovación</label><select id="de">' + opciones(['pagado', 'pendiente', 'no aplica'], dom.estado) + '</select></div>' +
      '<div class="campo"><label for="dm">Monto de la renovación</label><input type="text" id="dm" value="' + esc(vacio(dom.monto)) + '"></div>' +
      '<div class="campo"><label for="dt">Notas</label><input type="text" id="dt" value="' + esc(dom.notas) + '" placeholder="Ej.: el cliente es titular del dominio"></div></div>' +
      '<button type="submit">Guardar</button></form>' +
      (dom.historial && dom.historial.length ? '<h2>Historial</h2><table class="tabla"><thead><tr><th>Fecha</th><th>Estado</th><th>Vence</th></tr></thead><tbody>' +
        dom.historial.slice().reverse().map(function (h) {
          return '<tr><td>' + esc(h.fecha) + '</td><td>' + esc(h.estado) + '</td><td>' + esc(vacio(h.vence)) + '</td></tr>';
        }).join('') + '</tbody></table>' : '') +
      '<p class="meta">Aquí solo se registra el estado. Pagar o renovar el dominio se hace en Hostinger, por ti o por el titular.</p>';
    document.getElementById('f-dom').addEventListener('submit', function (ev) {
      ev.preventDefault();
      S().api('POST', '/api/clientes/' + slug + '/dominio', { nombre: valor('dn'), proveedor: valor('dp'), vence: valor('dv'), estado: valor('de'), monto: valor('dm'), notas: valor('dt') })
        .then(function () { S().aviso('Dominio guardado.'); S().verCliente(slug, 'dominio'); })
        .catch(function (err) { S().aviso(err.message, true); });
    });
  }

  /* ---------------------------------------------------------- pestaña Plan y pagos */
  function pNegocioCliente(panel, d, slug) {
    var n = d.negocio;
    var total = function (estado) {
      return n.ventas.filter(function (x) { return x.estado === estado; }).reduce(function (s, x) { return s + x.monto; }, 0);
    };
    panel.innerHTML = '<div class="rejilla">' +
      '<form class="panel" id="f-sus"><h3>Plan y suscripción</h3><span class="tipo auto">Automático</span>' +
      '<div class="campo" style="margin-top:12px"><label for="sp">Plan</label><select id="sp"><option value="">— Sin plan —</option>' +
        d.planes.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === n.plan ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') + '</select></div>' +
      '<div class="campo"><label for="se">Suscripción</label><select id="se">' + opciones(['activa', 'pausada', 'cancelada', 'sin suscripción'], n.suscripcion.estado) + '</select></div>' +
      '<div class="campo"><label for="si">Inicio</label><input type="text" id="si" value="' + esc(vacio(n.suscripcion.inicio)) + '" placeholder="AAAA-MM-DD"></div>' +
      '<button type="submit">Guardar</button></form>' +
      '<form class="panel" id="f-venta"><h3>Registrar un pago o una venta</h3><span class="tipo auto">Automático</span>' +
      '<div class="columnas-2" style="margin-top:12px">' +
      '<div class="campo"><label for="vf">Fecha</label><input type="text" id="vf" value="' + hoyISO() + '"></div>' +
      '<div class="campo"><label for="vc">Concepto</label><select id="vc">' + opciones(['pagina', 'suscripcion', 'dominio', 'otro'], 'pagina') + '</select></div>' +
      '<div class="campo"><label for="vm">Monto</label><input type="text" id="vm" required></div>' +
      '<div class="campo"><label for="ve">Estado</label><select id="ve">' + opciones(['pagado', 'pendiente'], 'pagado') + '</select></div></div>' +
      '<div class="campo"><label for="vn">Nota</label><input type="text" id="vn" placeholder="Ej.: anticipo del 50 %"></div>' +
      '<button type="submit">Registrar</button></form></div>' +
      '<h2>Pagos de este cliente</h2><p>Cobrado: <b>' + dinero(total('pagado')) + '</b> · Pendiente: <b>' + dinero(total('pendiente')) + '</b></p>' +
      (n.ventas.length ? '<table class="tabla"><thead><tr><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Estado</th><th>Nota</th></tr></thead><tbody>' +
        n.ventas.slice().reverse().map(function (v) {
          return '<tr><td>' + esc(v.fecha) + '</td><td>' + esc(v.concepto) + '</td><td>' + dinero(v.monto) + '</td><td class="r-' + (v.estado === 'pagado' ? 'aprobada' : 'fallida') + '">' + esc(v.estado) + '</td><td>' + esc(v.nota) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p class="meta">Sin pagos registrados.</p>');
    document.getElementById('f-sus').addEventListener('submit', function (ev) {
      ev.preventDefault();
      S().api('POST', '/api/clientes/' + slug + '/suscripcion', { plan: valor('sp'), estado: valor('se'), inicio: valor('si') })
        .then(function () { S().aviso('Guardado.'); S().verCliente(slug, 'negocio'); })
        .catch(function (err) { S().aviso(err.message, true); });
    });
    document.getElementById('f-venta').addEventListener('submit', function (ev) {
      ev.preventDefault();
      S().api('POST', '/api/clientes/' + slug + '/venta', { fecha: valor('vf'), concepto: valor('vc'), monto: valor('vm'), estado: valor('ve'), nota: valor('vn') })
        .then(function () { S().aviso('Registrado.'); S().verCliente(slug, 'negocio'); })
        .catch(function (err) { S().aviso(err.message, true); });
    });
  }

  /* ---------------------------------------------------------- panel Negocio */
  function barras(meses, clave, etiqueta) {
    var max = Math.max.apply(null, meses.map(function (m) { return m[clave]; }).concat([1]));
    return '<div class="barras" role="img" aria-label="' + esc(etiqueta) + '">' + meses.map(function (m) {
      var alto = Math.round(m[clave] / max * 100);
      return '<div class="barra" title="' + esc(m.mes + ': ' + m[clave]) + '"><span style="height:' + alto + '%"></span><small>' + esc(m.mes.slice(5)) + '</small></div>';
    }).join('') + '</div>';
  }
  function kpi(t, v, nota) {
    return '<div class="panel kpi"><p class="meta">' + t + '</p><p class="kpi-v">' + v + '</p>' + (nota ? '<p class="meta">' + nota + '</p>' : '') + '</div>';
  }

  function verNegocio(vista) {
    S().marcarNav('negocio');
    S().api('GET', '/api/negocio').then(function (d) {
      var m = d.metricas, mon = m.moneda, pl = d.planes, ref = pl.dominio_referencia;
      var filaPlan = function (p) {
        return '<tr data-id="' + esc(p.id) + '"><td><input type="text" aria-label="Nombre del plan" class="pn" value="' + esc(p.nombre) + '" placeholder="' + (p.id ? '' : 'Nuevo plan') + '"></td>' +
          '<td><input type="text" aria-label="Valor de la página" class="pv" value="' + esc(vacio(p.valor_pagina)) + '" placeholder="por definir"></td>' +
          '<td><input type="text" aria-label="Mensualidad" class="pmen" value="' + esc(vacio(p.mensualidad)) + '" placeholder="opcional"></td>' +
          '<td><input type="checkbox" aria-label="Incluye dominio" class="pd"' + (p.incluye_dominio ? ' checked' : '') + '></td>' +
          '<td><input type="text" aria-label="Descripción" class="pdes" value="' + esc(p.descripcion) + '"></td></tr>';
      };
      vista.innerHTML = '<h1>Negocio</h1><p class="bajada">Clientes, ventas y crecimiento. Todo sale de lo que registras en cada cliente (pestañas <b>Plan y pagos</b> y <b>Dominio</b>) y en los costos de abajo. Nada se calcula con datos inventados.</p>' +
        '<div class="rejilla kpis">' +
          kpi('Clientes', m.clientes_total, m.clientes_demo + ' demo · ' + m.publicados + ' publicados') +
          kpi('Suscripciones activas', m.clientes_activos, m.activos_sin_mensualidad.length ? m.activos_sin_mensualidad.length + ' sin mensualidad definida' : '') +
          kpi('Ingreso mensual recurrente', dinero(m.mrr, mon)) +
          kpi('Cobrado total', dinero(m.cobrado, mon), 'Por cobrar: ' + dinero(m.por_cobrar, mon)) +
          kpi('Costos totales', dinero(m.costo_total, mon), 'Mensuales recurrentes: ' + dinero(m.costo_mensual_recurrente, mon)) +
          kpi('Resultado', dinero(m.resultado, mon), m.clientes_para_equilibrio ? 'Equilibrio: ' + m.clientes_para_equilibrio + ' clientes activos' : 'Equilibrio: faltan mensualidades o costos') +
        '</div>' +
        '<h2>Ingresos cobrados por mes</h2>' + barras(m.meses, 'ingresos', 'Ingresos cobrados por mes') +
        '<h2>Clientes nuevos por mes</h2>' + barras(m.meses, 'clientes_nuevos', 'Clientes nuevos por mes') +
        '<h2>Dominios</h2>' + (m.dominios.length ? '<table class="tabla"><thead><tr><th>Cliente</th><th>Dominio</th><th>Vence</th><th>Días</th><th>Renovación</th></tr></thead><tbody>' +
          m.dominios.map(function (x) {
            return '<tr><td><a href="#/cliente/' + esc(x.slug) + '/dominio">' + esc(x.cliente) + '</a></td><td>' + esc(vacio(x.dominio)) + '</td><td>' + esc(vacio(x.vence)) + '</td><td>' + esc(vacio(x.dias)) + '</td><td class="' + (x.alerta ? 'r-fallida' : 'r-aprobada') + '">' + esc(x.estado) + (x.alerta ? ' (atención)' : '') + '</td></tr>';
          }).join('') + '</tbody></table>' : '<p class="meta">Sin dominios registrados.</p>') +
        '<h2>Planes y precios</h2><p class="meta">Precio = valor de la página + dominio (+ 12 mensualidades si el plan las tiene). El valor de cada página lo defines tú.</p>' +
        '<form id="f-planes" class="panel"><div class="columnas-2">' +
          '<div class="campo"><label for="pm">Moneda</label><input type="text" id="pm" value="' + esc(pl.moneda) + '"></div>' +
          '<div class="campo"><label for="pe">Extensión del dominio</label><input type="text" id="pe" value="' + esc(ref.extension) + '"></div>' +
          '<div class="campo"><label for="p1">Dominio: precio Hostinger primer año</label><input type="text" id="p1" value="' + esc(vacio(ref.primer_anio)) + '"></div>' +
          '<div class="campo"><label for="p2">Dominio: renovación anual Hostinger</label><input type="text" id="p2" value="' + esc(vacio(ref.renovacion_anual)) + '"></div>' +
          '<div class="campo"><label for="pg">Margen sobre el dominio (%)</label><input type="text" id="pg" value="' + esc(vacio(ref.margen_pct)) + '"></div>' +
          '<div class="campo"><label for="pf">Fuente del precio</label><input type="text" id="pf" value="' + esc(ref.fuente) + '"></div></div>' +
          '<table class="tabla"><thead><tr><th>Plan</th><th>Valor de la página</th><th>Mensualidad</th><th>Incluye dominio</th><th>Descripción</th></tr></thead><tbody id="filas-plan">' +
          pl.planes.concat([{ id: '', nombre: '', valor_pagina: null, mensualidad: null, incluye_dominio: true, descripcion: '' }]).map(filaPlan).join('') + '</tbody></table>' +
          '<div class="acciones"><button type="submit">Guardar planes</button><span class="tipo auto">Automático</span><span class="meta">Para borrar un plan, deja su nombre vacío.</span></div></form>' +
        '<h3 style="margin-top:18px">Cotización</h3><table class="tabla"><thead><tr><th>Plan</th><th>Página</th><th>Dominio 1.er año</th><th>Total primer año</th><th>Años siguientes</th></tr></thead><tbody>' +
          d.cotizacion.map(function (c) {
            return '<tr><td>' + esc(c.nombre) + '</td><td>' + dinero(c.valor_pagina, mon) + '</td><td>' + dinero(c.dominio_primer_anio, mon) + '</td><td>' + dinero(c.total_primer_anio, mon) +
              (c.faltan.length ? '<br><small class="meta">Falta: ' + esc(c.faltan.join(', ')) + '</small>' : '') + '</td><td>' + dinero(c.total_anios_siguientes, mon) + '</td></tr>';
          }).join('') + '</tbody></table>' +
        '<h2>Costos del negocio</h2><form id="f-costo" class="panel"><div class="columnas-2">' +
          '<div class="campo"><label for="cf">Fecha</label><input type="text" id="cf" value="' + hoyISO() + '"></div>' +
          '<div class="campo"><label for="cc">Concepto</label><input type="text" id="cc" placeholder="Ej.: plan de Hostinger" required></div>' +
          '<div class="campo"><label for="cm">Monto</label><input type="text" id="cm" required></div>' +
          '<div class="campo"><label for="cq">Frecuencia</label><select id="cq">' + opciones(['una vez', 'mensual', 'anual'], 'mensual') + '</select></div></div>' +
          '<button type="submit">Registrar costo</button></form>' +
          (d.costos.length ? '<table class="tabla" style="margin-top:12px"><thead><tr><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Frecuencia</th></tr></thead><tbody>' +
            d.costos.slice().reverse().map(function (c) {
              return '<tr><td>' + esc(c.fecha) + '</td><td>' + esc(c.concepto) + '</td><td>' + dinero(c.monto, mon) + '</td><td>' + esc(c.frecuencia) + '</td></tr>';
            }).join('') + '</tbody></table>' : '');
      document.getElementById('f-planes').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var planes = Array.prototype.map.call(document.querySelectorAll('#filas-plan tr'), function (tr) {
          return { id: tr.getAttribute('data-id') || null, nombre: tr.querySelector('.pn').value.trim(), valor_pagina: tr.querySelector('.pv').value.trim(),
            mensualidad: tr.querySelector('.pmen').value.trim(), incluye_dominio: tr.querySelector('.pd').checked, descripcion: tr.querySelector('.pdes').value.trim() };
        });
        S().api('POST', '/api/negocio/planes', { moneda: valor('pm'), dominio_referencia: { extension: valor('pe'), primer_anio: valor('p1'), renovacion_anual: valor('p2'), margen_pct: valor('pg'), fuente: valor('pf') }, planes: planes })
          .then(function () { S().aviso('Planes guardados.'); verNegocio(vista); })
          .catch(function (err) { S().aviso(err.message, true); });
      });
      document.getElementById('f-costo').addEventListener('submit', function (ev) {
        ev.preventDefault();
        S().api('POST', '/api/negocio/costos', { fecha: valor('cf'), concepto: valor('cc'), monto: valor('cm'), frecuencia: valor('cq') })
          .then(function () { S().aviso('Costo registrado.'); verNegocio(vista); })
          .catch(function (err) { S().aviso(err.message, true); });
      });
    }).catch(function (err) { S().aviso(err.message, true); });
  }

  /* ---------------------------------------------------------- Privacidad y seguridad */
  function verPrivacidad(vista) {
    S().marcarNav('privacidad');
    var bloque = function (titulo, items) { return '<div class="panel" style="margin-top:12px"><h3>' + titulo + '</h3><ul>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul></div>'; };
    vista.innerHTML = '<h1>Privacidad y seguridad</h1><p class="bajada">Cómo trata Signature Studio los datos de tus clientes y de las personas que visitan sus páginas.</p>' +
      bloque('Dónde están los datos', [
        'Todo se guarda como archivos en tu computadora, en <code>Fabrica-Web-Signature</code>. Studio no tiene base de datos ni servidor en internet.',
        'Cada cliente tiene su propia carpeta; ningún dato pasa de un cliente a otro.',
        'La carpeta está en tu OneDrive de Zamorano: se respalda, pero esa cuenta la administra la institución.',
        'No se guardan contraseñas, tarjetas ni claves de acceso.']) +
      bloque('Quién puede entrar a Studio', [
        'Solo funciona dentro de tu equipo (127.0.0.1): nadie en internet ni en tu red puede abrirlo.',
        'Cada vez que lo abres se crea una llave nueva. Sin ella, otras personas u otros programas de tu equipo no pueden leer ni cambiar nada.',
        'Studio rechaza acciones enviadas desde otras páginas web.']) +
      bloque('Las páginas de tus clientes', [
        'Por defecto no guardan datos de visitantes: los formularios abren WhatsApp con el mensaje armado.',
        'Toda página que recoja datos lleva su política de privacidad (plantilla en <code>biblioteca/politica-privacidad.md</code>); el control de calidad lo revisa.',
        'Si una página usa base de datos, se protege con reglas de acceso por fila (RLS) antes de publicarla.']) +
      bloque('Recomendado', [
        'Bloquea tu computadora con contraseña y, si puedes, activa el cifrado de disco (BitLocker).',
        'Cierra la ventana negra de Studio cuando no lo uses.',
        'Si guardarás datos de clientes reales, valora mover la fábrica a una carpeta personal que no sea de la institución.']);
  }

  window.StudioExtra = {
    pestanas: { dominio: pDominio, negocio: pNegocioCliente },
    vistas: { negocio: verNegocio, privacidad: verPrivacidad }
  };
})();
