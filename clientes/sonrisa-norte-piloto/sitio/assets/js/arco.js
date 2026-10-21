/* Sonrisa Norte — el arco dental ilustrado (vista superior).
   Dibuja las piezas a lo largo de una curva y muestra cada tratamiento:
   limpieza (sale el sarro, se ilumina la encía), ortodoncia (piezas que se alinean bajo un
   alineador), implantes (la pieza que falta vuelve con su raíz) y niños (arco de dientes de leche).
   Sin dependencias. Con movimiento reducido, cada estado se muestra directamente. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Medidas aproximadas de cada pieza en mm (desde la línea media hacia atrás): ancho y profundidad.
  var ADULTO = { cx: 200, cy: 330, rx: 140, ry: 268,
    anchos: [8.5, 6.5, 7.5, 7, 6.5, 10, 9, 8.5], fondos: [7, 6.5, 8, 9, 9, 11, 10.5, 9.5] };
  var NINO = { cx: 200, cy: 318, rx: 92, ry: 168,
    anchos: [6.5, 5.2, 7, 7.3, 8.2], fondos: [5.5, 5, 6, 8, 9] };
  var IMPLANTE = { lado: 1, i: 5 };            // primer molar a la derecha del dibujo
  var DESVIO = {                                // apiñamiento de ejemplo (solo piezas delanteras)
    '1': { d: [5, -7, 6, -4], r: [9, -13, 11, -6] },
    '-1': { d: [-6, 8, -5, 3], r: [-11, 8, -12, 5] }
  };

  function el(nombre, atributos, padre) {
    var n = document.createElementNS(NS, nombre);
    for (var k in atributos) n.setAttribute(k, atributos[k]);
    if (padre) padre.appendChild(n);
    return n;
  }

  function muestrear(g, n) {
    var pts = [], acum = [0], total = 0;
    for (var i = 0; i <= n; i++) {
      var f = (i / n) * Math.PI / 2;
      var p = { x: g.cx + g.rx * Math.sin(f), y: g.cy - g.ry * Math.cos(f), f: f };
      if (i > 0) { total += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y); acum.push(total); }
      pts.push(p);
    }
    return { pts: pts, acum: acum, total: total };
  }

  function puntoEn(m, largo) {
    for (var i = 1; i < m.acum.length; i++) {
      if (m.acum[i] >= largo) {
        var t = (largo - m.acum[i - 1]) / (m.acum[i] - m.acum[i - 1]);
        var a = m.pts[i - 1], b = m.pts[i];
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, f: a.f + (b.f - a.f) * t };
      }
    }
    return m.pts[m.pts.length - 1];
  }

  function calcular(g) {
    var m = muestrear(g, 240);
    var separacion = 0.5;
    var suma = g.anchos.reduce(function (a, b) { return a + b; }, 0) + separacion * g.anchos.length;
    var s = (m.total * 0.97) / suma;
    var piezas = [];
    var pos = separacion * s / 2;
    g.anchos.forEach(function (ancho, i) {
      var centro = pos + ancho * s / 2;
      pos += (ancho + separacion) * s;
      var p = puntoEn(m, centro);
      var ang = Math.atan2(g.ry * Math.sin(p.f), g.rx * Math.cos(p.f)) * 180 / Math.PI;
      var base = { i: i, w: ancho * s, d: g.fondos[i] * s };
      piezas.push(Object.assign({ lado: 1, x: p.x, y: p.y, a: ang }, base));
      piezas.push(Object.assign({ lado: -1, x: 2 * g.cx - p.x, y: p.y, a: -ang }, base));
    });
    var fondoMax = Math.max.apply(null, g.fondos) * s;
    return { piezas: piezas, m: m, s: s, fondoMax: fondoMax };
  }

  function rutaArco(g, m, extra) {
    // Recorre el arco de atrás-izquierda a atrás-derecha; «extra» abre o cierra la curva.
    var rx = g.rx + extra, ry = g.ry + extra, partes = [], i, f;
    var n = m.pts.length - 1;
    for (i = n; i >= 0; i--) { f = m.pts[i].f; partes.push([g.cx - rx * Math.sin(f), g.cy - ry * Math.cos(f)]); }
    for (i = 1; i <= n; i++) { f = m.pts[i].f; partes.push([g.cx + rx * Math.sin(f), g.cy - ry * Math.cos(f)]); }
    return 'M' + partes.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L');
  }

  function transformar(p, desviado) {
    var x = p.x, y = p.y, a = p.a;
    if (desviado && p.i < 4) {
      var tabla = DESVIO[String(p.lado)];
      var rad = a * Math.PI / 180;
      x += -Math.sin(rad) * tabla.d[p.i];
      y += Math.cos(rad) * tabla.d[p.i];
      a += tabla.r[p.i];
    }
    return 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) rotate(' + a.toFixed(2) + 'deg)';
  }

  function dibujarPieza(p, padre, conSarro) {
    var g = el('g', { 'class': 'pieza' }, padre);
    g.style.transform = transformar(p, false);
    var radio = Math.min(p.w, p.d) * (p.i < 3 ? 0.46 : 0.36);
    el('rect', { 'class': 'pieza-forma', x: (-p.w / 2).toFixed(2), y: (-p.d / 2).toFixed(2),
      width: p.w.toFixed(2), height: p.d.toFixed(2), rx: radio.toFixed(2) }, g);
    // Surco central: recto en premolares, ondulado en molares (una cruz se leía como «+»).
    if (p.i >= 3 && p.i < 5) {
      el('path', { 'class': 'pieza-surco', d: 'M' + (-p.w * 0.24).toFixed(1) + ' 0L' + (p.w * 0.24).toFixed(1) + ' 0' }, g);
    }
    if (p.i >= 5) {
      var a = (p.w * 0.28).toFixed(1), b = (p.w * 0.1).toFixed(1), h = (p.d * 0.12).toFixed(1);
      el('path', { 'class': 'pieza-surco', d: 'M-' + a + ' 0C-' + b + ' -' + h + ' ' + b + ' ' + h + ' ' + a + ' 0' }, g);
    }
    if (conSarro && [0, 1, 3, 5].indexOf(p.i) !== -1) {
      el('circle', { 'class': 'sarro', cx: (-p.w * 0.18).toFixed(1), cy: (-p.d * 0.36).toFixed(1), r: 2.4 }, g);
      el('circle', { 'class': 'sarro', cx: (p.w * 0.2).toFixed(1), cy: (-p.d * 0.4).toFixed(1), r: 1.8 }, g);
    }
    return g;
  }

  function dibujarGrupo(g, svg, clase, conDetalles) {
    var c = calcular(g);
    var grupo = el('g', { 'class': clase }, svg);
    var encia = el('path', { 'class': 'encia', d: rutaArco(g, c.m, 0), 'stroke-width': (c.fondoMax + 16).toFixed(1) }, grupo);
    var mitad = c.fondoMax / 2 + 8;
    el('path', { 'class': 'encia-linea', d: rutaArco(g, c.m, mitad) }, grupo);
    el('path', { 'class': 'encia-linea', d: rutaArco(g, c.m, -mitad) }, grupo);
    var piezasG = el('g', {}, grupo);
    var refs = [];
    c.piezas.sort(function (a, b) { return a.i - b.i; }).forEach(function (p) {
      var nodo = dibujarPieza(p, piezasG, conDetalles);
      nodo.style.transitionDelay = '';
      refs.push({ datos: p, nodo: nodo });
    });
    if (conDetalles) {
      var alineador = el('g', { 'class': 'alineador' }, grupo);
      el('path', { 'class': 'alineador-banda', d: rutaArco(g, c.m, 0), 'stroke-width': (c.fondoMax + 6).toFixed(1) }, alineador);
      el('path', { 'class': 'alineador-borde', d: rutaArco(g, c.m, c.fondoMax / 2 + 3) }, alineador);
      el('path', { 'class': 'alineador-borde', d: rutaArco(g, c.m, -(c.fondoMax / 2 + 3)) }, alineador);
    }
    return { grupo: grupo, encia: encia, capaPiezas: piezasG, piezas: refs };
  }

  function crear(contenedor, opciones) {
    opciones = opciones || {};
    var svg = el('svg', { viewBox: '0 0 400 380', focusable: 'false', 'aria-hidden': 'true' });
    var respira = el('g', { 'class': 'arco-respira' }, svg);
    var adulto = dibujarGrupo(ADULTO, respira, 'grupo-adulto', true);
    var nino = dibujarGrupo(NINO, respira, 'grupo-nino', false);

    // La pieza del implante: hueco punteado y raíz, en la misma posición que la pieza.
    var objetivo = adulto.piezas.filter(function (r) { return r.datos.lado === IMPLANTE.lado && r.datos.i === IMPLANTE.i; })[0];
    var marca = el('g', {}, adulto.grupo);
    marca.style.transform = transformar(objetivo.datos, false);
    el('rect', { 'class': 'hueco', x: (-objetivo.datos.w / 2).toFixed(1), y: (-objetivo.datos.d / 2).toFixed(1),
      width: objetivo.datos.w.toFixed(1), height: objetivo.datos.d.toFixed(1), rx: (objetivo.datos.w * 0.36).toFixed(1) }, marca);
    var implante = el('g', { 'class': 'implante' }, marca);
    el('circle', { 'class': 'implante-poste', r: (objetivo.datos.w * 0.2).toFixed(1) }, implante);
    el('path', { 'class': 'implante-rosca', d: 'M-5 -2.5L5 -2.5M-5 2.5L5 2.5' }, implante);
    adulto.grupo.insertBefore(marca, adulto.capaPiezas);   // debajo de las piezas: la corona tapa la raíz

    contenedor.classList.add('arco');
    if (opciones.mini) contenedor.classList.add('arco-mini');
    contenedor.appendChild(svg);
    svg.style.setProperty('--largo', Math.ceil(adulto.encia.getTotalLength ? adulto.encia.getTotalLength() : 1200));

    var temporizadores = [];
    function limpiarTiempos() { temporizadores.forEach(clearTimeout); temporizadores = []; }
    function luego(ms, fn) { temporizadores.push(setTimeout(fn, ms)); }

    function alinear(desviado, escalonar) {
      adulto.piezas.forEach(function (r) {
        r.nodo.style.transitionDelay = escalonar ? (r.datos.i * 22) + 'ms' : '';
        r.nodo.style.transform = transformar(r.datos, desviado);
      });
    }

    function reiniciar() {
      limpiarTiempos();
      contenedor.classList.remove('sarro-visible', 'implante-visible', 'fase-hueco');
      objetivo.nodo.classList.remove('ausente', 'nueva');
      alinear(false, false);
    }

    function mostrar(estado, animar) {
      reiniciar();
      var conMovimiento = animar && !reducir;
      if (!conMovimiento) {
        contenedor.setAttribute('data-estado', estado || 'neutral');
        if (estado === 'implantes') objetivo.nodo.classList.add('nueva');
        return;
      }
      if (estado === 'limpieza') {
        contenedor.setAttribute('data-estado', 'limpieza-antes');
        contenedor.classList.add('sarro-visible');
        luego(1100, function () {
          contenedor.classList.remove('sarro-visible');
          contenedor.setAttribute('data-estado', 'limpieza');
        });
      } else if (estado === 'ortodoncia') {
        contenedor.setAttribute('data-estado', 'ortodoncia-antes');
        alinear(true, false);
        luego(900, function () {
          contenedor.setAttribute('data-estado', 'ortodoncia');
          alinear(false, true);
        });
      } else if (estado === 'implantes') {
        contenedor.setAttribute('data-estado', 'implantes');
        objetivo.nodo.classList.add('ausente');
        contenedor.classList.add('fase-hueco');
        luego(700, function () { contenedor.classList.add('implante-visible'); });
        luego(1600, function () {
          objetivo.nodo.classList.remove('ausente');
          objetivo.nodo.classList.add('nueva');
          contenedor.classList.remove('fase-hueco');
        });
      } else {
        contenedor.setAttribute('data-estado', estado || 'neutral');
      }
    }

    // Dibujo inicial: la encía se traza y las piezas aparecen desde el centro hacia atrás.
    if (opciones.mini || reducir) {
      contenedor.classList.add('dibujado');
    } else {
      adulto.piezas.forEach(function (r) { r.nodo.style.transitionDelay = (250 + r.datos.i * 70) + 'ms'; });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { contenedor.classList.add('dibujado'); });
      });
      setTimeout(function () { adulto.piezas.forEach(function (r) { r.nodo.style.transitionDelay = ''; }); }, 1600);
    }
    contenedor.setAttribute('data-estado', 'neutral');
    return { mostrar: mostrar };
  }

  function iniciarSelector(raiz) {
    var arco = crear(raiz.querySelector('[data-arco]'));
    var botones = raiz.querySelectorAll('[data-estado]');
    var respuestas = raiz.querySelectorAll('[data-respuesta]');
    var inicial = raiz.querySelector('.respuesta-inicial');
    function elegir(estado) {
      botones.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-estado') === estado)); });
      respuestas.forEach(function (r) { r.classList.toggle('activa', r.getAttribute('data-respuesta') === estado); });
      if (inicial) inicial.hidden = Boolean(estado);
      arco.mostrar(estado, true);
    }
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        var estado = b.getAttribute('data-estado');
        elegir(b.getAttribute('aria-pressed') === 'true' ? '' : estado);
      });
    });
  }

  function iniciar() {
    var selector = document.querySelector('[data-selector]');
    if (selector) iniciarSelector(selector);

    document.querySelectorAll('[data-arco-mini]').forEach(function (c) {
      crear(c, { mini: true }).mostrar(c.getAttribute('data-arco-mini'), false);
    });

    var automaticos = document.querySelectorAll('[data-arco-auto]');
    if (!automaticos.length) return;
    var lista = [];
    automaticos.forEach(function (c) { lista.push({ c: c, arco: crear(c) }); });
    if (!('IntersectionObserver' in window)) {
      lista.forEach(function (x) { x.arco.mostrar(x.c.getAttribute('data-arco'), false); });
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var x = lista.filter(function (y) { return y.c === e.target; })[0];
        setTimeout(function () { x.arco.mostrar(x.c.getAttribute('data-arco'), true); }, 500);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.45 });
    lista.forEach(function (x) { obs.observe(x.c); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
