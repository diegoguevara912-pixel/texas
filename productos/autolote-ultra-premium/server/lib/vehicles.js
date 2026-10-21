import { fromJson } from '../db/index.js';

export const PUBLIC_STATUSES = ['available', 'reserved'];

export function slugify(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 140);
}

export function serializeVehicle(v, media = [], { internal = false } = {}) {
  const out = {
    id: v.id,
    slug: v.slug,
    inventoryCode: v.inventory_code,
    brand: v.brand,
    model: v.model,
    version: v.version,
    year: v.year,
    price: v.price_visible || internal ? (v.price == null ? null : Number(v.price)) : null,
    priceVisible: !!v.price_visible,
    currency: v.currency,
    mileage: v.mileage,
    mileageUnit: v.mileage_unit,
    transmission: v.transmission,
    fuel: v.fuel,
    engine: v.engine,
    drivetrain: v.drivetrain,
    bodyType: v.body_type,
    colorExt: v.color_ext,
    colorInt: v.color_int,
    condition: v.condition,
    features: fromJson(v.features, []),
    equipment: fromJson(v.equipment, []),
    videos: fromJson(v.videos, []),
    model3dUrl: v.model3d_url,
    description: v.description,
    notesPublic: v.notes_public,
    status: v.status,
    featured: !!v.featured,
    isDemo: !!v.is_demo,
    media: media.map((m) => ({ id: m.id, kind: m.kind, url: m.url, alt: m.alt, width: m.width, height: m.height })),
    updatedAt: v.updated_at,
  };
  if (internal) {
    Object.assign(out, {
      notesInternal: v.notes_internal,
      showInHistory: !!v.show_in_history,
      archived: !!v.archived,
      soldAt: v.sold_at,
      createdAt: v.created_at,
    });
  }
  return out;
}

export async function attachMedia(db, rows) {
  if (!rows.length) return new Map();
  const media = await db('vehicle_media').whereIn('vehicle_id', rows.map((r) => r.id)).orderBy('sort');
  const map = new Map();
  for (const m of media) {
    if (!map.has(m.vehicle_id)) map.set(m.vehicle_id, []);
    map.get(m.vehicle_id).push(m);
  }
  return map;
}

// Filtros públicos del catálogo. Todos los valores pasan por parámetros (sin SQL concatenado).
export function applyCatalogFilters(q, f) {
  if (f.ids) q.whereIn('id', String(f.ids).split(',').map(Number).filter(Number.isInteger).slice(0, 3));
  if (f.brand) q.whereIn('brand', [].concat(f.brand).slice(0, 20));
  if (f.body) q.whereIn('body_type', [].concat(f.body).slice(0, 20));
  if (f.transmission) q.whereIn('transmission', [].concat(f.transmission).slice(0, 5));
  if (f.fuel) q.whereIn('fuel', [].concat(f.fuel).slice(0, 10));
  if (f.minPrice) q.where('price', '>=', Number(f.minPrice));
  if (f.maxPrice) q.where('price', '<=', Number(f.maxPrice));
  if (f.minYear) q.where('year', '>=', Number(f.minYear));
  if (f.maxYear) q.where('year', '<=', Number(f.maxYear));
  if (f.q) {
    const term = `%${String(f.q).slice(0, 60).replace(/[%_\\]/g, ' ').trim()}%`;
    q.where((w) => w.where('brand', 'like', term).orWhere('model', 'like', term).orWhere('version', 'like', term).orWhere('inventory_code', 'like', term));
  }
  return q;
}

export const SORTS = {
  recent: [['featured', 'desc'], ['created_at', 'desc']],
  price_asc: [['price', 'asc']],
  price_desc: [['price', 'desc']],
  year_desc: [['year', 'desc']],
  mileage_asc: [['mileage', 'asc']],
};
