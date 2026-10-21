import { config } from '../config.js';
import { getBusiness } from './settings.js';
import { PUBLIC_STATUSES } from './vehicles.js';
import { formatMoney } from '../../shared/finance.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clean = (s) => (typeof s === 'string' && s.startsWith('PENDIENTE') ? null : s);

// Inserta título, descripción, Open Graph y datos estructurados en el HTML de la SPA,
// para que buscadores y vistas previas de WhatsApp/Facebook lean cada página.
export async function renderMeta(db, urlPath) {
  const b = await getBusiness(db);
  const name = clean(b.name) || 'Showroom de vehículos';
  const place = [clean(b.city), clean(b.region), b.country].filter(Boolean).join(', ');
  let title = `${name} | Vehículos seleccionados${place ? ' en ' + place : ''}`;
  let description = clean(b.slogan) || `Explore el inventario de ${name}: vehículos con fotografías reales, ficha técnica, simulador de cuota y contacto directo por WhatsApp.`;
  let image = `${config.publicUrl}/og-default.jpg`;
  let canonical = `${config.publicUrl}${urlPath === '/' ? '' : urlPath}`;
  const ld = [];

  if (clean(b.name)) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'AutoDealer',
      name,
      url: config.publicUrl,
      ...(clean(b.address) && { address: { '@type': 'PostalAddress', streetAddress: b.address, addressLocality: clean(b.city), addressRegion: clean(b.region), addressCountry: b.country } }),
      ...(b.phone && { telephone: b.phone }),
      ...(b.logoUrl && { logo: config.publicUrl + b.logoUrl }),
    });
  }

  const m = urlPath.match(/^\/vehiculo\/([a-z0-9-]+)$/);
  if (m) {
    const v = await db('vehicles').where({ slug: m[1], archived: false }).first();
    if (v && (PUBLIC_STATUSES.includes(v.status) || (v.status === 'sold' && v.show_in_history))) {
      const label = [v.brand, v.model, v.version, v.year].filter(Boolean).join(' ');
      const price = v.price_visible && v.price ? formatMoney(v.price, { code: v.currency, locale: 'es-HN' }) : null;
      title = `${label}${price ? ' · ' + price : ''} | ${name}`;
      description = `${label}. ${[v.mileage != null && `${Number(v.mileage).toLocaleString('es-HN')} ${v.mileage_unit}`, v.transmission, v.fuel, v.color_ext].filter(Boolean).join(' · ')}. Código ${v.inventory_code}.`;
      const media = await db('vehicle_media').where({ vehicle_id: v.id, kind: 'image' }).orderBy('sort').first();
      if (media) image = config.publicUrl + media.url;
      if (!v.is_demo) {
        ld.push({
          '@context': 'https://schema.org',
          '@type': 'Car',
          name: label,
          brand: { '@type': 'Brand', name: v.brand },
          model: v.model,
          vehicleModelDate: String(v.year),
          ...(v.mileage != null && { mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.mileage, unitCode: v.mileage_unit === 'km' ? 'KMT' : 'SMI' } }),
          ...(v.color_ext && { color: v.color_ext }),
          ...(v.transmission && { vehicleTransmission: v.transmission }),
          ...(v.fuel && { fuelType: v.fuel }),
          image: media ? [config.publicUrl + media.url] : undefined,
          ...(v.price_visible && v.price && {
            offers: {
              '@type': 'Offer',
              price: Number(v.price),
              priceCurrency: v.currency,
              availability: v.status === 'available' ? 'https://schema.org/InStock' : v.status === 'reserved' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/SoldOut',
              url: canonical,
            },
          }),
        });
      }
    } else {
      title = `Vehículo no disponible | ${name}`;
    }
  } else if (urlPath.startsWith('/inventario')) {
    title = `Inventario disponible | ${name}`;
    description = `Vehículos disponibles${place ? ' en ' + place : ''}: filtre por marca, precio, año, transmisión y combustible.`;
  } else if (urlPath.startsWith('/financiamiento')) {
    title = `Simulador y solicitud de financiamiento | ${name}`;
    description = 'Calcule una cuota orientativa y solicite que le contactemos. La simulación no constituye aprobación crediticia.';
  } else if (urlPath.startsWith('/admin')) {
    title = `Panel privado | ${name}`;
  }

  const robots = urlPath.startsWith('/admin') ? 'noindex, nofollow' : 'index, follow';
  return `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${esc(canonical)}">
    <meta property="og:type" content="${m ? 'product' : 'website'}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${esc(image)}">
    <meta property="og:url" content="${esc(canonical)}">
    <meta property="og:locale" content="es_HN">
    <meta name="twitter:card" content="summary_large_image">
    ${b.analytics?.searchConsoleVerification ? `<meta name="google-site-verification" content="${esc(b.analytics.searchConsoleVerification)}">` : ''}
    ${ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`).join('\n')}
  `;
}

export async function sitemap(db) {
  const vehicles = await db('vehicles').where({ archived: false, is_demo: false }).whereIn('status', PUBLIC_STATUSES).select('slug', 'updated_at');
  const urls = [
    { loc: '/', priority: '1.0' },
    { loc: '/inventario', priority: '0.9' },
    { loc: '/financiamiento', priority: '0.6' },
    { loc: '/contacto', priority: '0.6' },
    ...vehicles.map((v) => ({ loc: `/vehiculo/${v.slug}`, lastmod: new Date(v.updated_at).toISOString().slice(0, 10), priority: '0.8' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${config.publicUrl}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`)
    .join('\n')}\n</urlset>`;
}
