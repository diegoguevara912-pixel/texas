import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Simulator from '../components/Simulator.jsx';
import { AppointmentForm, FinancingForm, LeadForm } from '../components/Forms.jsx';
import { PriceTag, VehicleMedia } from '../components/VehicleCard.jsx';
import { WhatsApp } from '../components/Icons.jsx';
import { useWhatsApp } from '../components/Layout.jsx';
import { api, STATUS_LABEL } from '../lib/api.js';
import { show, useSite } from '../lib/site.jsx';
import { Faq } from './Home.jsx';

export function Financing() {
  const [params] = useSearchParams();
  const [vehicle, setVehicle] = useState(null);
  const [sim, setSim] = useState(null);
  const slug = params.get('vehiculo');
  useEffect(() => { if (slug) api(`/vehicles/${slug}`).then((r) => setVehicle(r.vehicle)).catch(() => {}); }, [slug]);
  return (
    <>
      <section className="page-head wrap">
        <p className="eyebrow"><b>●</b> Financiamiento</p>
        <h1 className="display" style={{ fontSize: 'var(--step-4)', marginTop: 'var(--space-3)' }}>Calcule. <em>Consulte.</em> Decida.</h1>
        <p className="lede" style={{ marginTop: 'var(--space-4)' }}>Le orientamos para presentar su solicitud ante una entidad financiera. No somos un banco y no prometemos aprobación.</p>
      </section>
      <section className="wrap" style={{ display: 'grid', gap: 'var(--space-8)', paddingBottom: 'var(--space-9)' }}>
        <Simulator initialPrice={vehicle?.priceVisible ? vehicle.price : undefined} onChange={setSim} />
        <div className="split">
          <div>
            <h2 className="h2" style={{ fontSize: 'var(--step-3)' }}>Solicitar <em>financiamiento</em></h2>
            <p className="muted" style={{ maxWidth: '44ch' }}>Solo pedimos datos de contacto y del vehículo. Un asesor revisará su solicitud y le explicará los requisitos de la entidad que elija.</p>
            <ul className="muted" style={{ paddingLeft: '1.1rem', display: 'grid', gap: '.4rem' }}>
              <li>Las tasas y condiciones las define la entidad financiera.</li>
              <li>Nunca le pediremos contraseñas ni datos de tarjeta por este sitio.</li>
              <li>Puede retirar su solicitud en cualquier momento.</li>
            </ul>
          </div>
          <div className="panel"><FinancingForm vehicle={vehicle} sim={sim ? { price: sim.price, down: sim.down, months: sim.months } : null} /></div>
        </div>
      </section>
    </>
  );
}

export function Contact() {
  const { business: b } = useSite();
  const wa = useWhatsApp();
  return (
    <>
      <section className="page-head wrap">
        <p className="eyebrow"><b>●</b> Visítenos</p>
        <h1 className="display" style={{ fontSize: 'var(--step-4)', marginTop: 'var(--space-3)' }}>Hablemos de su <em>próximo</em> vehículo.</h1>
      </section>
      <section className="wrap split" style={{ paddingBottom: 'var(--space-8)' }}>
        <div className="panel">
          <h2 className="h3" style={{ marginBottom: 'var(--space-5)' }}>Enviar una consulta</h2>
          <LeadForm />
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-6)', alignContent: 'start' }}>
          <div className="panel" id="agendar">
            <h2 className="h3" style={{ marginBottom: 'var(--space-5)' }}>Agendar una visita</h2>
            <AppointmentForm />
          </div>
          <dl className="info-list">
            <div><dt>Dirección</dt><dd>{show(b.address)}</dd></div>
            <div><dt>Teléfono</dt><dd>{b.phone ? <a href={`tel:${b.phone}`}>{b.phone}</a> : 'Pendiente'}</dd></div>
            <div><dt>Correo</dt><dd>{b.email ? <a href={`mailto:${b.email}`}>{b.email}</a> : 'Pendiente'}</dd></div>
          </dl>
          {wa && <a className="btn btn-wa" href={wa} target="_blank" rel="noopener noreferrer" style={{ justifySelf: 'start' }}><WhatsApp /> WhatsApp</a>}
        </div>
      </section>
      <Faq />
    </>
  );
}

