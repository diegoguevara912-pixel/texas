/* Sonrisa Norte · «Una pausa luminosa»: coreografía propia de la marca.
   - Índice de capítulos: marca el capítulo visible (aria-current) para orientarse en la página.
   - Escena «Respirar»: el anillo crece y se contrae con el scroll (lo mueve base/motion con --sm-p);
     aquí solo se actualiza la guía de texto. Con movimiento reducido la guía queda fija. */
(function () {
  'use strict';
  var enlaces = Array.prototype.slice.call(document.querySelectorAll('.capitulos a'));
  if (enlaces.length && 'IntersectionObserver' in window) {
    var porId = {};
    enlaces.forEach(function (a) { porId[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        enlaces.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = porId[e.target.id];
        if (a) a.setAttribute('aria-current', 'true');
        var oscuro = e.target.classList.contains('noche') || e.target.classList.contains('respirar-escena');
        document.querySelector('.capitulos').style.color = oscuro ? 'var(--color-noche-texto)' : 'var(--color-texto)';
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(porId).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
  }

  var escena = document.querySelector('.respirar-escena');
  var guia = escena && escena.querySelector('.respirar-guia');
  var reducir = window.SignatureMotion && (window.SignatureMotion.reducir || window.SignatureMotion.ligero);
  if (!escena || !guia || reducir) return;
  var ultimo = '';
  function actualizar() {
    var p = parseFloat(escena.style.getPropertyValue('--sm-p')) || 0;
    var texto = p < 0.06 ? 'Baje despacio…' : p < 0.5 ? 'Inhale…' : p < 0.94 ? 'Exhale…' : 'Así de simple. Así empieza su visita.';
    if (texto !== ultimo) { guia.textContent = texto; ultimo = texto; }
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(actualizar); }, { passive: true });
  actualizar();
})();
