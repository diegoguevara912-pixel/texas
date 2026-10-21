import { Link } from 'react-router-dom';
import { formatMoney } from '@shared/finance.js';
import { STATUS_LABEL } from '../lib/api.js';
import CarSilhouette from './CarSilhouette.jsx';

export function VehicleMedia({ v, eager = false }) {
  const img = v.media?.find((m) => m.kind === 'image');
  if (img) {
    return <img src={img.url} alt={img.alt || `${v.brand} ${v.model} ${v.year}`} loading={eager ? 'eager' : 'lazy'} decoding="async" width={img.width || 1200} height={img.height || 800} />;
  }
  const color = v.isDemo && /^#[0-9a-f]{6}$/i.test(v.notesPublic || '') ? v.notesPublic : '#2a2825';
  return <CarSilhouette color={color} body={v.bodyType} label={v.isDemo ? 'Ilustración · demo' : 'Fotografía pendiente'} />;
}

export function PriceTag({ v, currency }) {
  if (!v.priceVisible || v.price == null) return <span className="price">Consultar<small>precio a solicitud</small></span>;
  return (
    <span className="price">
      {formatMoney(v.price, { ...currency, code: v.currency })}
      {v.isDemo && <small>precio de ejemplo · demo</small>}
    </span>
  );
}

export default function VehicleCard({ v, currency, compare, onCompare }) {
  return (
    <article className="v-card reveal">
      {onCompare && (
        <button type="button" className="compare-toggle" aria-pressed={compare} onClick={() => onCompare(v.id)}>
          {compare ? '✓ Comparando' : '+ Comparar'}
        </button>
      )}
      <Link to={`/vehiculo/${v.slug}`} className="media" aria-label={`Ver ${v.brand} ${v.model} ${v.year}`}>
        <VehicleMedia v={v} />
        <span className="badges">
          {v.isDemo && <span className="badge demo">Demo</span>}
          <span className={`badge ${v.status}`}>{STATUS_LABEL[v.status]}</span>
        </span>
      </Link>
      <Link to={`/vehiculo/${v.slug}`} className="title">
        {v.brand} {v.model}
        <small>{[v.version, v.year].filter(Boolean).join(' · ')}</small>
      </Link>
      <div className="specs">
        {v.mileage != null && <span>{Number(v.mileage).toLocaleString('es-HN')} {v.mileageUnit}</span>}
        {v.transmission && <span>{v.transmission}</span>}
        {v.fuel && <span>{v.fuel}</span>}
        {v.drivetrain && <span>{v.drivetrain}</span>}
      </div>
      <div className="price-row">
        <PriceTag v={v} currency={currency} />
        <span className="mono muted" style={{ fontSize: '.72rem' }}>{v.inventoryCode}</span>
      </div>
    </article>
  );
}