export function Compare() {
  const [params] = useSearchParams();
  const { business: b } = useSite();
  const [items, setItems] = useState(null);
  useEffect(() => {
    const ids = params.get('ids') || '';
    api(`/vehicles?ids=${encodeURIComponent(ids)}&perPage=3`).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, [params]);
  const rows = [
    ['Precio', (v) => <PriceTag v={v} currency={b.currency} />],
    ['Año', (v) => v.year],
    ['Kilometraje', (v) => (v.mileage != null ? `${Number(v.mileage).toLocaleString('es-HN')} ${v.mileageUnit}` : '—')],
    ['Transmisión', (v) => v.transmission || '—'],
    ['Combustible', (v) => v.fuel || '—'],
    ['Motor', (v) => v.engine || '—'],
    ['Tracción', (v) => v.drivetrain || '—'],
    ['Tipo', (v) => v.bodyType || '—'],
    ['Color', (v) => v.colorExt || '—'],
    ['Estado', (v) => STATUS_LABEL[v.status]],
  ];
  return (
    <>
      <section className="page-head wrap">
        <p className="eyebrow"><b>●</b> Comparar</p>
        <h1 className="display" style={{ fontSize: 'var(--step-4)', marginTop: 'var(--space-3)' }}>Lado a <em>lado</em>.</h1>
      </section>
      <section className="wrap" style={{ paddingBottom: 'var(--space-9)' }}>
        {!items ? <div className="skeleton" style={{ height: 300 }} /> : items.length < 2 ? (
          <div className="empty"><p>Seleccione al menos dos vehículos en el inventario para comparar.</p><Link className="btn btn-primary" to="/inventario">Ir al inventario</Link></div>
        ) : (
          <div className="table-scroll">
            <table className="compare-table">
              <thead>
                <tr>
                  <th />
                  {items.map((v) => (
                    <td key={v.id} style={{ minWidth: 220 }}>
                      <Link to={`/vehiculo/${v.slug}`} style={{ display: 'grid', gap: '.5rem' }}>
                        <div style={{ aspectRatio: '16/10', borderRadius: 'var(--radius-m)', overflow: 'hidden' }}><VehicleMedia v={v} /></div>
                        <b>{v.brand} {v.model}</b>
                        <span className="muted">{v.version}</span>
                      </Link>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, get]) => (<tr key={label}><th scope="row">{label}</th>{items.map((v) => (<td key={v.id}>{get(v)}</td>))}</tr>))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export function Privacy() {
  const { business: b, privacyVersion } = useSite();
  const company = show(b.legal?.companyLegalName, '[Razón social pendiente]');
  const contact = b.legal?.privacyContactEmail || b.email || '[correo de privacidad pendiente]';
  return (
    <section className="page-head wrap prose" style={{ paddingBottom: 'var(--space-9)' }}>
      <p className="eyebrow">Versión {privacyVersion}</p>
      <h1 className="display" style={{ fontSize: 'var(--step-3)', color: 'var(--ivory)' }}>Declaración de privacidad</h1>
      <p className="pending-note">Borrador base. Debe revisarlo el propietario y, preferiblemente, un asesor legal en Honduras antes de publicar.</p>
      <h2>Responsable</h2>
      <p>{company} es responsable del tratamiento de los datos que usted envía mediante este sitio. Contacto: {contact}.</p>
      <h2>Qué datos recopilamos</h2>
      <p>Solo los que usted escribe en los formularios: nombre, teléfono, WhatsApp, correo (opcional), vehículo de interés, mensaje, y de forma opcional país, departamento y ciudad. En la solicitud de financiamiento: medio de contacto, precio, prima, plazo y entidad de preferencia. No solicitamos ubicación GPS, contraseñas, números de tarjeta, CVV ni credenciales bancarias.</p>
      <h2>Para qué los usamos</h2>
      <p>Para responder su consulta, coordinar citas y orientarle en su solicitud de financiamiento. Solo le enviaremos novedades comerciales si marcó esa casilla, y puede retirar ese permiso en cualquier momento.</p>
      <h2>Con quién los compartimos</h2>
      <p>No vendemos sus datos. Si usted solicita financiamiento, podremos compartir los datos necesarios con la entidad financiera que usted indique, solo para ese fin.</p>
      <h2>Conservación</h2>
      <p>Conservamos las solicitudes hasta {b.legal?.dataRetentionMonths || 24} meses después del último contacto y luego las eliminamos o anonimizamos.</p>
      <h2>Seguridad</h2>
      <p>El sitio usa conexión cifrada (HTTPS), acceso administrativo con contraseña y registro de acciones. Su dirección IP no se guarda en claro.</p>
      <h2>Sus derechos</h2>
      <p>Puede pedir acceso, corrección o eliminación de sus datos escribiendo a {contact}.</p>
      <h2>Cookies y medición</h2>
      <p>El sitio no activa herramientas de analítica ni publicidad (como Google Analytics o Meta Pixel) sin su consentimiento.</p>
    </section>
  );
}

export function NotFound() {
  return (
    <section className="page-head wrap empty" style={{ marginTop: 'calc(var(--nav-h) + 2rem)' }}>
      <h1 className="h3">Página no encontrada</h1>
      <Link className="btn btn-primary" to="/">Volver al inicio</Link>
    </section>
  );
}
