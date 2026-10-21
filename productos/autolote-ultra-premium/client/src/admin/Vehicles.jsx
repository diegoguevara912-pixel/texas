import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, STATUS_LABEL } from '../lib/api.js';
import { Field } from '../components/Forms.jsx';
import { VehicleMedia } from '../components/VehicleCard.jsx';
import { useAdmin, useLoad, useToast } from './Admin.jsx';
import { formatMoney } from '@shared/finance.js';

export function VehicleList() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState(false);
  const [s] = useLoad(`/admin/vehicles?perPage=100${status ? `&status=${status}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}${archived ? '&archived=1' : ''}`, [status, q, archived]);
  const { me } = useAdmin();
  const canEdit = me.user.role !== 'sales';
  return (
    <>
      <div className="adm-head">
        <h1>Vehículos</h1>
        {canEdit && <Link className="btn btn-primary btn-sm" to="/admin/vehiculos/nuevo">+ Agregar vehículo</Link>}
      </div>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input className="status-select" style={{ minWidth: 240 }} placeholder="Buscar marca, modelo o código" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="status-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Estado">
          <option value="">Todos</option>
          {Object.entries(STATUS_LABEL).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
        </select>
        <label className="switch"><input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} /> Ver archivados</label>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th /><th>Vehículo</th><th>Código</th><th>Precio</th><th>Estado</th><th>Actualizado</th></tr></thead>
          <tbody>
            {(s.data?.items || []).map((v) => (
              <tr key={v.id}>
                <td><div className="thumb"><VehicleMedia v={v} /></div></td>
                <td><Link to={`/admin/vehiculos/${v.id}`}><b>{v.brand} {v.model}</b> {v.year}</Link><div className="muted" style={{ fontSize: '.82rem' }}>{v.version}</div>{v.isDemo && <span className="badge demo">Demo</span>} {v.featured && <span className="badge">Destacado</span>}</td>
                <td className="mono" style={{ fontSize: '.82rem' }}>{v.inventoryCode}</td>
                <td className="mono" style={{ fontSize: '.85rem' }}>{v.price != null ? formatMoney(v.price, { code: v.currency, locale: 'es-HN' }) : '—'}{!v.priceVisible && <div className="muted">oculto</div>}</td>
                <td><span className={`badge ${v.status}`}>{STATUS_LABEL[v.status]}</span></td>
                <td className="muted" style={{ fontSize: '.8rem' }}>{new Date(v.updatedAt).toLocaleDateString('es-HN')}</td>
              </tr>
            ))}
            {!s.loading && !(s.data?.items || []).length && <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>Sin vehículos. {canEdit && <Link to="/admin/vehiculos/nuevo" style={{ textDecoration: 'underline' }}>Agregue el primero</Link>}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

const EMPTY = {
  inventoryCode: '', brand: '', model: '', version: '', year: new Date().getFullYear(), price: '', currency: 'HNL', priceVisible: true,
  mileage: '', mileageUnit: 'km', transmission: '', fuel: '', engine: '', drivetrain: '', bodyType: '', colorExt: '', colorInt: '', condition: 'Usado',
  features: [], equipment: [], videos: [], model3dUrl: '', description: '', notesPublic: '', notesInternal: '', status: 'unpublished', featured: false, showInHistory: false,
};

const lines = (arr) => (arr || []).join('\n');
const toLines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const equipToText = (eq) => (eq || []).map((g) => `${g.group}: ${g.items.join(', ')}`).join('\n');
const textToEquip = (s) => toLines(s).map((l) => { const [g, ...rest] = l.split(':'); return { group: g.trim().slice(0, 60), items: rest.join(':').split(',').map((x) => x.trim()).filter(Boolean) }; }).filter((g) => g.items.length);

export function VehicleEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { me, refreshSummary } = useAdmin();
  const readOnly = me.user.role === 'sales';
  const [v, setV] = useState(isNew ? EMPTY : null);
  const [media, setMedia] = useState([]);
  const [history, setHistory] = useState([]);
  const [text, setText] = useState({ features: '', equipment: '', videos: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, node] = useToast();
  const [over, setOver] = useState(false);
  const fileRef = useRef(null);
  const glbRef = useRef(null);

  const load = () => api(`/admin/vehicles/${id}`).then((r) => {
    const x = r.vehicle;
    setV({ ...EMPTY, ...Object.fromEntries(Object.entries(x).map(([k, val]) => [k, val ?? EMPTY[k] ?? ''])) });
    setMedia(x.media);
    setHistory(r.history);
    setText({ features: lines(x.features), equipment: equipToText(x.equipment), videos: lines(x.videos) });
  }).catch((e) => toast(e.message, true));
  useEffect(() => { if (!isNew) load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!v) return <div className="skeleton" style={{ height: 400 }} />;
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = {
      ...v,
      year: Number(v.year),
      features: toLines(text.features),
      equipment: textToEquip(text.equipment),
      videos: toLines(text.videos),
    };
    for (const k of ['id', 'slug', 'media', 'isDemo', 'archived', 'soldAt', 'createdAt', 'updatedAt', 'publicHistory']) delete body[k];
    try {
      if (isNew) {
        const r = await api('/admin/vehicles', { method: 'POST', body });
        toast('Vehículo creado. Ahora puede subir fotografías.');
        refreshSummary();
        navigate(`/admin/vehiculos/${r.id}`, { replace: true });
      } else {
        await api(`/admin/vehicles/${id}`, { method: 'PUT', body });
        toast('Cambios guardados');
        refreshSummary();
        load();
      }
    } catch (x) {
      setErrors(x.fields || {});
      toast(x.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function upload(files, kind = 'image') {
    if (!files?.length) return;
    const fd = new FormData();
    [...files].slice(0, 12).forEach((f) => fd.append('files', f));
    fd.append('kind', kind);
    try {
      await api(`/admin/vehicles/${id}/media`, { method: 'POST', form: fd });
      toast(kind === 'model3d' ? 'Modelo 3D cargado' : 'Fotografías cargadas');
      load();
    } catch (x) { toast(x.message, true); }
  }
  const move = async (i, d) => {
    const ids = media.filter((m) => m.kind === 'image').map((m) => m.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await api(`/admin/vehicles/${id}/media/order`, { method: 'PUT', body: { ids } });
    load();
  };
  const removeMedia = async (mid) => { if (!confirm('¿Eliminar esta fotografía?')) return; await api(`/admin/media/${mid}`, { method: 'DELETE' }); load(); };
  const setAlt = async (mid, alt) => { await api(`/admin/media/${mid}`, { method: 'PATCH', body: { alt } }); };
  const archive = async (archived) => { await api(`/admin/vehicles/${id}/archive`, { method: 'POST', body: { archived } }); toast(archived ? 'Vehículo archivado' : 'Vehículo restaurado'); load(); refreshSummary(); };
  const hardDelete = async () => {
    if (!confirm('Esto elimina el vehículo y sus fotografías de forma permanente. ¿Continuar?')) return;
    try { await api(`/admin/vehicles/${id}`, { method: 'DELETE' }); navigate('/admin/vehiculos'); } catch (x) { toast(x.message, true); }
  };
  const images = media.filter((m) => m.kind === 'image');
  const E = errors;

  return (
    <>
      <div className="adm-head">
        <h1>{isNew ? 'Nuevo vehículo' : `${v.brand} ${v.model} ${v.year}`}</h1>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <Link className="btn btn-sm" to="/admin/vehiculos">← Volver</Link>
          {!isNew && v.status !== 'unpublished' && !v.archived && <a className="btn btn-sm" href={`/vehiculo/${v.slug}`} target="_blank" rel="noopener noreferrer">Ver publicado ↗</a>}
        </div>
      </div>
      {v.isDemo && <p className="pending-note" style={{ marginBottom: '1rem' }}>Vehículo de demostración ficticio. Elimínelo antes de publicar el sitio (npm run seed:demo -- --remove).</p>}
      <form className="adm-form" onSubmit={save}>
        <fieldset disabled={readOnly} style={{ border: 0, padding: 0, display: 'grid', gap: '1.4rem' }}>
          <section>
            <h2>Publicación</h2>
            <div className="grid3">
              <Field label="Estado" name="status">
                <select id="status" value={v.status} onChange={set('status')}>
                  {Object.entries(STATUS_LABEL).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
                </select>
              </Field>
              <label className="switch"><input type="checkbox" checked={!!v.featured} onChange={set('featured')} /> Destacado en inicio</label>
              <label className="switch"><input type="checkbox" checked={!!v.showInHistory} onChange={set('showInHistory')} /> Mostrar en galería de vendidos</label>
            </div>
          </section>
          <section>
            <h2>Identificación</h2>
            <div className="grid3">
              <Field label="Código de inventario" name="inventoryCode" error={E.inventoryCode} hint="Interno. No use placa ni VIN completo."><input id="inventoryCode" value={v.inventoryCode} onChange={set('inventoryCode')} required maxLength={40} /></Field>
              <Field label="Marca" name="brand" error={E.brand}><input id="brand" value={v.brand} onChange={set('brand')} required maxLength={60} /></Field>
              <Field label="Modelo" name="model" error={E.model}><input id="model" value={v.model} onChange={set('model')} required maxLength={80} /></Field>
              <Field label="Versión" name="version" optional><input id="version" value={v.version} onChange={set('version')} maxLength={120} /></Field>
              <Field label="Año" name="year" error={E.year}><input id="year" type="number" value={v.year} onChange={set('year')} required /></Field>
              <Field label="Condición" name="condition" optional><input id="condition" value={v.condition} onChange={set('condition')} maxLength={30} list="conds" /><datalist id="conds"><option>Nuevo</option><option>Usado</option><option>Seminuevo</option></datalist></Field>
            </div>
          </section>
          <section>
            <h2>Precio</h2>
            <div className="grid3">
              <Field label="Precio" name="price" error={E.price} optional hint="Déjelo vacío para mostrar 'Consultar'"><input id="price" type="number" min="0" step="1" value={v.price ?? ''} onChange={set('price')} /></Field>
              <Field label="Moneda" name="currency"><select id="currency" value={v.currency} onChange={set('currency')}><option value="HNL">HNL · Lempira</option><option value="USD">USD · Dólar</option></select></Field>
              <label className="switch"><input type="checkbox" checked={!!v.priceVisible} onChange={set('priceVisible')} /> Mostrar precio al público</label>
            </div>
          </section>
          <section>
            <h2>Ficha técnica</h2>
            <div className="grid3">
              <Field label="Kilometraje" name="mileage" optional><input id="mileage" type="number" min="0" value={v.mileage ?? ''} onChange={set('mileage')} /></Field>
              <Field label="Unidad" name="mileageUnit"><select id="mileageUnit" value={v.mileageUnit} onChange={set('mileageUnit')}><option value="km">km</option><option value="mi">millas</option></select></Field>
              <Field label="Transmisión" name="transmission" optional><input id="transmission" value={v.transmission} onChange={set('transmission')} list="trans" /><datalist id="trans"><option>Automática</option><option>Manual</option><option>CVT</option></datalist></Field>
              <Field label="Combustible" name="fuel" optional><input id="fuel" value={v.fuel} onChange={set('fuel')} list="fuels" /><datalist id="fuels"><option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option></datalist></Field>
              <Field label="Motor" name="engine" optional><input id="engine" value={v.engine} onChange={set('engine')} /></Field>
              <Field label="Tracción" name="drivetrain" optional><input id="drivetrain" value={v.drivetrain} onChange={set('drivetrain')} list="drives" /><datalist id="drives"><option>FWD</option><option>RWD</option><option>AWD</option><option>4x4</option></datalist></Field>
              <Field label="Tipo" name="bodyType" optional><input id="bodyType" value={v.bodyType} onChange={set('bodyType')} list="bodies" /><datalist id="bodies"><option>Sedán</option><option>SUV</option><option>Pick-up</option><option>Hatchback</option><option>Coupé</option><option>Van</option><option>Deportivo</option></datalist></Field>
              <Field label="Color exterior" name="colorExt" optional><input id="colorExt" value={v.colorExt} onChange={set('colorExt')} /></Field>
              <Field label="Color interior" name="colorInt" optional><input id="colorInt" value={v.colorInt} onChange={set('colorInt')} /></Field>
            </div>
          </section>
          <section>
            <h2>Descripción y equipamiento</h2>
            <Field label="Descripción pública" name="description" optional><textarea id="description" rows={4} value={v.description} onChange={set('description')} maxLength={5000} /></Field>
            <div className="grid3">
              <Field label="Características destacadas" name="features" optional hint="Una por línea"><textarea id="features" rows={5} value={text.features} onChange={(e) => setText({ ...text, features: e.target.value })} /></Field>
              <Field label="Equipamiento por grupo" name="equipment" optional hint="Formato: Seguridad: ABS, Bolsas de aire"><textarea id="equipment" rows={5} value={text.equipment} onChange={(e) => setText({ ...text, equipment: e.target.value })} /></Field>
              <Field label="Videos (URL)" name="videos" optional hint="YouTube o Vimeo, uno por línea" error={E['videos.0']}><textarea id="videos" rows={5} value={text.videos} onChange={(e) => setText({ ...text, videos: e.target.value })} /></Field>
            </div>
            <Field label="Observaciones internas" name="notesInternal" optional hint="Nunca se publican"><textarea id="notesInternal" rows={3} value={v.notesInternal} onChange={set('notesInternal')} /></Field>
          </section>
          {!readOnly && <button className="btn btn-primary" disabled={saving} style={{ justifySelf: 'start' }}>{saving ? 'Guardando…' : isNew ? 'Crear vehículo' : 'Guardar cambios'}</button>}
        </fieldset>
      </form>

      {!isNew && (
        <div className="adm-form" style={{ marginTop: '1.4rem' }}>
          <section>
            <h2>Fotografías ({images.length})</h2>
            <p className="muted" style={{ margin: 0, fontSize: '.85rem' }}>Use fotografías reales de esta unidad. JPG, PNG, WebP o AVIF, máximo 8 MB cada una. La primera es la portada. Antes de subir, oculte la placa.</p>
            {!readOnly && (
              <div className={`dropzone ${over ? 'over' : ''}`} onClick={() => fileRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }} role="button" tabIndex={0}>
                Arrastre fotografías aquí o haga clic para elegirlas
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
              </div>
            )}
            <div className="media-grid">
              {images.map((m, i) => (
                <div className="media-item" key={m.id}>
                  <img src={m.url} alt={m.alt || ''} />
                  <input className="status-select" style={{ borderRadius: 0, border: 0 }} defaultValue={m.alt || ''} placeholder="Texto alternativo" onBlur={(e) => setAlt(m.id, e.target.value)} disabled={readOnly} />
                  {!readOnly && (
                    <div className="bar">
                      <button type="button" onClick={() => move(i, -1)} aria-label="Mover antes">←</button>
                      <button type="button" onClick={() => move(i, 1)} aria-label="Mover después">→</button>
                      <button type="button" onClick={() => removeMedia(m.id)} aria-label="Eliminar">✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2>Modelo 3D (opcional)</h2>
            <p className="muted" style={{ margin: 0, fontSize: '.85rem' }}>Suba solo un archivo .glb autorizado que represente esta unidad (escaneo o modelo con licencia comercial). No use modelos genéricos de otra versión.</p>
            {v.model3dUrl ? <p className="mono" style={{ fontSize: '.82rem' }}>Actual: {v.model3dUrl}</p> : <p className="muted">Sin modelo 3D.</p>}
            {!readOnly && <><button type="button" className="btn btn-sm" style={{ justifySelf: 'start' }} onClick={() => glbRef.current?.click()}>Subir .glb</button><input ref={glbRef} type="file" accept=".glb,model/gltf-binary" hidden onChange={(e) => { upload(e.target.files, 'model3d'); e.target.value = ''; }} /></>}
          </section>
          <section>
            <h2>Historial de cambios relevantes</h2>
            {history.length ? (
              <table className="tbl"><tbody>{history.map((h, i) => (<tr key={i}><td className="muted" style={{ fontSize: '.8rem' }}>{new Date(h.created_at).toLocaleString('es-HN')}</td><td>{h.user || '—'}</td><td className="mono" style={{ fontSize: '.8rem' }}>{h.field}: {h.old_value ?? '—'} → {h.new_value ?? '—'}</td><td>{h.public ? <span className="badge">público</span> : null}</td></tr>))}</tbody></table>
            ) : <p className="muted" style={{ margin: 0 }}>Sin cambios registrados todavía.</p>}
          </section>
          {!readOnly && (
            <section>
              <h2>Archivar o eliminar</h2>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                {v.archived ? <button type="button" className="btn btn-sm" onClick={() => archive(false)}>Restaurar</button> : <button type="button" className="btn btn-sm" onClick={() => archive(true)}>Archivar (se oculta, reversible)</button>}
                {v.archived && me.user.role === 'owner' && <button type="button" className="btn btn-sm" style={{ borderColor: 'var(--err)', color: 'var(--err)' }} onClick={hardDelete}>Eliminar definitivamente</button>}
              </div>
            </section>
          )}
        </div>
      )}
      {node}
    </>
  );
}
