import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PriceTag, VehicleMedia } from '../components/VehicleCard.jsx';
import Simulator from '../components/Simulator.jsx';
import { AppointmentForm, LeadForm } from '../components/Forms.jsx';
import { Arrow, ArrowLeft, Calc, Calendar, Close, Cube, Share, WhatsApp } from '../components/Icons.jsx';
import { useWhatsApp } from '../components/Layout.jsx';
import { api, STATUS_LABEL, vehicleLabel } from '../lib/api.js';
import { detectDeviceTier } from '../lib/hooks.js';
import { useSite } from '../lib/site.jsx';

const ModelViewer = lazy(() => import('../three/ModelViewer.jsx'));

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <button className="icon-btn close" onClick={onClose} aria-label="Cerrar"><Close /></button>
        <h2 className="h3" style={{ marginBottom: 'var(--space-5)', paddingRight: '3rem' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Gallery({ v }) {
  const images = v.media.filter((m) => m.kind === 'image');
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const cur = images[i];
  const go = (d) => setI((x) => (x + d + images.length) % images.length);
  return (
    <div>
      <div className="gallery-main" onClick={() => cur && setZoom(true)} role={cur ? 'button' : undefined} aria-label={cur ? 'Ampliar fotografía' : undefined}>
        {cur ? <img src={cur.url} alt={cur.alt || vehicleLabel(v)} /> : <VehicleMedia v={v} eager />}
        {images.length > 1 && (
          <div className="gallery-nav" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => go(-1)} aria-label="Foto anterior"><ArrowLeft /></button>
            <button onClick={() => go(1)} aria-label="Foto siguiente"><Arrow /></button>
          </div>
        )}
        {images.length > 0 && <span className="badge" style={{ position: 'absolute', left: '.8rem', bottom: '.8rem' }}>{i + 1} / {images.length}</span>}
      </div>
      {images.length > 1 && (
        <div className="thumbs">
          {images.map((m, k) => (
            <button key={m.id} aria-current={k === i} onClick={() => setI(k)} aria-label={`Foto ${k + 1}`}>
              <img src={m.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {zoom && cur && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Fotografía ampliada" onClick={() => setZoom(false)}>
          <button className="icon-btn close" aria-label="Cerrar"><Close /></button>
          <img src={cur.url} alt={cur.alt || vehicleLabel(v)} />
        </div>
      )}
    </div>
  );
}

const SPECS = [
  ['Año', (v) => v.year],
  ['Kilometraje', (v) => (v.mileage != null ? `${Number(v.mileage).toLocaleString('es-HN')} ${v.mileageUnit}` : null)],
  ['Transmisión', (v) => v.transmission],
  ['Combustible', (v) => v.fuel],
  ['Motor', (v) => v.engine],
  ['Tracción', (v) => v.drivetrain],
  ['Tipo', (v) => v.bodyType],
  ['Color exterior', (v) => v.colorExt],
  ['Color interior', (v) => v.colorInt],
  ['Condición', (v) => v.condition],
  ['Código', (v) => v.inventoryCode],
  ['Estado', (v) => STATUS_LABEL[v.status]],
];

export default function VehicleDetail() {
  const { slug } = useParams();
  const { business: b } = useSite() || {};
  const [state, setState] = useState({ loading: true, v: null, error: null });
  const [modal, setModal] = useState(null);
  const [show3d, setShow3d] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setState({ loading: true, v: null, error: null });
    api(`/vehicles/${slug}`)
      .then((r) => setState({ loading: false, v: r.vehicle, error: null }))
      .catch((e) => setState({ loading: false, v: null, error: e.status === 404 ? 'not_found' : e.message }));
  }, [slug]);
  const v = state.v;
  const wa = useWhatsApp(v ? `Hola, me interesa el ${vehicleLabel(v)} ${v.year} (código ${v.inventoryCode}) que vi en su sitio: ${window.location.href}` : undefined);

  useEffect(() => {
    if (v) document.title = `${vehicleLabel(v)} ${v.year} | ${b?.name?.startsWith('PENDIENTE') ? 'Showroom' : b?.name || 'Showroom'}`;
  }, [v, b]);

  if (state.loading) return <div className="vd wrap"><div className="skeleton" style={{ aspectRatio: '16/10', marginTop: '2rem' }} /></div>;
  if (state.error === 'not_found') {
    return (
      <div className="page-head wrap empty" style={{ marginTop: 'calc(var(--nav-h) + 3rem)' }}>
        <h1 className="h3">Este vehículo ya no está publicado</h1>
        <p className="muted">Puede que se haya vendido o retirado del inventario.</p>
        <Link className="btn btn-primary" to="/inventario">Ver inventario disponible</Link>
      </div>
    );
  }
  if (state.error) return <div className="page-head wrap"><p className="form-error">{state.error}</p></div>;

  const share = async () => {
    const data = { title: `${vehicleLabel(v)} ${v.year}`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* el usuario canceló */ }
  };
  const canBuy = v.status === 'available' || v.status === 'reserved';
  const services = b?.services || {};
  const tier = detectDeviceTier();

  return (
    <article className="vd wrap" style={{ paddingBottom: 'var(--space-9)' }}>
      <nav className="crumbs" aria-label="Ruta">
        <Link to="/">Inicio</Link> / <Link to="/inventario">Inventario</Link> / <span>{v.brand} {v.model}</span>
      </nav>
      {v.isDemo && <p className="pending-note" style={{ marginBottom: 'var(--space-5)' }}>Vehículo de demostración con datos ficticios para revisar el diseño. No es una unidad real ni una oferta.</p>}
      <div className="vd-layout">
          <div className="vd-gallery">
            {show3d && v.model3dUrl ? (
              <div className="model-viewer">
                <Suspense fallback={<div className="skeleton" style={{ width: '100%', height: '100%' }} />}><ModelViewer url={v.model3dUrl} /></Suspense>
              </div>
            ) : (
              <Gallery v={v} />
            )}
            {v.model3dUrl && tier !== 'none' && (
              <div className="seg view-tabs" role="group" aria-label="Vista">
                <button aria-pressed={!show3d} onClick={() => setShow3d(false)}>Fotografías</button>
                <button aria-pressed={show3d} onClick={() => setShow3d(true)}><Cube width={16} style={{ display: 'inline', verticalAlign: '-3px' }} /> Modelo 3D</button>
              </div>
            )}
          </div>

        <aside className="vd-aside">
          <div className="panel price-card">
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {v.isDemo && <span className="badge demo">Demo</span>}
              <span className={`badge ${v.status}`}>{STATUS_LABEL[v.status]}</span>
              <span className="badge">{v.inventoryCode}</span>
            </div>
            <h1 className="display" style={{ fontSize: 'var(--step-3)' }}>{v.brand} <em>{v.model}</em></h1>
            <p className="muted" style={{ margin: 0 }}>{[v.version, v.year].filter(Boolean).join(' · ')}</p>
            <div className="big"><PriceTag v={v} currency={b?.currency} /></div>
            {canBuy ? (
              <div className="actions">
                {wa ? <a className="btn btn-wa" href={wa} target="_blank" rel="noopener noreferrer"><WhatsApp /> Consultar por WhatsApp</a> : null}
                <button className="btn btn-primary" onClick={() => setModal('quote')}>Solicitar cotización</button>
                {services.financing && <Link className="btn" to={`/financiamiento?vehiculo=${v.slug}`}><Calc /> Solicitar financiamiento</Link>}
                {(services.visit || services.testDrive) && <button className="btn" onClick={() => setModal('visit')}><Calendar /> Agendar visita</button>}
                <button className="btn btn-ghost" onClick={share}><Share /> {copied ? 'Enlace copiado' : 'Compartir'}</button>
              </div>
            ) : (
              <p className="pending-note">Este vehículo ya fue vendido. <Link to="/inventario" style={{ textDecoration: 'underline' }}>Ver unidades disponibles</Link>.</p>
            )}
            {v.status === 'reserved' && <p className="muted" style={{ fontSize: '.85rem', margin: 0 }}>Reservado: puede dejar su consulta por si la reserva se libera.</p>}
            {v.publicHistory?.length > 0 && (
              <details>
                <summary className="muted" style={{ cursor: 'pointer', fontSize: '.85rem' }}>Historial de publicación</summary>
                <ul style={{ fontSize: '.82rem', paddingLeft: '1rem' }}>
                  {v.publicHistory.map((h, k) => (<li key={k}>{new Date(h.created_at).toLocaleDateString('es-HN')}: estado {STATUS_LABEL[h.new_value] || h.new_value}</li>))}
                </ul>
              </details>
            )}
          </div>
        </aside>

        <div className="vd-details">
          <section>
            <p className="eyebrow" style={{ marginBottom: 'var(--space-4)' }}>Ficha técnica</p>
            <dl className="spec-grid">
              {SPECS.map(([label, get]) => { const val = get(v); return val ? (<div key={label}><dt>{label}</dt><dd>{val}</dd></div>) : null; })}
            </dl>
          </section>

          {v.description && (
            <section className="prose"><p className="eyebrow">Descripción</p><p style={{ whiteSpace: 'pre-line' }}>{v.description}</p></section>
          )}

          {(v.features.length > 0 || v.equipment.length > 0) && (
            <section>
              <p className="eyebrow" style={{ marginBottom: 'var(--space-4)' }}>Equipamiento</p>
              {v.features.length > 0 && (
                <div className="filter-chips" style={{ marginBottom: 'var(--space-5)' }}>{v.features.map((f) => (<span key={f} className="chip" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'default' }}>{f}</span>))}</div>
              )}
              <div className="equip">
                {v.equipment.map((g) => (<div key={g.group}><h3 className="h3" style={{ fontSize: '1rem' }}>{g.group}</h3><ul>{g.items.map((x) => (<li key={x}>{x}</li>))}</ul></div>))}
              </div>
            </section>
          )}

          {v.videos.length > 0 && (
            <section>
              <p className="eyebrow" style={{ marginBottom: 'var(--space-4)' }}>Video</p>
              {v.videos.map((u) => <VideoEmbed key={u} url={u} />)}
            </section>
          )}

          {services.financing && canBuy && (
            <section>
              <p className="eyebrow" style={{ marginBottom: 'var(--space-4)' }}>Cuota orientativa para este vehículo</p>
              <Simulator initialPrice={v.priceVisible && v.price ? v.price : undefined} />
            </section>
          )}
        </div>

      </div>

      {modal === 'quote' && <Modal title="Solicitar cotización" onClose={() => setModal(null)}><LeadForm vehicle={v} defaultKind="quote" compact /></Modal>}
      {modal === 'visit' && <Modal title="Agendar visita" onClose={() => setModal(null)}><AppointmentForm vehicle={v} /></Modal>}
    </article>
  );
}

function VideoEmbed({ url }) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  const vm = url.match(/vimeo\.com\/(\d+)/);
  const src = yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}` : vm ? `https://player.vimeo.com/video/${vm[1]}` : null;
  if (!src) return <a className="link-arrow" href={url} target="_blank" rel="noopener noreferrer">Ver video <Arrow /></a>;
  return <iframe title="Video del vehículo" src={src} loading="lazy" allow="fullscreen; picture-in-picture" style={{ width: '100%', aspectRatio: '16/9', border: 0, borderRadius: 'var(--radius-l)' }} />;
}
