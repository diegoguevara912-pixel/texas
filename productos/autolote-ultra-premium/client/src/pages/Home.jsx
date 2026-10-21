import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from '../components/Hero.jsx';
import VehicleCard, { PriceTag, VehicleMedia } from '../components/VehicleCard.jsx';
import Simulator from '../components/Simulator.jsx';
import { AppointmentForm } from '../components/Forms.jsx';
import { Arrow, Pin, WhatsApp } from '../components/Icons.jsx';
import { useWhatsApp } from '../components/Layout.jsx';
import { api } from '../lib/api.js';
import { usePrefersReducedMotion, useReveal } from '../lib/hooks.js';
import { show, useSite } from '../lib/site.jsx';

gsap.registerPlugin(ScrollTrigger);

function Statement() {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const text = 'Un showroom no es un patio de autos. Es el lugar donde cada unidad se muestra con su historia, su ficha completa y un precio claro, para que usted decida con calma.';
  useLayoutEffect(() => {
    if (reduced) return;
    const words = ref.current.querySelectorAll('.w');
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 80%',
      end: 'bottom 45%',
      scrub: true,
      onUpdate: (self) => {
        const n = Math.round(self.progress * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < n));
      },
    });
    return () => st.kill();
  }, [reduced]);
  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow" style={{ marginBottom: 'var(--space-5)' }}><b>01</b> · La experiencia</p>
        <p className="statement" ref={ref}>
          {text.split(' ').map((w, i) => (<span key={i} className="w">{w} </span>))}
        </p>
      </div>
    </section>
  );
}

