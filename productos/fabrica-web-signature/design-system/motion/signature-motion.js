/* FÁBRICA WEB SIGNATURE · Motor de movimiento 2.0 (sin dependencias, ~8 KB).
   Se controla desde el HTML con atributos y desde tokens.css con variables --mov-*.
   La coreografía es de cada marca: este archivo solo da las herramientas.

   ATRIBUTOS
   data-sm="aparecer"                 aparece al entrar en pantalla
       data-sm-desde="abajo|arriba|izquierda|derecha|escala|desenfoque|nada"
       data-sm-retraso="120"          milisegundos
   data-sm="lineas|palabras|letras"   divide el texto y lo revela por partes (con máscara)
   data-sm="mascara"                  descubre una imagen o bloque con una cortina (data-sm-desde)
   data-sm-grupo                      escalona a sus hijos directos con --mov-escalonado
   data-sm="parallax" data-sm-velocidad="0.15"    desplazamiento por capas (-1 a 1)
   data-sm="progreso"                 escribe --sm-p (0→1) mientras el elemento cruza la pantalla:
                                      con un contenedor alto + position:sticky crea escenas ligadas al scroll
       data-sm-modo="cruce|dentro"    cruce: desde que asoma hasta que sale; dentro: mientras está fijado
   data-sm="trazo"                    dibuja los <path> de un SVG (al entrar o con data-sm-ligado="progreso")
   data-sm="contador" data-sm-hasta="120" data-sm-decimales="0"   SOLO datos reales verificados
   data-sm="magnetico"                el botón sigue levemente al cursor (solo ratón)
   data-sm="inclinar"                 la tarjeta se inclina con el cursor (solo ratón)
   data-sm-fondo="#0E1A14"            al llegar a la sección, el fondo del <body> cambia a ese color
       data-sm-texto="#F4EFE6"        (y el color del texto, opcional)
   data-sm="cabecera"                 la cabecera se oculta al bajar y vuelve al subir

   ACCESIBILIDAD Y RENDIMIENTO
   - prefers-reduced-motion: nada se mueve; todo el contenido queda visible y estático.
   - Sin JavaScript todo es visible: solo se oculta lo animable cuando <html> tiene .sm-activo.
   - Equipos modestos o «ahorro de datos»: sin parallax, inclinación ni magnetismo (modo ligero).
   - Solo se animan transform, opacity, clip-path y filter. Un único requestAnimationFrame. */
