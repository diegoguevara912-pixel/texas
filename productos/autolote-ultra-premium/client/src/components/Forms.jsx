import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useFormStart } from '../lib/hooks.js';
import { useSite } from '../lib/site.jsx';
import { Check } from './Icons.jsx';

export function Field({ label, name, error, optional, children, hint }) {
  return (
    <div className="field" data-invalid={!!error}>
      <label htmlFor={name}>
        {label} {optional && <span className="opt">(opcional)</span>}
      </label>
      {children}
      {hint && !error && <span className="muted" style={{ fontSize: '.78rem' }}>{hint}</span>}
      {error && <span className="err" id={`${name}-err`} role="alert">{error}</span>}
    </div>
  );
}

const inputProps = (name, errors) => ({ id: name, name, 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${name}-err` : undefined });

function useSubmit(endpoint) {
  const startedAt = useFormStart();
  const [state, setState] = useState({ sending: false, errors: {}, error: null, done: null });
  async function submit(e, extra = {}) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(fd.entries()), ...extra, startedAt };
    for (const k of ['consentPrivacy', 'consentMarketing', 'consentContact']) body[k] = fd.get(k) === 'on';
    setState({ sending: true, errors: {}, error: null, done: null });
    try {
      const r = await api(endpoint, { method: 'POST', body });
      setState({ sending: false, errors: {}, error: null, done: r });
    } catch (err) {
      setState({ sending: false, errors: err.fields || {}, error: err.message, done: null });
      const first = Object.keys(err.fields || {})[0];
      if (first) document.getElementById(first)?.focus();
    }
  }
  return [state, submit, () => setState({ sending: false, errors: {}, error: null, done: null })];
}

function Honeypot() {
  return (
    <div className="hp" aria-hidden="true">
      <label>No llenar este campo<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}

function PrivacyCheck({ errors, name = 'consentPrivacy', children }) {
  return (
    <div className="field" data-invalid={!!errors[name]}>
      <label className="check">
        <input type="checkbox" name={name} id={name} required aria-invalid={!!errors[name]} />
        <span>{children || (<>He leído la <Link to="/privacidad" target="_blank">declaración de privacidad</Link> y autorizo el uso de mis datos para atender esta solicitud.</>)}</span>
      </label>
      {errors[name] && <span className="err" role="alert">{errors[name]}</span>}
    </div>
  );
}

function Success({ title, children, reference, onReset }) {
  return (
    <div className="form-success" role="status" aria-live="polite">
      <span className="check-icon"><Check width={24} /></span>
      <h3 className="h3">{title}</h3>
      <p className="muted" style={{ margin: 0 }}>{children}</p>
      {reference && <p className="mono" style={{ margin: 0 }}>Referencia: {reference}</p>}
      {onReset && <button type="button" className="btn btn-sm" onClick={onReset} style={{ justifySelf: 'start' }}>Enviar otra solicitud</button>}
    </div>
  );
}

const KINDS = [
  ['info', 'Información general'],
  ['quote', 'Cotización'],
  ['visit', 'Visita al showroom'],
  ['other', 'Otro'],
];

export function LeadForm({ vehicle, defaultKind = 'info', compact }) {
  const { business: b } = useSite() || {};
  const [state, submit, reset] = useSubmit('/leads');
  const [showLoc, setShowLoc] = useState(false);
  const e = state.errors;
  if (state.done) {
    return (
      <Success title="Recibimos su consulta" reference={state.done.reference} onReset={reset}>
        Le contactaremos por teléfono o WhatsApp en horario de atención. Guarde la referencia por si necesita darle seguimiento.
      </Success>
    );
  }
  return (
    <form className="form" onSubmit={(ev) => submit(ev, { vehicleId: vehicle?.id || '' })} noValidate>
      <Honeypot />
      {vehicle && (
        <p className="muted" style={{ margin: 0 }}>Vehículo de interés: <b style={{ color: 'var(--ivory)' }}>{vehicle.brand} {vehicle.model} {vehicle.year}</b> <span className="mono">({vehicle.inventoryCode})</span></p>
      )}
      <div className="form-grid two">
        <Field label="Nombre completo" name="name" error={e.name}>
          <input {...inputProps('name', e)} autoComplete="name" required maxLength={120} />
        </Field>
        <Field label="Teléfono" name="phone" error={e.phone}>
          <input {...inputProps('phone', e)} type="tel" inputMode="tel" autoComplete="tel" required placeholder="+504" maxLength={30} />
        </Field>
        <Field label="WhatsApp" name="whatsapp" error={e.whatsapp} optional hint="Si es distinto al teléfono">
          <input {...inputProps('whatsapp', e)} type="tel" inputMode="tel" maxLength={30} />
        </Field>
        <Field label="Correo electrónico" name="email" error={e.email} optional>
          <input {...inputProps('email', e)} type="email" autoComplete="email" maxLength={190} />
        </Field>
      </div>
      {!compact && (
        <Field label="Tipo de consulta" name="kind" error={e.kind}>
          <select {...inputProps('kind', e)} defaultValue={defaultKind}>
            {KINDS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
          </select>
        </Field>
      )}
      {compact && <input type="hidden" name="kind" value={defaultKind} />}
      <Field label="Mensaje" name="message" error={e.message} optional>
        <textarea {...inputProps('message', e)} maxLength={2000} rows={compact ? 3 : 4} />
      </Field>
      <button type="button" className="link-arrow" style={{ background: 'none', border: 0, padding: 0, justifySelf: 'start' }} aria-expanded={showLoc} onClick={() => setShowLoc((s) => !s)}>
        {showLoc ? '− Ocultar ubicación' : '+ Indicar desde dónde nos escribe (opcional)'}
      </button>
      {showLoc && (
        <fieldset>
          <legend>Ubicación aproximada · opcional, no usamos GPS</legend>
          <div className="form-grid two">
            <Field label="País" name="country" optional><input id="country" name="country" defaultValue={b?.country || ''} maxLength={60} autoComplete="country-name" /></Field>
            <Field label="Departamento o estado" name="region" optional><input id="region" name="region" maxLength={80} autoComplete="address-level1" /></Field>
            <Field label="Municipio o ciudad" name="city" optional><input id="city" name="city" maxLength={80} autoComplete="address-level2" /></Field>
          </div>
        </fieldset>
      )}
      <PrivacyCheck errors={e} />
      <label className="check">
        <input type="checkbox" name="consentMarketing" />
        <span>Acepto recibir novedades del inventario por WhatsApp o correo. Puedo retirar este permiso cuando quiera. (Opcional)</span>
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="btn btn-primary" disabled={state.sending} style={{ justifySelf: 'start' }}>
        {state.sending ? 'Enviando…' : 'Enviar consulta'}
      </button>
    </form>
  );
}

export function AppointmentForm({ vehicle }) {
  const { business: b } = useSite() || {};
  const [state, submit, reset] = useSubmit('/appointments');
  const e = state.errors;
  const services = b?.services || {};
  const types = [['visit', services.visit], ['test_drive', services.testDrive], ['inspection', services.inspection]].filter(([, s]) => s);
  const [type, setType] = useState(types[0]?.[0] || 'visit');
  const min = new Date().toISOString().slice(0, 10);
  const max = new Date(Date.now() + 110 * 86400_000).toISOString().slice(0, 10);
  if (!types.length) return <p className="pending-note">El agendamiento de citas aún no está activado.</p>;
  if (state.done) {
    return (
      <Success title="Solicitud de cita recibida" reference={state.done.reference} onReset={reset}>
        Su cita queda <b>pendiente de confirmación</b>. Le escribiremos para confirmar el horario exacto.
      </Success>
    );
  }
  return (
    <form className="form" onSubmit={(ev) => submit(ev, { type, vehicleId: vehicle?.id || '' })} noValidate>
      <Honeypot />
      {types.length > 1 && (
        <div className="seg" role="group" aria-label="Tipo de cita">
          {types.map(([k, s]) => (<button type="button" key={k} aria-pressed={type === k} onClick={() => setType(k)}>{s.label}</button>))}
        </div>
      )}
      <div className="form-grid two">
        <Field label="Nombre completo" name="name" error={e.name}><input {...inputProps('name', e)} autoComplete="name" required maxLength={120} /></Field>
        <Field label="Teléfono o WhatsApp" name="phone" error={e.phone}><input {...inputProps('phone', e)} type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} placeholder="+504" /></Field>
        <Field label="Fecha preferida" name="preferredDate" error={e.preferredDate}><input {...inputProps('preferredDate', e)} type="date" min={min} max={max} required /></Field>
        <Field label="Horario preferido" name="preferredSlot" error={e.preferredSlot}>
          <select {...inputProps('preferredSlot', e)} defaultValue="manana"><option value="manana">Mañana</option><option value="tarde">Tarde</option></select>
        </Field>
      </div>
      <Field label="Comentario" name="message" optional error={e.message}><textarea {...inputProps('message', e)} rows={3} maxLength={1000} /></Field>
      <PrivacyCheck errors={e} />
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="btn btn-primary" disabled={state.sending} style={{ justifySelf: 'start' }}>{state.sending ? 'Enviando…' : 'Solicitar cita'}</button>
    </form>
  );
}

export function FinancingForm({ vehicle, sim }) {
  const { business: b } = useSite() || {};
  const [state, submit, reset] = useSubmit('/financing');
  const [method, setMethod] = useState('whatsapp');
  const e = state.errors;
  if (!b?.services?.financing) return <p className="pending-note">La solicitud de financiamiento no está activada.</p>;
  if (state.done) {
    return (
      <Success title="Solicitud enviada" reference={state.done.reference} onReset={reset}>
        Un asesor le contactará para orientarle. Recuerde: esto no es una aprobación de crédito; la decisión la toma la entidad financiera.
      </Success>
    );
  }
  const banks = b.financing?.partnerBanks || [];
  return (
    <form className="form" onSubmit={(ev) => submit(ev, { contactMethod: method, vehicleId: vehicle?.id || '' })} noValidate>
      <Honeypot />
      <div className="form-grid two">
        <Field label="Nombre" name="name" error={e.name}><input {...inputProps('name', e)} autoComplete="name" required maxLength={120} /></Field>
        <div className="field">
          <span style={{ fontSize: '.84rem', color: 'var(--ivory-dim)' }}>Medio de contacto preferido</span>
          <div className="seg" role="group" aria-label="Medio de contacto">
            {[['whatsapp', 'WhatsApp'], ['phone', 'Llamada'], ['email', 'Correo']].map(([k, l]) => (
              <button key={k} type="button" aria-pressed={method === k} onClick={() => setMethod(k)}>{l}</button>
            ))}
          </div>
        </div>
        <Field label={method === 'email' ? 'Correo' : 'Número'} name="contactValue" error={e.contactValue}>
          <input {...inputProps('contactValue', e)} type={method === 'email' ? 'email' : 'tel'} inputMode={method === 'email' ? 'email' : 'tel'} required maxLength={190} />
        </Field>
        <Field label="Vehículo de interés" name="vehicleText" optional>
          <input id="vehicleText" readOnly={!!vehicle} defaultValue={vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year} (${vehicle.inventoryCode})` : ''} placeholder="Marca, modelo o código" />
        </Field>
        <Field label={`Precio del vehículo (${b.currency?.code || 'HNL'})`} name="vehiclePrice" error={e.vehiclePrice} optional>
          <input {...inputProps('vehiclePrice', e)} type="number" min="0" step="1000" inputMode="numeric" defaultValue={sim?.price ?? (vehicle?.priceVisible ? vehicle.price : '') ?? ''} key={`p${sim?.price}`} />
        </Field>
        <Field label="Prima estimada" name="downPayment" error={e.downPayment} optional>
          <input {...inputProps('downPayment', e)} type="number" min="0" step="1000" inputMode="numeric" defaultValue={sim?.down ?? ''} key={`d${sim?.down}`} />
        </Field>
        <Field label="Plazo deseado" name="termMonths" error={e.termMonths} optional>
          <select {...inputProps('termMonths', e)} defaultValue={sim?.months || 60} key={`m${sim?.months}`}>
            {(b.financing?.terms || [12, 24, 36, 48, 60, 72]).map((t) => (<option key={t} value={t}>{t} meses</option>))}
          </select>
        </Field>
        <Field label="Banco o entidad de preferencia" name="preferredBank" optional>
          {banks.length ? (
            <select id="preferredBank" name="preferredBank" defaultValue=""><option value="">Sin preferencia</option>{banks.map((x) => (<option key={x}>{x}</option>))}</select>
          ) : (
            <input id="preferredBank" name="preferredBank" maxLength={120} placeholder="Sin preferencia" />
          )}
        </Field>
        <Field label="Ciudad o departamento" name="region" optional><input id="region" name="region" maxLength={80} /></Field>
      </div>
      <p className="disclaimer">
        No solicitamos contraseñas, números de tarjeta, CVV, credenciales bancarias ni documentos por este formulario.
        Si la entidad financiera requiere documentación, se gestionará por un canal seguro y autorizado.
      </p>
      <PrivacyCheck errors={e} name="consentContact">
        Autorizo que me contacten para dar seguimiento a esta solicitud y he leído la <Link to="/privacidad" target="_blank">declaración de privacidad</Link>.
      </PrivacyCheck>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="btn btn-primary" disabled={state.sending} style={{ justifySelf: 'start' }}>{state.sending ? 'Enviando…' : 'Solicitar financiamiento'}</button>
    </form>
  );
}
