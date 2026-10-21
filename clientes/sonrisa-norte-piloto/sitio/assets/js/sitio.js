/* Sonrisa Norte — navegación «Índice», cabecera y chat de WhatsApp.
   Todo es accesible con teclado (Escape cierra, el foco queda dentro del panel abierto). */
(function () {
  'use strict';
  var config = window.SONRISA_CONFIG || {};

  function numeroWhatsApp() {
    var n = String(config.whatsapp || '').replace(/[^\d]/g, '');
    return n.length >= 8 && n.length <= 15 ? n : '';
  }
  function urlWhatsApp(texto) {
    var n = numeroWhatsApp();
    return n ? 'https://wa.me/' + n + '?text=' + encodeURIComponent(texto) : '';
  }
  window.SonrisaWhatsApp = { numero: numeroWhatsApp, url: urlWhatsApp };

  function enfocables(raiz) {
    return Array.prototype.filter.call(
      raiz.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (n) { return n.offsetParent !== null || n === document.activeElement; }
    );
  }
  function atraparFoco(raiz, e) {
    if (e.key !== 'Tab') return;
    var lista = enfocables(raiz);
    if (!lista.length) return;
    var primero = lista[0], ultimo = lista[lista.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }

  /* ---------- Índice a pantalla completa ---------- */
  function iniciarIndice() {
    var boton = document.querySelector('.boton-indice');
    var indice = document.getElementById('indice');
    if (!boton || !indice) return;
    // Sale de la cabecera: su desenfoque de fondo encerraría al panel fijo.
    document.body.appendChild(indice);
    var cerrarBtn = indice.querySelector('.indice-cerrar');

    function abrir() {
      indice.classList.add('abierto');
      boton.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('indice-abierto');
      var actual = indice.querySelector('[aria-current="page"]') || indice.querySelector('a');
      setTimeout(function () { (actual || cerrarBtn).focus(); }, 60);
    }
    function cerrar(devolverFoco) {
      indice.classList.remove('abierto');
      boton.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('indice-abierto');
      if (devolverFoco) boton.focus();
    }
    boton.addEventListener('click', function () {
      if (indice.classList.contains('abierto')) cerrar(true); else abrir();
    });
    cerrarBtn.addEventListener('click', function () { cerrar(true); });
    indice.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { cerrar(true); return; }
      atraparFoco(indice, e);
    });
    indice.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { cerrar(false); });
    });
  }

  /* ---------- Cabecera: línea inferior al desplazarse ---------- */
  function iniciarCabecera() {
    var cabecera = document.querySelector('.cabecera');
    if (!cabecera) return;
    var marcar = function () { cabecera.classList.toggle('con-borde', window.scrollY > 8); };
    window.addEventListener('scroll', marcar, { passive: true });
    marcar();
  }

  /* ---------- Chat de WhatsApp ---------- */
  var MENSAJES = [
    { etiqueta: 'Quiero agendar una cita', texto: 'Hola, quisiera agendar una cita en Sonrisa Norte.' },
    { etiqueta: 'Tengo una duda sobre un tratamiento', texto: 'Hola, tengo una duda sobre un tratamiento.' },
    { etiqueta: '¿Dónde están y en qué horario?', texto: 'Hola, ¿me pueden indicar su dirección y horario?' }
  ];

  function iniciarChat() {
    var enlace = document.querySelector('[data-wa-chat]');
    if (!enlace) return;

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = enlace.className;
    boton.innerHTML = enlace.innerHTML;
    boton.setAttribute('aria-label', 'Abrir chat de WhatsApp');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-controls', 'wa-panel');
    enlace.replaceWith(boton);

    var panel = document.createElement('div');
    panel.className = 'wa-panel';
    panel.id = 'wa-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'wa-panel-titulo');
    panel.hidden = true;
    panel.innerHTML =
      '<button class="wa-panel-cerrar" type="button" aria-label="Cerrar chat">×</button>' +
      '<p class="wa-panel-titulo" id="wa-panel-titulo">Escríbanos por WhatsApp</p>' +
      '<p class="wa-panel-texto">Elija cómo empezar. Podrá cambiar el mensaje antes de enviarlo.</p>' +
      '<ul class="wa-panel-opciones"></ul>' +
      '<p class="wa-panel-estado" role="status" aria-live="polite"></p>' +
      '<p class="wa-panel-texto" style="margin:1rem 0 0">¿Prefiere elegir día y tratamiento? <a href="agenda.html">Complete la solicitud de cita</a>.</p>';
    var lista = panel.querySelector('.wa-panel-opciones');
    var estado = panel.querySelector('.wa-panel-estado');
    MENSAJES.forEach(function (m) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = m.etiqueta;
      b.addEventListener('click', function () {
        var url = urlWhatsApp(m.texto);
        if (url) {
          window.open(url, '_blank', 'noopener');
          estado.textContent = 'Abriendo WhatsApp…';
        } else {
          estado.textContent = 'Demostración: la clínica aún no tiene número de WhatsApp configurado. Su mensaje sería: «' + m.texto + '»';
        }
      });
      li.appendChild(b);
      lista.appendChild(li);
    });
    document.body.appendChild(panel);

    function abrir() {
      panel.hidden = false;
      boton.setAttribute('aria-expanded', 'true');
      estado.textContent = '';
      panel.querySelector('.wa-panel-opciones button').focus();
    }
    function cerrar() {
      panel.hidden = true;
      boton.setAttribute('aria-expanded', 'false');
      boton.focus();
    }
    boton.addEventListener('click', function () { if (panel.hidden) abrir(); else cerrar(); });
    panel.querySelector('.wa-panel-cerrar').addEventListener('click', cerrar);
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrar();
      else atraparFoco(panel, e);
    });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !panel.contains(e.target) && !boton.contains(e.target)) {
        panel.hidden = true;
        boton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function iniciar() {
    iniciarIndice();
    iniciarCabecera();
    iniciarChat();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
