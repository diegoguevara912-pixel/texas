import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Field } from '../components/Forms.jsx';
import { useLoad, useToast } from './Admin.jsx';

const isPending = (v) => typeof v === 'string' && v.startsWith('PENDIENTE');
const val = (v) => (isPending(v) || v == null ? '' : v);

function ListEditor({ label, items, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  return (
    <div className="field">
      <label>{label}</label>
      <div className="list-editor">
        {items.map((x, i) => (
          <div className="row" key={`${x}-${i}`}>
            <input value={x} onChange={(e) => onChange(items.map((y, j) => (j === i ? e.target.value : y)))} />
            <button type="button" className="btn btn-sm" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Quitar">✕</button>
          </div>
        ))}
        <div className="row">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(''); } } }} />
          <button type="button" className="btn btn-sm" onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(''); } }}>Agregar</button>
        </div>
      </div>
    </div>
  );
}

export default function ContentEditor() {
  const [s, reload] = useLoad('/admin/settings');
  const [b, setB] = useState(null);
  const [toast, node] = useToast();
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (s.data) setB(structuredClone(s.data.business)); }, [s.data]);
  if (!b) return <div className="skeleton" style={{ height: 400 }} />;

  const set = (path, value) => {
    const next = structuredClone(b);
    const keys = path.split('.');
    let o = next;
    keys.slice(0, -1).forEach((k) => { o[k] ??= {}; o = o[k]; });
    o[keys.at(-1)] = value;
    setB(next);
  };
  const inp = (path, props = {}) => {
    const v = path.split('.').reduce((o, k) => o?.[k], b);
    return { id: path, value: val(v), onChange: (e) => set(path, e.target.value || (props.nullable ? null : '')), ...props, nullable: undefined };
  };

  async function save() {
    setSaving(true);
    try {
      const r = await api('/admin/settings', { method: 'PUT', body: { business: b } });
      toast(r.pending.length ? `Guardado. Pendientes: ${r.pending.length}` : 'Guardado. Todos los datos completos.');
      reload();
    } catch (e) { toast(e.message, true); } finally { setSaving(false); }
  }
  async function uploadLogo(file) {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try { const r = await api('/admin/settings/logo', { method: 'POST', form: fd }); set('logoUrl', r.url); toast('Logotipo cargado. Recuerde guardar.'); } catch (e) { toast(e.message, true); }
  }
  const f = b.financing || {};
  const services = b.services || {};
  const accounts = b.payments?.transfer?.accounts || [];

  return (
    <>
      <div className="adm-head"><h1>Contenido del sitio</h1><button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar todo'}</button></div>
      {s.data?.pending?.length > 0 && <p className="pending-note" style={{ marginBottom: '1rem' }}>Pendientes: {s.data.pending.join(', ')}</p>}
      <div className="adm-form">
        <section>
          <h2>Identidad</h2>
          <div className="grid3">
            <Field label="Nombre del autolote" name="name"><input {...inp('name')} placeholder="Nombre comercial" /></Field>
            <Field label="Nombre corto" name="shortName"><input {...inp('shortName')} /></Field>
            <Field label="Eslogan" name="slogan"><input {...inp('slogan')} /></Field>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {b.logoUrl ? <img src={b.logoUrl} alt="Logotipo actual" style={{ height: 48 }} /> : <span className="muted">Sin logotipo</span>}
            <label className="btn btn-sm">Subir logotipo<input type="file" accept="image/png,image/webp,image/jpeg,image/avif" hidden onChange={(e) => uploadLogo(e.target.files[0])} /></label>
            {b.logoUrl && <button className="btn btn-sm" onClick={() => set('logoUrl', null)}>Quitar</button>}
          </div>
        </section>
        <section>
          <h2>Ubicación y contacto</h2>
          <div className="grid3">
            <Field label="País" name="country"><input {...inp('country')} /></Field>
            <Field label="Departamento" name="region"><input {...inp('region')} /></Field>
            <Field label="Municipio o ciudad" name="city"><input {...inp('city')} /></Field>
            <Field label="Dirección comercial" name="address"><input {...inp('address')} /></Field>
            <Field label="WhatsApp (con código de país)" name="whatsapp" hint="Ej.: +504 9999 9999"><input {...inp('whatsapp', { nullable: true })} type="tel" /></Field>
            <Field label="Teléfono" name="phone"><input {...inp('phone', { nullable: true })} type="tel" /></Field>
            <Field label="Correo de contacto" name="email"><input {...inp('email', { nullable: true })} type="email" /></Field>
            <Field label="Mensaje inicial de WhatsApp" name="whatsappDefaultMessage"><input {...inp('whatsappDefaultMessage')} /></Field>
          </div>
          <div className="grid3">
            <Field label="Mapa: URL para incrustar (Google Maps › Compartir › Insertar)" name="mapEmbedUrl" hint="Solo la URL https://www.google.com/maps/embed?…"><input {...inp('mapEmbedUrl', { nullable: true })} /></Field>
            <Field label="Enlace 'Cómo llegar'" name="mapLinkUrl"><input {...inp('mapLinkUrl', { nullable: true })} /></Field>
          </div>
          <div className="grid3">
            {['facebook', 'instagram', 'tiktok', 'youtube'].map((k) => (<Field key={k} label={k[0].toUpperCase() + k.slice(1)} name={`social.${k}`}><input {...inp(`social.${k}`, { nullable: true })} placeholder="https://" /></Field>))}
          </div>
        </section>
        <section>
          <h2>Horarios</h2>
          <div className="grid3">
            {(b.hours || []).map((h, i) => (
              <Field key={i} label={h.days} name={`hours${i}`}>
                <input id={`hours${i}`} value={val(h.time)} placeholder="8:00 a. m. – 5:00 p. m. o Cerrado" onChange={(e) => set('hours', b.hours.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} />
              </Field>
            ))}
          </div>
        </section>
        <section>
          <h2>Servicios (active solo los que el negocio ofrece)</h2>
          {Object.entries(services).map(([k, sv]) => (
            <div key={k} className="grid3" style={{ alignItems: 'start', borderTop: '1px solid var(--line)', paddingTop: '.8rem' }}>
              <label className="switch"><input type="checkbox" checked={!!sv.enabled} onChange={(e) => set(`services.${k}.enabled`, e.target.checked)} /> {sv.label}</label>
              <Field label="Nombre visible" name={`s-${k}-l`}><input id={`s-${k}-l`} value={sv.label} onChange={(e) => set(`services.${k}.label`, e.target.value)} /></Field>
              <Field label="Descripción" name={`s-${k}-d`}><input id={`s-${k}-d`} value={val(sv.description)} placeholder="Descripción breve y verificable" onChange={(e) => set(`services.${k}.description`, e.target.value)} /></Field>
            </div>
          ))}
        </section>
        <section>
          <h2>Marcas, beneficios y datos autorizados</h2>
          <div className="grid3">
            <ListEditor label="Marcas comercializadas" items={b.brands || []} onChange={(x) => set('brands', x)} placeholder="Ej.: Toyota" />
            <ListEditor label="Beneficios reales de comprar con la empresa" items={b.benefits || []} onChange={(x) => set('benefits', x)} placeholder="Solo beneficios que pueda respaldar" />
            <ListEditor label="Bancos o entidades con las que trabaja" items={f.partnerBanks || []} onChange={(x) => set('financing.partnerBanks', x)} placeholder="Solo alianzas confirmadas" />
          </div>
        </section>
        <section>
          <h2>Simulador de financiamiento</h2>
          <div className="grid3">
            <Field label="Modo" name="financing.mode">
              <select id="financing.mode" value={f.mode} onChange={(e) => set('financing.mode', e.target.value)}>
                <option value="disabled">Deshabilitado</option>
                <option value="illustrative">Ejemplo ilustrativo (el visitante ajusta la tasa)</option>
                <option value="authorized">Tasa autorizada por el autolote</option>
              </select>
            </Field>
            {f.mode === 'illustrative' && <Field label="Tasa anual ilustrativa inicial (%)" name="ill"><input id="ill" type="number" step="0.01" value={f.illustrativeAnnualRate ?? ''} onChange={(e) => set('financing.illustrativeAnnualRate', e.target.value === '' ? null : Number(e.target.value))} /></Field>}
            {f.mode === 'authorized' && <Field label="Tasa anual autorizada (%)" name="auth" hint="Debe estar respaldada por el autolote o la entidad"><input id="auth" type="number" step="0.01" value={f.authorizedAnnualRate ?? ''} onChange={(e) => set('financing.authorizedAnnualRate', e.target.value === '' ? null : Number(e.target.value))} /></Field>}
            <Field label="Prima mínima sugerida (%)" name="minpct"><input id="minpct" type="number" min="0" max="90" value={f.minDownPaymentPercent ?? 0} onChange={(e) => set('financing.minDownPaymentPercent', Number(e.target.value))} /></Field>
            <Field label="Plazos (meses, separados por coma)" name="terms"><input id="terms" value={(f.terms || []).join(', ')} onChange={(e) => set('financing.terms', e.target.value.split(',').map((x) => Number(x.trim())).filter((x) => x > 0 && x <= 120))} /></Field>
          </div>
          <Field label="Aviso legal del simulador" name="disc"><textarea id="disc" rows={3} value={f.disclaimer || ''} onChange={(e) => set('financing.disclaimer', e.target.value)} /></Field>
        </section>
        <section>
          <h2>Pagos y reservas</h2>
          <p className="muted" style={{ margin: 0, fontSize: '.85rem' }}>Escenario A: transferencias. Publique solo cuentas comerciales verificadas del autolote. Una reserva queda pendiente hasta que el equipo confirme los fondos en el banco; un comprobante enviado por el cliente no basta.</p>
          <label className="switch"><input type="checkbox" checked={!!b.payments?.transfer?.enabled} onChange={(e) => set('payments.transfer.enabled', e.target.checked)} /> Mostrar cuentas para transferencia</label>
          {accounts.map((a, i) => (
            <div className="grid3" key={i}>
              {['bank', 'holder', 'type', 'number', 'currency'].map((k) => (
                <Field key={k} label={{ bank: 'Banco', holder: 'Titular', type: 'Tipo de cuenta', number: 'Número', currency: 'Moneda' }[k]} name={`acc${i}${k}`}>
                  <input id={`acc${i}${k}`} value={a[k] || ''} onChange={(e) => set('payments.transfer.accounts', accounts.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} />
                </Field>
              ))}
              <label className="switch"><input type="checkbox" checked={!!a.verified} onChange={(e) => set('payments.transfer.accounts', accounts.map((x, j) => (j === i ? { ...x, verified: e.target.checked } : x)))} /> Verificada por el propietario</label>
              <button className="btn btn-sm" onClick={() => set('payments.transfer.accounts', accounts.filter((_, j) => j !== i))}>Quitar cuenta</button>
            </div>
          ))}
          <button className="btn btn-sm" style={{ justifySelf: 'start' }} onClick={() => set('payments.transfer.accounts', [...accounts, { bank: '', holder: '', type: '', number: '', currency: 'HNL', verified: false }])}>+ Agregar cuenta</button>
          <p className="muted" style={{ margin: 0, fontSize: '.85rem' }}>Escenario B: pasarela de pago. Se integrará con un checkout alojado por el proveedor aprobado; este sitio nunca recibe ni guarda números de tarjeta o CVV. Estado: <b>{b.payments?.gateway?.enabled ? 'activada' : 'no activada'}</b>, modo {b.payments?.gateway?.testMode === false ? 'real' : 'prueba'}.</p>
        </section>
        <section>
          <h2>Datos legales y medición</h2>
          <div className="grid3">
            <Field label="Razón social" name="legal.companyLegalName"><input {...inp('legal.companyLegalName')} /></Field>
            <Field label="RTN" name="legal.rtn" optional><input {...inp('legal.rtn', { nullable: true })} /></Field>
            <Field label="Correo para temas de privacidad" name="legal.privacyContactEmail"><input {...inp('legal.privacyContactEmail', { nullable: true })} type="email" /></Field>
            <Field label="Conservación de datos (meses)" name="legal.dataRetentionMonths"><input id="ret" type="number" min="1" max="120" value={b.legal?.dataRetentionMonths ?? 24} onChange={(e) => set('legal.dataRetentionMonths', Number(e.target.value))} /></Field>
            <Field label="Google Analytics 4 (ID)" name="analytics.ga4Id" optional hint="Solo se activa con consentimiento"><input {...inp('analytics.ga4Id', { nullable: true })} placeholder="G-XXXXXXX" /></Field>
            <Field label="Meta Pixel (ID)" name="analytics.metaPixelId" optional hint="Solo se activa con consentimiento"><input {...inp('analytics.metaPixelId', { nullable: true })} /></Field>
            <Field label="Verificación de Search Console" name="analytics.searchConsoleVerification" optional><input {...inp('analytics.searchConsoleVerification', { nullable: true })} /></Field>
          </div>
        </section>
        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ justifySelf: 'start' }}>{saving ? 'Guardando…' : 'Guardar todo'}</button>
        <Faqs toast={toast} />
      </div>
      {node}
    </>
  );
}

