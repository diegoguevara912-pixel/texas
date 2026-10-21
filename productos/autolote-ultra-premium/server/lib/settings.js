import { fromJson, toJson } from '../db/index.js';

// La configuración del negocio se guarda como un único documento editable.
const KEY = 'business';

export async function ensureSettings(knex, defaults) {
  const row = await knex('settings').where({ key: KEY }).first();
  if (!row) {
    const { _instrucciones, ...clean } = defaults;
    await knex('settings').insert({ key: KEY, value: toJson(clean) });
  }
}

export async function getBusiness(knex) {
  const row = await knex('settings').where({ key: KEY }).first();
  return fromJson(row?.value, {});
}

export async function saveBusiness(knex, value, userId) {
  await knex('settings').where({ key: KEY }).update({ value: toJson(value), updated_by: userId, updated_at: knex.fn.now() });
}

const isPending = (v) => typeof v === 'string' && v.startsWith('PENDIENTE');

// Lista de campos aún pendientes, para el aviso de vista previa y el panel.
export function pendingFields(b) {
  const out = [];
  const check = (label, v) => {
    if (v == null || v === '' || isPending(v) || (Array.isArray(v) && v.length === 0)) out.push(label);
  };
  check('Nombre', b.name);
  check('Eslogan', b.slogan);
  check('Logotipo', b.logoUrl);
  check('Departamento', b.region);
  check('Ciudad', b.city);
  check('Dirección', b.address);
  check('WhatsApp', b.whatsapp);
  check('Correo', b.email);
  check('Marcas', b.brands);
  check('Horarios', (b.hours || []).some((h) => isPending(h.time)) ? null : b.hours);
  check('Razón social', b.legal?.companyLegalName);
  return out;
}

// Subconjunto público: nunca expone datos internos ni cuentas no habilitadas.
export function publicBusiness(b) {
  const services = Object.fromEntries(
    Object.entries(b.services || {}).filter(([, s]) => s.enabled).map(([k, s]) => [k, { label: s.label, description: s.description }]),
  );
  const f = b.financing || {};
  return {
    name: b.name,
    shortName: b.shortName,
    logoUrl: b.logoUrl,
    slogan: b.slogan,
    country: b.country,
    region: b.region,
    city: b.city,
    address: b.address,
    mapEmbedUrl: b.mapEmbedUrl,
    mapLinkUrl: b.mapLinkUrl,
    whatsapp: b.whatsapp,
    whatsappDefaultMessage: b.whatsappDefaultMessage,
    phone: b.phone,
    email: b.email,
    social: b.social,
    hours: b.hours,
    brands: b.brands,
    vehicleTypes: b.vehicleTypes,
    services,
    benefits: b.benefits || [],
    currency: b.currency,
    financing: {
      mode: f.mode,
      annualRate: f.mode === 'authorized' ? f.authorizedAnnualRate : f.mode === 'illustrative' ? f.illustrativeAnnualRate : null,
      minDownPaymentPercent: f.minDownPaymentPercent,
      terms: f.terms,
      partnerBanks: f.partnerBanks || [],
      disclaimer: f.disclaimer,
    },
    payments: {
      transfer: b.payments?.transfer?.enabled ? { enabled: true, accounts: (b.payments.transfer.accounts || []).filter((a) => a.verified).map(({ verified, ...a }) => a) } : { enabled: false },
      gateway: { enabled: !!b.payments?.gateway?.enabled, provider: b.payments?.gateway?.enabled ? b.payments.gateway.provider : null },
    },
    legal: { companyLegalName: b.legal?.companyLegalName, privacyContactEmail: b.legal?.privacyContactEmail, dataRetentionMonths: b.legal?.dataRetentionMonths },
    analytics: { ga4Id: b.analytics?.ga4Id, metaPixelId: b.analytics?.metaPixelId, requireConsent: b.analytics?.requireConsent !== false },
    authorizedClaims: b.authorizedClaims || [],
    pending: pendingFields(b),
  };
}
