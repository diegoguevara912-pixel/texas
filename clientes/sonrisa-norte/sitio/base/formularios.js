/* FÁBRICA WEB SIGNATURE — formularios accesibles sin claves en el navegador.

   Uso 1: formulario que abre WhatsApp con el mensaje armado (no necesita servidor).
     <form data-whatsapp="50499998888" data-plantilla="Hola, soy {nombre}. Me interesa {servicio}.">
       <label for="nombre">Nombre</label><input id="nombre" name="nombre" required>
       ...
       <input type="text" name="sitio_web" class="solo-lectores" tabindex="-1" autocomplete="off" aria-hidden="true"> (trampa anti-spam)
       <p class="form-estado" role="status" aria-live="polite"></p>
       <button type="submit">Enviar por WhatsApp</button>
     </form>

   Uso 2: enlaces simples:  <a data-wa="50499998888" data-wa-texto="Hola">…</a>

   Lo que NO hace: enviar correos ni guardar datos. Para eso hace falta un
   servidor (ver la skill, módulo de funcionalidades). */
(function () {
  function limpiarNumero(n) { return String(n || '').replace(/[^\d]/g, ''); }

  function urlWhatsApp(numero, texto) {
    return 'https://wa.me/' + limpiarNumero(numero) + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }

  function mensajeError(campo) {
    if (campo.validity.valueMissing) return 'Este dato es necesario.';
    if (campo.validity.typeMismatch) return campo.type === 'email' ? 'Revisa el correo.' : 'Revisa el formato.';
    if (campo.validity.patternMismatch) return campo.getAttribute('data-error') || 'Revisa el formato.';
    if (campo.validity.tooShort) return 'Escribe un poco más.';
    return 'Revisa este dato.';
  }

  function marcar(campo) {
    var id = campo.id + '-error';
    var nota = document.getElementById(id);
    if (campo.checkValidity()) {
      campo.removeAttribute('aria-invalid');
      if (nota) nota.textContent = '';
      return true;
    }
    campo.setAttribute('aria-invalid', 'true');
    if (!nota) {
      nota = document.createElement('span');
      nota.id = id; nota.className = 'campo-error';
      campo.insertAdjacentElement('afterend', nota);
      campo.setAttribute('aria-describedby', ((campo.getAttribute('aria-describedby') || '') + ' ' + id).trim());
    }
    nota.textContent = mensajeError(campo);
    return false;
  }

  function prepararFormulario(form) {
    form.setAttribute('novalidate', '');
    var campos = form.querySelectorAll('input, textarea, select');
    campos.forEach(function (c) { c.addEventListener('blur', function () { if (c.value) marcar(c); }); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var trampa = form.querySelector('[name="sitio_web"]');
      if (trampa && trampa.value) return; // bot
      var primero = null;
      campos.forEach(function (c) { if (c.name !== 'sitio_web' && !marcar(c) && !primero) primero = c; });
      var estado = form.querySelector('.form-estado');
      if (primero) { primero.focus(); if (estado) estado.textContent = 'Revisa los campos marcados.'; return; }

      var datos = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'sitio_web') datos[k] = String(v).trim().slice(0, 500); });
      var plantilla = form.getAttribute('data-plantilla');
      var texto = plantilla
        ? plantilla.replace(/\{(\w+)\}/g, function (_, k) { return datos[k] || ''; })
        : Object.keys(datos).map(function (k) { return k + ': ' + datos[k]; }).join('\n');
      if (estado) estado.textContent = 'Abriendo WhatsApp…';
      window.open(urlWhatsApp(form.getAttribute('data-whatsapp'), texto), '_blank', 'noopener');
    });
  }

  function iniciar() {
    document.querySelectorAll('form[data-whatsapp]').forEach(prepararFormulario);
    document.querySelectorAll('a[data-wa]').forEach(function (a) {
      a.href = urlWhatsApp(a.getAttribute('data-wa'), a.getAttribute('data-wa-texto'));
      a.target = '_blank'; a.rel = 'noopener';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

  window.SignatureFormularios = { urlWhatsApp: urlWhatsApp };
})();
