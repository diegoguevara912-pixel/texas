/* Sonrisa Norte — solicitud de cita «como una frase».
   - Preselecciona el tratamiento que llega desde el arco (?tratamiento=…).
   - Valida en vivo, resume los errores arriba y lleva el foco al primero.
   - Muestra el mensaje tal como llegará y lo abre en WhatsApp.
   - Sin número configurado (demo): no abre nada; muestra el mensaje y lo dice claramente.
   No guarda datos en ningún servidor. */
(function () {
  'use strict';
  var form = document.querySelector('[data-agenda]');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var nombre = $('nombre'), tratamiento = $('tratamiento'), paciente = $('paciente');
  var fecha = $('fecha'), franja = $('franja'), comentario = $('comentario'), acepto = $('acepto');
  var resumen = form.querySelector('.form-errores');
  var resultado = form.querySelector('.form-resultado');
  var vista = form.querySelector('[data-vista-mensaje]');
  var trampa = form.querySelector('[name="sitio_web"]');
  var tocados = {};

  function hoyISO() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }
  var HOY = hoyISO();
  fecha.min = HOY;

  // Tratamiento elegido en el arco o en la página de tratamientos.
  var permitidos = ['limpieza', 'ortodoncia', 'implantes', 'ninos', 'valoracion'];
  var pedido = new URLSearchParams(window.location.search).get('tratamiento');
  if (permitidos.indexOf(pedido) !== -1) {
    tratamiento.value = pedido;
    if (pedido === 'ninos') paciente.value = 'mi hijo o hija';
  }

  var REGLAS = [
    { campo: nombre, ok: function () { return nombre.value.trim().length >= 2; }, mensaje: 'Escriba su nombre (al menos dos letras).' },
    { campo: tratamiento, ok: function () { return tratamiento.value !== ''; }, mensaje: 'Elija qué tipo de cita necesita.' },
    { campo: fecha, ok: function () { return fecha.value !== '' && fecha.value >= HOY; }, mensaje: 'Elija una fecha a partir de hoy.' },
    { campo: acepto, ok: function () { return acepto.checked; }, mensaje: 'Para enviar, acepte el uso de sus datos según la política de privacidad.' }
  ];

  function revisar(regla) {
    var ok = regla.ok();
    if (ok) regla.campo.removeAttribute('aria-invalid');
    else regla.campo.setAttribute('aria-invalid', 'true');
    return ok;
  }

  function textoFecha(valor) {
    if (!valor) return '';
    var p = valor.split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    try { return d.toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' }); }
    catch (e) { return valor; }
  }

  function textoOpcion(select) {
    return select.value ? select.options[select.selectedIndex].text : '';
  }

  function armarMensaje() {
    var partes = [];
    partes.push('Hola, soy ' + (nombre.value.trim() || '…') + '.');
    partes.push('Quisiera pedir ' + (textoOpcion(tratamiento) || '…') + ' para ' + paciente.value +
      ', de preferencia el ' + (textoFecha(fecha.value) || '…') + ' por la ' + franja.value + '.');
    var extra = comentario.value.trim().slice(0, 300);
    if (extra) partes.push('Comentario: ' + extra);
    partes.push('(Solicitud enviada desde la web de Sonrisa Norte)');
    return partes.join('\n');
  }

  function actualizarVista() {
    vista.textContent = armarMensaje();
  }

  REGLAS.forEach(function (regla) {
    var evento = regla.campo.tagName === 'SELECT' || regla.campo.type === 'checkbox' || regla.campo.type === 'date' ? 'change' : 'blur';
    regla.campo.addEventListener(evento, function () { tocados[regla.campo.id] = true; revisar(regla); });
    regla.campo.addEventListener('input', function () { if (tocados[regla.campo.id]) revisar(regla); });
  });
  [nombre, tratamiento, paciente, fecha, franja, comentario].forEach(function (c) {
    c.addEventListener('input', actualizarVista);
    c.addEventListener('change', actualizarVista);
  });
  actualizarVista();

  function mostrarErrores(fallidas) {
    resumen.innerHTML = '';
    if (!fallidas.length) { resumen.hidden = true; return; }
    var titulo = document.createElement('p');
    titulo.textContent = fallidas.length === 1 ? 'Falta un dato:' : 'Faltan ' + fallidas.length + ' datos:';
    var ul = document.createElement('ul');
    fallidas.forEach(function (r) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + r.campo.id;
      a.textContent = r.mensaje;
      a.addEventListener('click', function (e) { e.preventDefault(); r.campo.focus(); });
      li.appendChild(a);
      ul.appendChild(li);
    });
    resumen.appendChild(titulo);
    resumen.appendChild(ul);
    resumen.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (trampa && trampa.value) return; // relleno automático de un robot
    resultado.innerHTML = '';
    var fallidas = REGLAS.filter(function (r) { tocados[r.campo.id] = true; return !revisar(r); });
    mostrarErrores(fallidas);
    if (fallidas.length) { fallidas[0].campo.focus(); return; }

    var texto = armarMensaje();
    var url = window.SonrisaWhatsApp ? window.SonrisaWhatsApp.url(texto) : '';
    var p = document.createElement('p');
    if (url) {
      window.open(url, '_blank', 'noopener');
      p.textContent = 'Abrimos WhatsApp con su mensaje. Envíelo y la clínica le confirmará el horario. ';
      var a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Si no se abrió, toque aquí.';
      p.appendChild(a);
      resultado.appendChild(p);
    } else {
      p.innerHTML = '<strong>Demostración:</strong> esta clínica ficticia todavía no tiene número de WhatsApp configurado, así que no se envió nada. Con el número real, este mensaje se abriría listo en WhatsApp:';
      var cita = document.createElement('p');
      cita.className = 'vista-mensaje-texto';
      cita.textContent = texto;
      resultado.appendChild(p);
      resultado.appendChild(cita);
    }
  });
})();
