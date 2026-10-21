import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { detectDeviceTier, usePrefersReducedMotion } from '../lib/hooks.js';
import { Arrow, Cube, Rotate } from './Icons.jsx';
import CarSilhouette from './CarSilhouette.jsx';

const Showroom = lazy(() => import('../three/Showroom.jsx'));

const VIEW_BUTTONS = [
  { id: 'hero', label: 'Inicio' },
  { id: 'front', label: 'Frente' },
  { id: 'side', label: 'Lateral' },
  { id: 'rear', label: 'Trasera' },
  { id: 'top', label: 'Superior' },
];

export default function Hero() {
  const reduced = usePrefersReducedMotion();
  const [tier, setTier] = useState(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState('showcase');
  const [view, setView] = useState(null);
  const [active, setActive] = useState(null);
  const [visible, setVisible] = useState(true);
  const root = useRef(null);
  const intro = useRef(!sessionStorage.getItem('al_intro'));

  useEffect(() => {
    setTier(detectDeviceTier());
    try { sessionStorage.setItem('al_intro', '1'); } catch { /* sin almacenamiento */ }
  }, []);

  // Pausa el render 3D cuando el hero sale de pantalla: ahorra batería en móviles.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-title .line > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: intro.current ? 0.9 : 0.1 });
      gsap.from('.hero-fade', { opacity: 0, y: 14, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: intro.current ? 1.5 : 0.35 });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  const toggleExplore = () => {
    const next = mode === 'explore' ? 'showcase' : 'explore';
    setMode(next);
    setActive(null);
    setView(next === 'explore' ? 'side' : 'hero');
  };

  const has3D = tier && tier !== 'none';

  return (
    <section className="hero" id="showroom" ref={root} aria-label="Showroom digital">
      <div className="hero-canvas" style={{ opacity: has3D && ready ? 1 : 0, transition: 'opacity 1.2s var(--ease)' }}>
        {has3D && (
          <Suspense fallback={null}>
            <Showroom tier={tier} mode={mode} view={view} reduced={reduced} active={active} onSelectHotspot={setActive} onReady={() => setReady(true)} visible={visible} intro={intro.current} />
          </Suspense>
        )}
      </div>
      {(!has3D || !ready) && (
        <div className="hero-poster" aria-hidden="true">
          <div style={{ width: 'min(1000px, 110vw)' }}><CarSilhouette color="#1d1c1b" label={tier === 'none' ? 'Vista estática' : 'Cargando showroom 3D'} /></div>
        </div>
      )}
      {mode === 'showcase' && <div className="hero-vignette" />}

      <div className="hero-copy wrap" style={mode === 'explore' ? { pointerEvents: 'none' } : undefined}>
        <div style={{ opacity: mode === 'explore' ? 0 : 1, transition: 'opacity .5s var(--ease)' }}>
          <p className="eyebrow hero-fade"><b>●</b> Showroom digital · Honduras</p>
          <h1 className="display hero-title">
            <span className="line"><span>Cada vehículo</span></span>
            <span className="line"><span>merece una</span></span>
            <span className="line"><span><em>presentación</em>.</span></span>
          </h1>
        </div>
        <div className="hero-bottom" style={{ pointerEvents: 'auto' }}>
          <div className="hero-actions hero-fade" style={{ opacity: mode === 'explore' ? 0 : 1, pointerEvents: mode === 'explore' ? 'none' : 'auto', transition: 'opacity .5s' }}>
            <Link className="btn btn-primary" to="/inventario">Explorar inventario <Arrow /></Link>
            {has3D && (
              <button className="btn btn-ghost" type="button" onClick={toggleExplore}><Cube /> Explorar en 3D</button>
            )}
          </div>
          <div className="hero-meta hero-fade" style={{ opacity: mode === 'explore' ? 0 : 1, transition: 'opacity .5s' }}>
            <span className="scroll-cue" style={{ justifySelf: 'end' }}><i /> Desliza</span>
            <span className="hero-note">Vehículo conceptual ilustrativo, creado para este showroom. No representa una unidad del inventario.</span>
          </div>
        </div>
      </div>

      {mode === 'explore' && (
        <>
          <div className="explore-ui" role="toolbar" aria-label="Vistas del vehículo">
            {VIEW_BUTTONS.map((b) => (
              <button key={b.id} type="button" aria-pressed={view === b.id} onClick={() => setView(b.id)}>{b.label}</button>
            ))}
            <button type="button" onClick={toggleExplore} aria-label="Salir del modo 3D"><Rotate width={16} /> Salir</button>
          </div>
          <p className="hero-note" style={{ position: 'absolute', top: 'calc(var(--nav-h) + 1.5rem)', left: 'var(--gutter)', zIndex: 5 }}>
            Arrastre para girar · rueda o pellizco para acercar · toque los puntos para ver detalles.<br />Concepto ilustrativo.
          </p>
        </>
      )}
    </section>
  );
}