function Faqs({ toast }) {
  const [s, reload] = useLoad('/admin/faqs');
  const [draft, setDraft] = useState({ question: '', answer: '' });
  const save = async (item) => {
    try {
      if (item.id) await api(`/admin/faqs/${item.id}`, { method: 'PUT', body: item });
      else await api('/admin/faqs', { method: 'POST', body: item });
      toast('Pregunta guardada');
      setDraft({ question: '', answer: '' });
      reload();
    } catch (e) { toast(e.message, true); }
  };
  const del = async (id) => { if (confirm('¿Eliminar esta pregunta?')) { await api(`/admin/faqs/${id}`, { method: 'DELETE' }); reload(); } };
  return (
    <section>
      <h2>Preguntas frecuentes</h2>
      {(s.data?.items || []).map((q) => <FaqRow key={q.id} q={q} onSave={save} onDelete={del} />)}
      <div className="grid3" style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
        <Field label="Nueva pregunta" name="nq"><input id="nq" value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} /></Field>
        <Field label="Respuesta" name="na"><textarea id="na" rows={2} value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} /></Field>
      </div>
      <button className="btn btn-sm" style={{ justifySelf: 'start' }} onClick={() => save({ ...draft, published: true, sort: (s.data?.items?.length || 0) + 1 })}>Agregar pregunta</button>
    </section>
  );
}

function FaqRow({ q, onSave, onDelete }) {
  const [x, setX] = useState(q);
  return (
    <div className="grid3" style={{ borderTop: '1px solid var(--line)', paddingTop: '.8rem', alignItems: 'start' }}>
      <Field label="Pregunta" name={`q${q.id}`}><input id={`q${q.id}`} value={x.question} onChange={(e) => setX({ ...x, question: e.target.value })} /></Field>
      <Field label="Respuesta" name={`a${q.id}`}><textarea id={`a${q.id}`} rows={3} value={x.answer} onChange={(e) => setX({ ...x, answer: e.target.value })} /></Field>
      <div style={{ display: 'grid', gap: '.5rem' }}>
        <label className="switch"><input type="checkbox" checked={!!x.published} onChange={(e) => setX({ ...x, published: e.target.checked })} /> Publicada</label>
        <div style={{ display: 'flex', gap: '.4rem' }}><button className="btn btn-sm" onClick={() => onSave(x)}>Guardar</button><button className="btn btn-sm" onClick={() => onDelete(q.id)}>Eliminar</button></div>
      </div>
    </div>
  );
}
