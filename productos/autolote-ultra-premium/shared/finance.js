// Cálculo de cuota con amortización francesa (cuota fija mensual).
// cuota = P · r / (1 − (1 + r)^−n), con r = tasa anual / 12 / 100.
// Con tasa 0 la cuota es P / n. Resultado orientativo: no incluye seguros,
// comisiones, impuestos ni cargos que una entidad financiera pueda aplicar.
export function simulateLoan({ price, downPayment, annualRate, months }) {
  const p = Number(price);
  const d = Number(downPayment);
  const rate = Number(annualRate);
  const n = Math.round(Number(months));
  if (![p, d, rate, n].every(Number.isFinite)) throw new Error('Valores inválidos');
  if (p <= 0) throw new Error('El precio debe ser mayor que cero');
  if (d < 0 || d >= p) throw new Error('La prima debe ser mayor o igual a cero y menor que el precio');
  if (rate < 0 || rate > 100) throw new Error('La tasa anual debe estar entre 0 y 100');
  if (n < 1 || n > 120) throw new Error('El plazo debe estar entre 1 y 120 meses');

  const principal = p - d;
  const r = rate / 12 / 100;
  const payment = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  const totalPaid = payment * n;
  return {
    principal: round2(principal),
    monthlyPayment: round2(payment),
    totalPaid: round2(totalPaid),
    totalInterest: round2(totalPaid - principal),
    totalWithDownPayment: round2(totalPaid + d),
    downPaymentPercent: round2((d / p) * 100),
  };
}

const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

export function formatMoney(value, currency = { code: 'HNL', locale: 'es-HN' }) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  try {
    return new Intl.NumberFormat(currency.locale || 'es-HN', {
      style: 'currency',
      currency: currency.code || 'HNL',
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${currency.symbol || ''} ${Math.round(Number(value)).toLocaleString('es-HN')}`;
  }
}
