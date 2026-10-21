let csrfToken = null;
export const setCsrf = (t) => (csrfToken = t);

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('Sin conexión. Revise su internet e intente de nuevo.', 0);
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : null;
  if (!res.ok) throw new ApiError(data?.error || `Error ${res.status}`, res.status, data?.fields);
  return data;
}

export function waLink(number, text) {
  if (!number) return null;
  const digits = String(number).replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text || '')}`;
}

export const vehicleLabel = (v) => [v.brand, v.model, v.version].filter(Boolean).join(' ');

export const STATUS_LABEL = { available: 'Disponible', reserved: 'Reservado', sold: 'Vendido', unpublished: 'No publicado' };
