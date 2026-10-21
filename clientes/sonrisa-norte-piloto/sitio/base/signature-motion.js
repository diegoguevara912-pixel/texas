/* FÁBRICA WEB SIGNATURE — utilidades de movimiento (sin dependencias).
   - Revela elementos con [data-revelar] al entrar en pantalla.
   - [data-revelar-retraso="120"] escalona en milisegundos.
   - Respeta prefers-reduced-motion: si el visitante lo pide, todo se muestra sin animar.
   La coreografía particular de cada sitio se escribe aparte, según su concepto. */
(function () {
  var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducir || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-motion');

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;
      var el = entrada.target;
      var retraso = parseInt(el.getAttribute('data-revelar-retraso') || '0', 10);
      setTimeout(function () { el.classList.add('revelado'); }, retraso);
      observador.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  function iniciar() {
    document.querySelectorAll('[data-revelar]').forEach(function (el) { observador.observe(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

  window.SignatureMotion = { reducir: reducir };
})();
