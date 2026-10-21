import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import VehicleCard from '../components/VehicleCard.jsx';
import { Close, Filter, Search } from '../components/Icons.jsx';
import { api } from '../lib/api.js';
import { useLocalList, useReveal } from '../lib/hooks.js';
import { useSite } from '../lib/site.jsx';
import { formatMoney } from '@shared/finance.js';

const SORTS = [
  ['recent', 'Destacados primero'],
  ['price_asc', 'Precio: menor a mayor'],
  ['price_desc', 'Precio: mayor a menor'],
  ['year_desc', 'Año: más reciente'],
  ['mileage_asc', 'Menor kilometraje'],
];

// Parámetros de URL en español para que los enlaces compartidos sean legibles.
const MAP = { marca: 'brand', tipo: 'body', transmision: 'transmission', combustible: 'fuel', estado: 'status' };

function Chips({ title, param, options, params, setParam }) {
  if (!options?.length) return null;
  const selected = params.getAll(param);
  return (
    <div>
      <h3>{title}</h3>
      <div className="filter-chips">
        {options.map((o) => {
          const on = selected.includes(o.value ?? o);
          return (
            <button key={o.value ?? o} type="button" className="chip" aria-pressed={on} onClick={() => setParam(param, o.value ?? o, !on)}>
              {o.label ?? o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Catalog() {
  const { business: b } = useSite() || {};
  const [params, setParams] = useSearchParams();
  const [facets, setFacets] = useState(null);
  const [data, setData] = useState({ loading: true, items: [], total: 0, error: null });
  const [drawer, setDrawer] = useState(false);
  const [compare, toggleCompare, setCompare] = useLocalList('al_compare', 3);
  const [q, setQ] = useState(params.get('q') || '');
  const navigate = useNavigate();
  const history = params.get('historial') === '1';
  useReveal();

  useEffect(() => { api('/vehicles/facets').then(setFacets).catch(() => setFacets({})); }, []);

  const query = useMemo(() => {
    const out = new URLSearchParams();
    for (const [k, v] of params.entries()) {
      if (MAP[k]) out.append(MAP[k], v);
      else if (['q', 'sort', 'minPrice', 'maxPrice', 'minYear', 'maxYear', 'page'].includes(k)) out.set(k, v);
    }
    if (history) out.set('history', '1');
    out.set('perPage', '24');
    return out.toString();
  }, [params, history]);

  useEffect(() => {
    setData((d) => ({ ...d, loading: true, error: null }));
    api(`/vehicles?${query}`)
      .then((r) => setData({ loading: false, items: r.items, total: r.total, error: null }))
      .catch((e) => setData({ loading: false, items: [], total: 0, error: e.message }));
  }, [query]);

  // Búsqueda con espera para no consultar en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') || '') === q) return;
      const p = new URLSearchParams(params);
      q ? p.set('q', q) : p.delete('q');
      setParams(p, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParam = (key, value, on) => {
    const p = new URLSearchParams(params);
    const vals = p.getAll(key).filter((v) => v !== String(value));
    p.delete(key);
    vals.forEach((v) => p.append(key, v));
    if (on) p.append(key, value);
    p.delete('page');
    setParams(p, { replace: true });
  };
  const setSingle = (key, value) => {
    const p = new URLSearchParams(params);
    value ? p.set(key, value) : p.delete(key);
    setParams(p, { replace: true });
  };
  const activeCount = [...params.keys()].filter((k) => MAP[k] || /^(min|max)/.test(k)).length;
  const currency = b?.currency;

  const priceSteps = useMemo(() => {
    const max = Number(facets?.maxPrice) || 0;
    if (!max) return [];
    return [300000, 500000, 800000, 1200000, 2000000, 3000000].filter((x) => x <= max * 1.2);
  }, [facets]);

  const filters = (
    <div className="filters">
      <Chips title="Marca" param="marca" options={facets?.brands} params={params} setParam={setParam} />
      <Chips title="Tipo de vehículo" param="tipo" options={facets?.bodies} params={params} setParam={setParam} />
      {priceSteps.length > 0 && (
        <div>
          <h3>Precio máximo</h3>
          <div className="filter-chips">
            {priceSteps.map((p) => (
              <button key={p} type="button" className="chip" aria-pressed={params.get('maxPrice') === String(p)} onClick={() => setSingle('maxPrice', params.get('maxPrice') === String(p) ? null : p)}>
                {formatMoney(p, currency)}
              </button>
            ))}
          </div>
        </div>
      )}
      {facets?.minYear && (
        <div>
          <h3>Año desde</h3>
          <select className="select-sm" value={params.get('minYear') || ''} onChange={(e) => setSingle('minYear', e.target.value)} aria-label="Año desde">
            <option value="">Cualquiera</option>
            {Array.from({ length: Number(facets.maxYear) - Number(facets.minYear) + 1 }, (_, i) => Number(facets.maxYear) - i).map((y) => (<option key={y}>{y}</option>))}
          </select>
        </div>
      )}
      <Chips title="Transmisión" param="transmision" options={facets?.transmissions} params={params} setParam={setParam} />
      <Chips title="Combustible" param="combustible" options={facets?.fuels} params={params} setParam={setParam} />
      {!history && (
        <Chips title="Disponibilidad" param="estado" options={[{ value: 'available', label: 'Disponible' }, { value: 'reserved', label: 'Reservado' }]} params={params} setParam={setParam} />
      )}
      {activeCount > 0 && <button className="btn btn-sm" type="button" onClick={() => setParams(new URLSearchParams(history ? { historial: '1' } : {}))}>Limpiar filtros</button>}
    </div>
  );

  return (
    <>
      <section className="page-head wrap">
        <p className="eyebrow"><b>●</b> {history ? 'Galería histórica' : 'Inventario'}</p>
        <h1 className="display" style={{ fontSize: 'var(--step-4)', marginTop: 'var(--space-3)' }}>
          {history ? <>Vendidos <em>recientemente</em></> : <>El <em>inventario</em>, completo.</>}
        </h1>
        <p className="lede" style={{ marginTop: 'var(--space-4)' }}>
          {history ? 'Unidades que ya encontraron dueño. Se muestran solo como referencia.' : 'Filtre, compare hasta tres unidades y abra la ficha completa de cada vehículo.'}
        </p>
        <p style={{ marginTop: 'var(--space-4)' }}>
          {history ? <Link className="link-arrow" to="/inventario">Ver inventario disponible</Link> : <Link className="link-arrow" to="/inventario?historial=1">Ver vendidos recientemente</Link>}
        </p>
      </section>
      <section className="wrap" style={{ paddingBottom: 'var(--space-9)' }}>
        <div className="catalog">
          <aside>
            <div className="hide-mobile">{filters}</div>
          </aside>
          <div>
            <div className="toolbar">
              <label className="search">
                <Search />
                <span className="sr-only">Buscar</span>
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar marca, modelo o código" />
              </label>
              <button type="button" className="btn btn-sm show-mobile" onClick={() => setDrawer(true)}><Filter /> Filtros{activeCount ? ` (${activeCount})` : ''}</button>
              <select className="select-sm" value={params.get('sort') || 'recent'} onChange={(e) => setSingle('sort', e.target.value === 'recent' ? null : e.target.value)} aria-label="Ordenar">
                {SORTS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
              </select>
            </div>
            <p className="muted mono" style={{ fontSize: '.8rem', marginBottom: 'var(--space-5)' }} aria-live="polite">
              {data.loading ? 'Buscando…' : `${data.total} ${data.total === 1 ? 'vehículo' : 'vehículos'}`}
            </p>
            {data.error && <p className="form-error">{data.error} <button className="btn btn-sm" onClick={() => setParams(new URLSearchParams(params))}>Reintentar</button></p>}
            {data.loading && !data.items.length ? (
              <div className="v-grid">{Array.from({ length: 6 }, (_, i) => (<div key={i} className="skeleton" style={{ aspectRatio: '16/14' }} />))}</div>
            ) : data.items.length ? (
              <div className="v-grid" style={{ opacity: data.loading ? 0.5 : 1, transition: 'opacity .3s' }}>
                {data.items.map((v) => (
                  <VehicleCard key={v.id} v={v} currency={currency} compare={compare.includes(v.id)} onCompare={history ? null : toggleCompare} />
                ))}
              </div>
            ) : (
              !data.error && (
                <div className="empty">
                  <h2 className="h3">No encontramos vehículos con esos filtros</h2>
                  <p className="muted">Pruebe quitando algún filtro o escríbanos: podemos avisarle cuando llegue una unidad así.</p>
                  <div className="hero-actions" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-sm" onClick={() => { setQ(''); setParams(new URLSearchParams()); }}>Limpiar filtros</button>
                    <Link className="btn btn-sm btn-primary" to="/contacto">Avíseme</Link>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {drawer && (
        <div className="filters-drawer" role="dialog" aria-modal="true" aria-label="Filtros">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <h2 className="h3">Filtros</h2>
            <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Cerrar filtros"><Close /></button>
          </div>
          {filters}
          <button className="btn btn-primary" style={{ position: 'fixed', left: 'var(--gutter)', right: 'var(--gutter)', bottom: 'calc(1rem + env(safe-area-inset-bottom))' }} onClick={() => setDrawer(false)}>
            Ver {data.total} resultados
          </button>
        </div>
      )}

      {compare.length > 0 && (
        <div className="compare-tray" role="region" aria-label="Comparación">
          <span>{compare.length} de 3 para comparar</span>
          <button className="btn btn-sm" style={{ '--bg': 'transparent', '--fg': 'var(--ink-0)', '--bd': 'rgba(0,0,0,.2)' }} onClick={() => setCompare([])}>Quitar</button>
          <button className="btn btn-sm" disabled={compare.length < 2} onClick={() => navigate(`/comparar?ids=${compare.join(',')}`)}>Comparar</button>
        </div>
      )}
    </>
  );
}
