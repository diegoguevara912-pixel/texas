import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { formatMoney, simulateLoan } from '@shared/finance.js';
import { useSite } from '../lib/site.jsx';
import { usePrefersReducedMotion } from '../lib/hooks.js';

function Range({ id, label, value, min, max, step, onChange, display }) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <div className="range">
      <div className="range-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{display}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ '--p': `${p}%` }} />
    </div>
  );
}

// Número que se desplaza suavemente hacia el nuevo valor.
function Rolling({ value, format }) {
  const ref = useRef(null);
  const last = useRef(value);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = format(value);
      last.current = value;
      return;
    }
    const s = { v: last.current };
    const t = gsap.to(s, { v: value, duration: 0.6, ease: 'power3.out', onUpdate: () => (el.textContent = format(s.v)) });
    last.current = value;
    return () => t.kill();
  }, [value, format, reduced]);
  return <span ref={ref}>{format(value)}</span>;
}

export default function Simulator({ initialPrice, onChange, compact }) {
  const { business: b } = useSite() || {};
  const f = b?.financing || {};
  const currency = b?.currency || { code: 'HNL', locale: 'es-HN' };
  const terms = f.terms?.length ? f.terms : [12, 24, 36, 48, 60, 72];
  const minPct = Number(f.minDownPaymentPercent ?? 0);
  const [price, setPrice] = useState(initialPrice || 800000);
  const [down, setDown] = useState(Math.round(((initialPrice || 800000) * Math.max(minPct, 20)) / 100 / 1000) * 1000);
  const [months, setMonths] = useState(terms.includes(60) ? 60 : terms[terms.length - 1]);
  const [rate, setRate] = useState(f.annualRate ?? 12);
  const enabled = f.mode && f.mode !== 'disabled' && f.annualRate != null;
  const userRate = f.mode === 'illustrative';

  useEffect(() => { if (initialPrice) setPrice(initialPrice); }, [initialPrice]);
  useEffect(() => { if (f.annualRate != null) setRate(f.annualRate); }, [f.annualRate]);
  useEffect(() => {
    const minDown = (price * minPct) / 100;
    if (down < minDown) setDown(Math.ceil(minDown / 1000) * 1000);
    if (down >= price) setDown(Math.floor((price * 0.9) / 1000) * 1000);
  }, [price]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => {
    try { return simulateLoan({ price, downPayment: down, annualRate: rate, months }); } catch { return null; }
  }, [price, down, rate, months]);

  useEffect(() => { onChange?.({ price, down, months, rate }); }, [price, down, months, rate]); // eslint-disable-line react-hooks/exhaustive-deps

  const money = (v) => formatMoney(v, currency);
  const dialPct = result ? Math.min(1, result.downPaymentPercent / 60) : 0;
  const C = 2 * Math.PI * 46;

  if (!enabled) {
    return (
      <div className="sim">
        <div>
          <h3 className="h3">Simulador en preparación</h3>
          <p className="muted">El cálculo se habilitará cuando el autolote configure una tasa autorizada o un ejemplo ilustrativo desde el panel.</p>
        </div>
      </div>
    );
  }

  const maxPrice = Math.max(5_000_000, Math.ceil((initialPrice || 0) / 1_000_000) * 1_000_000);
  return (
    <div className="sim">
      <div className="sim-controls">
        {userRate && <span className="tag-illustrative">● Tasa de ejemplo ilustrativa · no es de ningún banco</span>}
        <Range id="sim-price" label="Precio del vehículo" value={price} min={100000} max={maxPrice} step={10000} onChange={setPrice} display={money(price)} />
        <Range id="sim-down" label={`Prima${minPct ? ` (mínimo sugerido ${minPct}%)` : ''}`} value={down} min={Math.round((price * minPct) / 100)} max={Math.round(price * 0.9)} step={5000} onChange={setDown} display={`${money(down)} · ${result?.downPaymentPercent ?? 0}%`} />
        <div className="range">
          <div className="range-head"><span style={{ fontSize: '.88rem', color: 'var(--ivory-dim)' }} id="sim-terms">Plazo</span><span className="val">{months} meses</span></div>
          <div className="terms" role="group" aria-labelledby="sim-terms">
            {terms.map((t) => (<button key={t} type="button" className="chip" aria-pressed={months === t} onClick={() => setMonths(t)}>{t}</button>))}
          </div>
        </div>
        {userRate ? (
          <Range id="sim-rate" label="Tasa anual de ejemplo" value={rate} min={0} max={36} step={0.25} onChange={setRate} display={`${rate.toFixed(2)} %`} />
        ) : (
          <div className="range-head"><span className="muted">Tasa anual autorizada por el autolote</span><span className="val">{Number(rate).toFixed(2)} %</span></div>
        )}
      </div>
      <div className="sim-out" aria-live="polite">
        <div className="dial">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--line)" strokeWidth="1.2" strokeDasharray={`${C * 0.75} ${C}`} />
            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--champagne)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray={`${C * 0.75 * dialPct} ${C}`} style={{ transition: 'stroke-dasharray .6s var(--ease)' }} />
          </svg>
          <div className="center">
            <span className="per">Cuota estimada</span>
            <span className="amount">{result ? <Rolling value={result.monthlyPayment} format={money} /> : '—'}</span>
            <span className="per">al mes · {months} meses</span>
          </div>
        </div>
        {result && !compact && (
          <dl className="sim-breakdown">
            <div><dt>Monto a financiar</dt><dd>{money(result.principal)}</dd></div>
            <div><dt>Intereses estimados</dt><dd>{money(result.totalInterest)}</dd></div>
            <div><dt>Total de cuotas</dt><dd>{money(result.totalPaid)}</dd></div>
            <div><dt>Total con prima</dt><dd>{money(result.totalWithDownPayment)}</dd></div>
          </dl>
        )}
        <p className="disclaimer">{f.disclaimer} No incluye seguros, comisiones ni impuestos.</p>
      </div>
    </div>
  );
}
