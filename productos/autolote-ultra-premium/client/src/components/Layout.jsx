import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSite, isPending, show } from '../lib/site.jsx';
import { useScrolled } from '../lib/hooks.js';
import { waLink } from '../lib/api.js';
import { Calc, Car, Close, Menu, WhatsApp } from './Icons.jsx';

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="none" stroke="#2f2d2a" />
      <path d="M12 38c6-9 13-14 20-14s14 5 20 14" fill="none" stroke="#D7B97F" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="21" cy="40" r="2.8" fill="#F1ECE3" />
      <circle cx="43" cy="40" r="2.8" fill="#F1ECE3" />
    </svg>
  );
}

export function Brand() {
  const { business: b } = useSite() || {};
  const pending = !b || isPending(b.name);
  return (
    <Link to="/" className="brand" aria-label="Inicio">
      {b?.logoUrl ? <img src={b.logoUrl} alt={pending ? 'Logotipo' : b.name} /> : <BrandMark />}
      <span className="brand-name">{pending ? 'Su Autolote' : b.name}</span>
      {pending && <span className="brand-pending" title="Nombre del negocio pendiente de configurar">PENDIENTE</span>}
    </Link>
  );
}

export function useWhatsApp(message) {
  const { business: b } = useSite() || {};
  return waLink(b?.whatsapp, message || b?.whatsappDefaultMessage);
}

const NAV = [
  { to: '/inventario', label: 'Inventario' },
  { to: '/#showroom', label: 'Showroom 3D' },
  { to: '/financiamiento', label: 'Financiamiento' },
  { to: '/contacto', label: 'Visítenos' },
];

export default function Layout() {
  const site = useSite();
  const b = site?.business;
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const wa = useWhatsApp();

  useEffect(() => {
    setOpen(false);
    if (!loc.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    else document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [loc.pathname, loc.hash]);

  return (
    <>
      <a className="skip" href="#contenido">Saltar al contenido</a>
      {b?.pending?.length > 0 && (
        <div className="preview-strip" role="note">
          Vista previa · {b.pending.length} datos del negocio pendientes ({b.pending.slice(0, 4).join(', ')}{b.pending.length > 4 ? '…' : ''}). Los vehículos marcados DEMO son ficticios.
        </div>
      )}
      <header className={`header ${scrolled || loc.pathname !== '/' ? 'scrolled' : ''}`} style={b?.pending?.length && !scrolled ? { top: 31 } : undefined}>
        <div className="wrap header-inner">
          <Brand />
          <nav className="nav" aria-label="Principal">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="header-cta">
            {wa ? (
              <a className="btn btn-sm btn-ghost" href={wa} target="_blank" rel="noopener noreferrer"><WhatsApp /> WhatsApp</a>
            ) : (
              <span className="btn btn-sm btn-ghost" aria-disabled="true" title="Número de WhatsApp pendiente de configurar"><WhatsApp /> WhatsApp</span>
            )}
          </div>
          <button className="menu-btn" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(true)}><Menu width={20} /></button>
        </div>
      </header>

      {open && (
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Menú">
          <button className="icon-btn close" aria-label="Cerrar menú" onClick={() => setOpen(false)}><Close /></button>
          {NAV.map((n) => (<Link key={n.to} to={n.to}>{n.label}</Link>))}
          <Link to="/privacidad" className="muted" style={{ fontSize: '1rem', fontFamily: 'var(--font-sans)' }}>Privacidad</Link>
        </div>
      )}

      <main id="contenido">
        <Outlet />
      </main>

      <Footer />

      <nav className="dock" aria-label="Acciones rápidas">
        <Link to="/inventario"><Car /> Inventario</Link>
        {wa ? (
          <a className="primary" href={wa} target="_blank" rel="noopener noreferrer"><WhatsApp /> WhatsApp</a>
        ) : (
          <Link className="primary" to="/contacto"><WhatsApp /> Contacto</Link>
        )}
        <Link to="/financiamiento"><Calc /> Financiar</Link>
      </nav>
      {wa && (
        <a className="fab-wa" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp"><WhatsApp /></a>
      )}
    </>
  );
}

function Footer() {
  const { business: b } = useSite() || {};
  const year = new Date().getFullYear();
  const social = Object.entries(b?.social || {}).filter(([, u]) => u);
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div style={{ display: 'grid', gap: '.8rem', alignContent: 'start' }}>
            <Brand />
            <p style={{ margin: 0, maxWidth: '36ch' }}>{show(b?.slogan, 'Eslogan pendiente de configurar.')}</p>
          </div>
          <div>
            <h4>Explorar</h4>
            <ul>
              <li><Link to="/inventario">Inventario</Link></li>
              <li><Link to="/inventario?historial=1">Vendidos recientemente</Link></li>
              <li><Link to="/financiamiento">Simulador de cuota</Link></li>
              <li><Link to="/contacto">Agendar visita</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li>{show(b?.address, 'Dirección pendiente')}</li>
              <li>{[show(b?.city, ''), show(b?.region, ''), b?.country].filter(Boolean).join(', ')}</li>
              {b?.phone && <li><a href={`tel:${b.phone}`}>{b.phone}</a></li>}
              {b?.email && <li><a href={`mailto:${b.email}`}>{b.email}</a></li>}
            </ul>
          </div>
          <div>
            <h4>Horario</h4>
            <ul>
              {(b?.hours || []).map((h) => (<li key={h.days}>{h.days}: {show(h.time, 'pendiente')}</li>))}
            </ul>
            {social.length > 0 && (
              <ul style={{ marginTop: '1rem' }}>
                {social.map(([k, u]) => (<li key={k}><a href={u} target="_blank" rel="noopener noreferrer" style={{ textTransform: 'capitalize' }}>{k}</a></li>))}
              </ul>
            )}
          </div>
        </div>
        <div className="footer-legal">
          <span>© {year} {isPending(b?.legal?.companyLegalName) ? 'Razón social pendiente' : b.legal.companyLegalName}</span>
          <span><Link to="/privacidad">Privacidad y tratamiento de datos</Link> · <Link to="/admin">Acceso privado</Link></span>
        </div>
      </div>
    </footer>
  );
}
