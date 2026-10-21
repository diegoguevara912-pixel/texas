/* Sonrisa Norte — «Un minuto para respirar»: 6 ciclos de 4 s inhalando y 6 s exhalando.
   El círculo crece y se encoge; con movimiento reducido queda quieto y la guía es solo texto.
   Se puede detener en cualquier momento. No recoge datos. */
(function () {
  'use strict';
  var caja = document.querySelector('[data-respirar]');
  if (!caja) return;
  var boton = caja.querySelector('[data-respirar-boton]');
  var estado = caja.querySelector('.respirar-estado');
  var CICLOS = 6, INHALAR = 4, EXHALAR = 6;
  var reloj = null, activo = false;
  // La cuenta segundo a segundo es solo visual; el lector de pantalla oye el cambio de fase.
  var cuenta = document.createElement('span');
  cuenta.className = 'respirar-cuenta';
  cuenta.setAttribute('aria-hidden', 'true');
  caja.querySelector('.respirar-circulo').appendChild(cuenta);

  function detener(texto) {
    clearTimeout(reloj);
    activo = false;
    caja.classList.remove('inhalar', 'exhalar');
    boton.textContent = 'Empezar';
    cuenta.textContent = '';
    estado.textContent = texto;
  }

  function fase(ciclo, nombre, segundos, siguiente) {
    caja.classList.remove('inhalar', 'exhalar');
    caja.classList.add(nombre === 'Inhale' ? 'inhalar' : 'exhalar');
    estado.textContent = nombre + ', ' + segundos + ' segundos · ciclo ' + ciclo + ' de ' + CICLOS;
    var restante = segundos;
    function tic() {
      if (!activo) return;
      if (restante === 0) { siguiente(); return; }
      cuenta.textContent = restante;
      restante -= 1;
      reloj = setTimeout(tic, 1000);
    }
    tic();
  }

  function ciclo(n) {
    if (!activo) return;
    if (n > CICLOS) { detener('Listo. Ya puede ir con calma.'); return; }
    fase(n, 'Inhale', INHALAR, function () {
      fase(n, 'Exhale', EXHALAR, function () { ciclo(n + 1); });
    });
  }

  boton.addEventListener('click', function () {
    if (activo) { detener('Pausado. Cuando quiera, empiece de nuevo.'); return; }
    activo = true;
    boton.textContent = 'Detener';
    ciclo(1);
  });
})();