// Galería horizontal anclada al scroll en escritorio; deslizable en móvil.
function FeaturedReel({ items, currency }) {
  const section = useRef(null);
  const track = useRef(null);
  const reel = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [pinned, setPinned] = useState(false);
  useLayoutEffect(() => {
    if (reduced || !items.length) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 980px)', () => {
      setPinned(true);
      const distance = () => Math.max(0, track.current.scrollWidth - window.innerWidth);
      const tween = gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        // Solo se fija la fila de vehículos, centrada bajo la barra de navegación: el titular sigue
        // de largo y las tarjetas (dimensionadas por la altura de pantalla) quedan completas.
        scrollTrigger: { trigger: reel.current, start: 'center center+=34', end: () => `+=${distance()}`, scrub: 0.6, pin: true, invalidateOnRefresh: true },
      });
      return () => { tween.scrollTrigger?.kill(); tween.kill(); setPinned(false); };
    });
    return () => mm.revert();
  }, [items.length, reduced]);
  if (!items.length) return null;
  return (
    <section className="section" ref={section} style={{ overflow: 'hidden' }}>
      <div className="wrap section-head split">
        <div>
          <p className="eyebrow"><b>02</b> · Selección destacada</p>
          <h2 className="h2">Piezas <em>elegidas</em><br />esta temporada.</h2>
        </div>
        <p className="lede">Una selección curada del inventario. Cada ficha incluye código de inventario, estado y datos técnicos verificables.</p>
      </div>
      <div ref={reel} className={`reel ${pinned ? '' : 'scrollable'}`}>
        <div className="reel-track" ref={track}>
          {items.map((v, i) => (
            <Link key={v.id} to={`/vehiculo/${v.slug}`} className="reel-card">
              <div className="reel-media">
                <VehicleMedia v={v} />
                <span className="badges" style={{ position: 'absolute', top: '.8rem', left: '.8rem', display: 'flex', gap: '.35rem' }}>
                  {v.isDemo && <span className="badge demo">Demo</span>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <span className="reel-index">{String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')} · {v.year}</span>
                  <div className="reel-title">{v.brand} {v.model}</div>
                  <span className="muted">{v.version}</span>
                </div>
                <PriceTag v={v} currency={currency} />
              </div>
            </Link>
          ))}
          <Link to="/inventario" className="reel-card" style={{ alignContent: 'center', justifyItems: 'start', minHeight: 300 }}>
            <span className="eyebrow">Inventario completo</span>
            <span className="reel-title">Ver todos los vehículos <Arrow width={28} style={{ display: 'inline' }} /></span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function InventoryPreview({ items, total, currency }) {
  const brands = [...new Set(items.map((v) => v.brand))].slice(0, 6);
  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, transparent, var(--ink-1) 30%, var(--ink-1) 70%, transparent)' }}>
      <div className="wrap">
        <div className="section-head split">
          <div>
            <p className="eyebrow"><b>03</b> · Inventario disponible</p>
            <h2 className="h2"><span className="mono" style={{ fontSize: '.5em', verticalAlign: 'top', color: 'var(--champagne)' }}>{String(total).padStart(2, '0')}</span> unidades<br /><em>listas</em> para verse.</h2>
          </div>
          <div style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
            <div className="filter-chips">
              {brands.map((b) => (<Link key={b} className="chip" style={{ display: 'inline-flex', alignItems: 'center' }} to={`/inventario?marca=${encodeURIComponent(b)}`}>{b}</Link>))}
            </div>
            <Link to="/inventario" className="link-arrow">Filtrar por precio, año y más <Arrow /></Link>
          </div>
        </div>
        <div className="v-grid">
          {items.slice(0, 6).map((v) => (<VehicleCard key={v.id} v={v} currency={currency} />))}
        </div>
        {!items.length && <div className="empty"><h3 className="h3">Inventario en preparación</h3><p className="muted">Pronto publicaremos las unidades disponibles.</p></div>}
      </div>
    </section>
  );
}

const PROCESS = [
  ['Explore sin presión', 'Filtre el inventario, compare hasta tres vehículos y revise la ficha técnica completa desde su teléfono.'],
  ['Véalo en persona', 'Agende una visita. Su cita queda pendiente hasta que le confirmemos el horario.'],
  ['Calcule y consulte', 'Use el simulador para una cuota orientativa y, si desea, solicite que le orientemos con una entidad financiera.'],
  ['Decida con información', 'Precio, estado y código de inventario visibles en cada unidad. Sin letra pequeña escondida en la web.'],
];

function Process() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow"><b>04</b> · Cómo funciona</p>
          <h2 className="h2">De la pantalla<br />al <em>volante</em>.</h2>
        </div>
        <ol className="process" style={{ padding: 0, margin: 0 }}>
          {PROCESS.map(([t, d], i) => (
            <li key={t} className="reveal">
              <span className="n">0{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Services() {
  const { business: b } = useSite();
  const services = Object.entries(b.services || {});
  const benefits = b.benefits || [];
  const link = { visit: '/contacto#agendar', testDrive: '/contacto#agendar', inspection: '/contacto#agendar', financing: '/financiamiento', reservation: '/contacto', tradeIn: '/contacto' };
  return (
    <section className="section">
      <div className="wrap split">
        <div>
          <p className="eyebrow"><b>05</b> · Servicios</p>
          <h2 className="h2" style={{ marginTop: 'var(--space-4)' }}>Lo que <em>sí</em><br />ofrecemos.</h2>
          <p className="lede" style={{ marginTop: 'var(--space-5)' }}>Solo mostramos servicios activados por el autolote. Nada de promesas genéricas.</p>
          {benefits.length > 0 ? (
            <ul className="info-list" style={{ marginTop: 'var(--space-6)', paddingLeft: 0, listStyle: 'none' }}>
              {benefits.map((x) => (<li key={x}>— {x}</li>))}
            </ul>
          ) : (
            <p className="pending-note" style={{ marginTop: 'var(--space-6)' }}>Beneficios de comprar con la empresa: pendientes. Se publicarán solo los que el autolote confirme (por ejemplo, garantías, revisión mecánica o trámites incluidos).</p>
          )}
        </div>
        <ul className="services">
          {services.map(([k, s]) => (
            <li key={k} className="reveal">
              <Link to={link[k] || '/contacto'}>
                <span className="name">{s.label}</span>
                <span className="go"><Arrow width={20} /></span>
                <p className="desc">{s.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FinancingTeaser() {
  return (
    <section className="section" id="simulador">
      <div className="wrap">
        <div className="section-head split">
          <div>
            <p className="eyebrow"><b>06</b> · Financiamiento</p>
            <h2 className="h2">Su cuota,<br /><em>antes</em> de preguntar.</h2>
          </div>
          <div style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
            <p className="lede">Mueva los controles y vea una estimación al instante. No somos un banco y no garantizamos aprobación.</p>
            <Link to="/financiamiento" className="link-arrow">Solicitar financiamiento <Arrow /></Link>
          </div>
        </div>
        <Simulator />
      </div>
    </section>
  );
}

function VisitAndLocation() {
  const { business: b } = useSite();
  const [mapOn, setMapOn] = useState(false);
  const wa = useWhatsApp();
  return (
    <section className="section" id="visita">
      <div className="wrap split">
        <div className="panel">
          <p className="eyebrow"><b>07</b> · Reservar visita</p>
          <h2 className="h2" style={{ fontSize: 'var(--step-3)', margin: 'var(--space-4) 0 var(--space-6)' }}>Venga a <em>verlo</em>.</h2>
          <AppointmentForm />
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-5)', alignContent: 'start' }}>
          <p className="eyebrow"><b>08</b> · Ubicación</p>
          <div className="map-box">
            {b.mapEmbedUrl ? (
              mapOn ? <iframe title="Mapa de ubicación" src={b.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : (
                <div style={{ display: 'grid', gap: '.8rem', justifyItems: 'center' }}>
                  <Pin width={32} />
                  <button className="btn btn-sm" onClick={() => setMapOn(true)}>Cargar mapa</button>
                  <span className="muted" style={{ fontSize: '.78rem' }}>El mapa lo provee Google y se carga solo si usted lo solicita.</span>
                </div>
              )
            ) : (
              <div style={{ display: 'grid', gap: '.6rem', justifyItems: 'center' }}><Pin width={32} /><span className="muted">Mapa pendiente: configure la ubicación en el panel.</span></div>
            )}
          </div>
          <dl className="info-list">
            <div><dt>Dirección</dt><dd>{show(b.address)}</dd></div>
            <div><dt>Ciudad</dt><dd>{[show(b.city, ''), show(b.region, ''), b.country].filter(Boolean).join(', ') || 'Pendiente'}</dd></div>
            <div><dt>Horario</dt><dd>{(b.hours || []).map((h) => (<div key={h.days}>{h.days}: {show(h.time, 'pendiente')}</div>))}</dd></div>
          </dl>
          {wa ? <a className="btn btn-wa" href={wa} target="_blank" rel="noopener noreferrer" style={{ justifySelf: 'start' }}><WhatsApp /> Escribir por WhatsApp</a> : <p className="pending-note">WhatsApp pendiente de configurar.</p>}
          {b.mapLinkUrl && <a className="link-arrow" href={b.mapLinkUrl} target="_blank" rel="noopener noreferrer">Cómo llegar <Arrow /></a>}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const { faqs } = useSite();
  if (!faqs?.length) return null;
  return (
    <section className="section">
      <div className="wrap split">
        <div>
          <p className="eyebrow"><b>09</b> · Preguntas frecuentes</p>
          <h2 className="h2" style={{ marginTop: 'var(--space-4)' }}>Respuestas<br /><em>claras</em>.</h2>
        </div>
        <div className="faq">
          {faqs.map((f) => (
            <details key={f.id}>
              <summary>{f.question}<span className="pm" aria-hidden="true" /></summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const wa = useWhatsApp();
  return (
    <section className="final-cta">
      <div className="wrap" style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-5)' }}>
        <p className="eyebrow">¿Listo para el siguiente paso?</p>
        <h2 className="h2" style={{ maxWidth: '14ch' }}>Encuentre el suyo. <em>Hoy.</em></h2>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <Link className="btn btn-primary" to="/inventario">Ver inventario <Arrow /></Link>
          {wa && <a className="btn btn-wa" href={wa} target="_blank" rel="noopener noreferrer"><WhatsApp /> WhatsApp</a>}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const site = useSite();
  const [inv, setInv] = useState({ items: [], total: 0, featured: [] });
  useReveal();
  useEffect(() => {
    Promise.all([api('/vehicles?perPage=12'), api('/vehicles?featured=1&perPage=8')])
      .then(([all, feat]) => setInv({ items: all.items, total: all.total, featured: feat.items }))
      .catch(() => {});
  }, []);
  useEffect(() => { ScrollTrigger.refresh(); }, [inv.items.length]);
  const currency = site?.business?.currency;
  if (!site?.business) return <Hero />;
  return (
    <>
      <Hero />
      <Statement />
      <FeaturedReel items={inv.featured} currency={currency} />
      <InventoryPreview items={inv.items} total={inv.total} currency={currency} />
      <Process />
      <Services />
      {site.business.services?.financing && <FinancingTeaser />}
      <VisitAndLocation />
      <Faq />
      <FinalCta />
    </>
  );
}