(function () {
  'use strict';
  var raiz = document.documentElement;
  var mm = function (q) { return window.matchMedia ? window.matchMedia(q).matches : false; };
  var reducir = mm('(prefers-reduced-motion: reduce)');
  var conexion = navigator.connection || {};
  var ligero = reducir || conexion.saveData === true ||
    ((navigator.hardwareConcurrency || 8) <= 4 && (navigator.deviceMemory || 8) <= 4);
  var raton = mm('(hover: hover) and (pointer: fine)');
  var api = { reducir: reducir, ligero: ligero, refrescar: iniciar, version: '2.0' };
  window.SignatureMotion = api;
  if (reducir || !('IntersectionObserver' in window)) { raiz.classList.add('sm-estatico'); return; }
  raiz.classList.add('sm-activo');
  if (ligero) raiz.classList.add('sm-ligero');

  function num(el, attr, def) { var v = parseFloat(el.getAttribute(attr)); return isNaN(v) ? def : v; }
  function token(nombre, def) {
    var v = getComputedStyle(raiz).getPropertyValue(nombre).trim();
    return v ? parseFloat(v) : def;
  }

  /* ---------- dividir texto (accesible: el lector de pantalla lee el texto original) */
  function dividir(el, modo) {
    if (el.getAttribute('data-sm-dividido')) return;
    var texto = el.textContent;
    el.setAttribute('aria-label', texto.replace(/\s+/g, ' ').trim());
    var piezas = [];
    if (modo === 'letras') {
      piezas = Array.from(texto);
    } else {
      piezas = texto.split(/(\s+)/);
    }
    var html = '';
    var i = 0;
    piezas.forEach(function (p) {
      if (/^\s+$/.test(p)) { html += ' '; return; }
      html += '<span class="sm-pieza" aria-hidden="true"><span class="sm-interior" style="--sm-i:' + (i++) + '">' +
        p.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span></span>';
    });
    // conserva <em>/<strong> simples: si el título los tiene, se divide cada hijo por separado
    if (el.children.length && modo !== 'letras') {
      var n = 0;
      Array.from(el.childNodes).forEach(function (nodo) {
        if (nodo.nodeType === 3) {
          var span = document.createElement('span');
          span.innerHTML = nodo.textContent.split(/(\s+)/).map(function (p) {
            return /^\s+$/.test(p) || !p ? p : '<span class="sm-pieza" aria-hidden="true"><span class="sm-interior" style="--sm-i:' + (n++) + '">' + p.replace(/</g, '&lt;') + '</span></span>';
          }).join('');
          nodo.replaceWith.apply(nodo, Array.from(span.childNodes));
        } else if (nodo.nodeType === 1) {
          nodo.setAttribute('aria-hidden', 'true');
          nodo.innerHTML = nodo.textContent.split(/(\s+)/).map(function (p) {
            return /^\s+$/.test(p) || !p ? p : '<span class="sm-pieza"><span class="sm-interior" style="--sm-i:' + (n++) + '">' + p.replace(/</g, '&lt;') + '</span></span>';
          }).join('');
        }
      });
    } else {
      el.innerHTML = html;
    }
    el.setAttribute('data-sm-dividido', modo);
    if (modo === 'lineas') agruparLineas(el);
  }
  function agruparLineas(el) {
    var linea = -1, top = null;
    el.querySelectorAll('.sm-interior').forEach(function (s) {
      var t = s.parentNode.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { linea++; top = t; }
      s.style.setProperty('--sm-i', linea);
    });
  }

  /* ---------- aparición al entrar en pantalla */
  var visibles = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) return;
      // una máscara cerrada recorta su propia caja y el observador no la «ve»: se observa a su contenedor
      (e.target._smMascaras || [e.target]).forEach(function (el) {
        var retraso = num(el, 'data-sm-retraso', 0);
        setTimeout(function () { el.classList.add('sm-visto'); disparar(el); }, retraso);
      });
      visibles.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  function disparar(el) {
    var tipo = el.getAttribute('data-sm');
    if (tipo === 'contador') contar(el);
    if (tipo === 'trazo' && el.getAttribute('data-sm-ligado') !== 'progreso') el.classList.add('sm-trazado');
  }

  /* ---------- contadores (solo cifras reales) */
  function contar(el) {
    var hasta = num(el, 'data-sm-hasta', 0), dec = num(el, 'data-sm-decimales', 0);
    var dur = token('--mov-duracion', 900) * 1.6, t0 = performance.now();
    var fmt = new Intl.NumberFormat(document.documentElement.lang || 'es', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    (function paso(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt.format(hasta * e);
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
  }

  /* ---------- trazos SVG */
  function prepararTrazo(svg) {
    svg.querySelectorAll('path, line, polyline, circle, rect').forEach(function (p) {
      if (!p.getTotalLength) return;
      var l = Math.ceil(p.getTotalLength());
      p.style.setProperty('--sm-largo', l);
      p.style.strokeDasharray = l;
    });
  }

  /* ---------- todo lo que depende del scroll, en un solo requestAnimationFrame */
  var conScroll = [], fondos = [], cabecera = null, ultimoY = window.scrollY, pendiente = false;
  function alScroll() { if (!pendiente) { pendiente = true; requestAnimationFrame(cuadro); } }
  function cuadro() {
    pendiente = false;
    var vh = window.innerHeight, y = window.scrollY;
    for (var i = 0; i < conScroll.length; i++) {
      var o = conScroll[i], r = o.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      if (o.tipo === 'parallax') {
        var centro = r.top + r.height / 2 - vh / 2;
        o.el.style.transform = 'translate3d(0,' + (-centro * o.vel).toFixed(1) + 'px,0)';
      } else {
        var p = o.modo === 'dentro'
          ? (-r.top) / Math.max(1, r.height - vh)
          : (vh - r.top) / (vh + r.height);
        p = Math.max(0, Math.min(1, p));
        o.el.style.setProperty('--sm-p', p.toFixed(4));
        if (o.trazo) o.el.style.setProperty('--sm-trazo', (1 - p).toFixed(4));
      }
    }
    if (fondos.length) {
      var activa = null;
      for (var j = 0; j < fondos.length; j++) {
        var rf = fondos[j].getBoundingClientRect();
        if (rf.top < vh * 0.55 && rf.bottom > vh * 0.45) activa = fondos[j];
      }
      if (activa !== api._fondo) {
        api._fondo = activa;
        document.body.style.backgroundColor = activa ? activa.getAttribute('data-sm-fondo') : '';
        document.body.style.color = activa && activa.getAttribute('data-sm-texto') ? activa.getAttribute('data-sm-texto') : '';
      }
    }
    if (cabecera) {
      var bajando = y > ultimoY && y > 120;
      cabecera.classList.toggle('sm-oculta', bajando);
      cabecera.classList.toggle('sm-con-fondo', y > 24);
    }
    ultimoY = y;
  }

  /* ---------- cursor: magnetismo e inclinación (solo ratón y equipos capaces) */
  function magnetico(el) {
    var fuerza = num(el, 'data-sm-fuerza', 0.25);
    el.addEventListener('pointermove', function (ev) {
      var r = el.getBoundingClientRect();
      el.style.transform = 'translate(' + ((ev.clientX - r.left - r.width / 2) * fuerza).toFixed(1) + 'px,' + ((ev.clientY - r.top - r.height / 2) * fuerza).toFixed(1) + 'px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  }
  function inclinar(el) {
    var max = num(el, 'data-sm-grados', 6);
    el.addEventListener('pointermove', function (ev) {
      var r = el.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
      el.style.transform = 'perspective(900px) rotateY(' + (x * max).toFixed(2) + 'deg) rotateX(' + (-y * max).toFixed(2) + 'deg)';
      el.style.setProperty('--sm-luz-x', ((x + 0.5) * 100).toFixed(1) + '%');
      el.style.setProperty('--sm-luz-y', ((y + 0.5) * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  }

  function iniciar() {
    conScroll = []; fondos = [];
    // compatibilidad con la versión 1: [data-revelar] sigue funcionando
    document.querySelectorAll('[data-revelar]').forEach(function (el) {
      if (!el.hasAttribute('data-sm')) el.setAttribute('data-sm', 'aparecer');
      if (el.hasAttribute('data-revelar-retraso')) el.setAttribute('data-sm-retraso', el.getAttribute('data-revelar-retraso'));
    });
    document.querySelectorAll('[data-sm-grupo]').forEach(function (g) {
      var paso = num(g, 'data-sm-grupo', 0) || token('--mov-escalonado', 80);
      Array.from(g.children).forEach(function (h, i) {
        if (!h.hasAttribute('data-sm')) h.setAttribute('data-sm', 'aparecer');
        if (!h.hasAttribute('data-sm-retraso')) h.setAttribute('data-sm-retraso', String(Math.round(i * paso)));
      });
    });
    document.querySelectorAll('[data-sm]').forEach(function (el) {
      var tipo = el.getAttribute('data-sm');
      if (tipo === 'lineas' || tipo === 'palabras' || tipo === 'letras') dividir(el, tipo);
      if (tipo === 'trazo') prepararTrazo(el);
      if (tipo === 'parallax') {
        if (!ligero) conScroll.push({ el: el, tipo: 'parallax', vel: num(el, 'data-sm-velocidad', token('--mov-parallax', 0.1)) });
        return;
      }
      if (tipo === 'progreso' || (tipo === 'trazo' && el.getAttribute('data-sm-ligado') === 'progreso')) {
        conScroll.push({ el: el, tipo: 'progreso', modo: el.getAttribute('data-sm-modo') || 'cruce', trazo: tipo === 'trazo' });
        if (tipo === 'progreso') return;
      }
      if (tipo === 'cabecera') { cabecera = el; return; }
      if (tipo === 'magnetico') { if (raton && !ligero) magnetico(el); return; }
      if (tipo === 'inclinar') { if (raton && !ligero) inclinar(el); return; }
      if (tipo === 'mascara' && el.parentElement) {
        var padre = el.parentElement;
        (padre._smMascaras = padre._smMascaras || (padre.hasAttribute("data-sm") ? [padre] : [])).push(el);
        visibles.observe(padre);
        return;
      }
      visibles.observe(el);
    });
    document.querySelectorAll('[data-sm-fondo]').forEach(function (s) { fondos.push(s); });
    cuadro();
  }

  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', function () {
    document.querySelectorAll('[data-sm-dividido="lineas"]').forEach(agruparLineas);
    alScroll();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
