# Manual para administrar el autolote

Panel: `https://SU-DOMINIO/admin` (en local: http://localhost:3001/admin).

## 1. Primer ingreso
- La primera cuenta se crea con `npm run admin:create` (local) o con las variables `ADMIN_BOOTSTRAP_*` en Hostinger (ver publicación).
- Contraseña: mínimo 12 caracteres con mayúsculas, minúsculas y números. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.
- La sesión dura 8 horas. En **Sesiones** puede cerrar sus otras sesiones abiertas.

## 2. Completar los datos del negocio (Contenido)
Rellene todo lo marcado como pendiente: nombre, eslogan, logotipo, dirección, WhatsApp (con +504), correo, horarios, redes, razón social.
- **Servicios**: active solo lo que realmente ofrece (prueba de manejo, inspección, reserva, recibir vehículo). Lo desactivado no aparece en la web.
- **Beneficios** y **bancos aliados**: escriba solo lo que pueda respaldar.
- **Simulador**: "Deshabilitado", "Ejemplo ilustrativo" o "Tasa autorizada". Use la tasa autorizada solo si la respalda usted o la entidad.
- **Mapa**: en Google Maps › Compartir › Insertar mapa, copie solo la dirección `https://www.google.com/maps/embed?...`.
- Pulse **Guardar todo**. El aviso "Vista previa" del sitio desaparece cuando no quedan datos pendientes.

## 3. Agregar un vehículo
1. **Vehículos › + Agregar vehículo**.
2. Código de inventario interno (ej. `AL-0142`). **No use la placa ni el VIN completo.**
3. Marca, modelo, versión, año, precio (vacío = "Consultar"), ficha técnica.
4. Equipamiento: una línea por grupo, por ejemplo `Seguridad: ABS, 6 bolsas de aire`.
5. Deje el estado en **No publicado** mientras prepara las fotos. Pulse **Crear vehículo**.
6. Suba las fotografías (arrastrar o clic). Primera foto = portada. Ordene con ← →, escriba un texto alternativo breve. Oculte placas antes de subir.
7. Cambie el estado a **Disponible** y guarde. Ya aparece en la web.

Consejos de foto: fondo limpio, luz de mañana o de tarde (sin sol directo), la misma secuencia para todos (¾ frontal, lateral, ¾ trasera, interior, tablero, motor), formato horizontal.

## 4. Estados del inventario
| Estado | En la web |
|---|---|
| Disponible | Visible, con todos los botones de contacto. |
| Reservado | Visible con aviso "Reservado". |
| Vendido | Oculto, salvo que marque "Mostrar en galería de vendidos". |
| No publicado | Oculto. |
Cada cambio de precio o estado queda en el historial del vehículo con fecha y usuario.

**Archivar** oculta el vehículo y es reversible. **Eliminar definitivamente** solo lo puede hacer el propietario y solo después de archivar.

## 5. Clientes, citas y financiamiento
- **Clientes**: consultas de la web. Cambie el estado (Nuevo → Contactado → Calificado → Compró/Perdido) y agregue notas internas. **Exportar CSV** incluye solo datos de contacto autorizados.
- **Citas**: llegan como "Solicitada". Escriba la fecha y hora confirmadas; el estado pasa a "Confirmada". Avise al cliente por WhatsApp.
- **Financiamiento**: solicitudes orientativas. Nunca pida por WhatsApp contraseñas ni fotos de tarjetas. Si una entidad pide documentos, use el canal seguro de esa entidad.
- Respete el consentimiento: escriba con promociones solo a quien tenga "Comunicaciones: Acepta".

## 6. Reservas y pagos
- Transferencias: registre solo cuentas comerciales verificadas y márquelas como "Verificada por el propietario".
- Una reserva se confirma **solo cuando el dinero aparece en el banco**. Un comprobante enviado por el cliente no es prueba suficiente.
- La pasarela de pago con tarjeta no está activa; requiere un proveedor aprobado y autorización del propietario.

## 7. Usuarios y roles
| Rol | Puede |
|---|---|
| Propietario | Todo, incluidos usuarios, eliminación definitiva y pagos reales. |
| Administrador | Vehículos, clientes, citas, financiamiento, contenido y registro. |
| Ventas | Ver vehículos; gestionar clientes, citas y financiamiento. |
Desactive de inmediato la cuenta de quien deje la empresa (se cierran sus sesiones).

## 8. Datos personales y respaldos
- Conserve solicitudes el tiempo configurado (24 meses por defecto) y elimine lo antiguo.
- Hostinger hace copias automáticas; además, descargue una copia de la base de datos cada mes desde hPanel › Bases de datos › phpMyAdmin › Exportar.
