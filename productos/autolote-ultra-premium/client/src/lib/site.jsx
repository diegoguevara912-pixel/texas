import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const SiteCtx = createContext(null);

export function SiteProvider({ children }) {
  const [state, setState] = useState({ loading: true, business: null, faqs: [], error: null });
  useEffect(() => {
    api('/site')
      .then((d) => setState({ loading: false, business: d.business, faqs: d.faqs, privacyVersion: d.privacyVersion, error: null }))
      .catch((e) => setState({ loading: false, business: null, faqs: [], error: e.message }));
  }, []);
  return <SiteCtx.Provider value={state}>{children}</SiteCtx.Provider>;
}

export const useSite = () => useContext(SiteCtx);

export const isPending = (v) => v == null || v === '' || (typeof v === 'string' && v.startsWith('PENDIENTE'));
export const show = (v, fallback = 'Pendiente de confirmar') => (isPending(v) ? fallback : v);
