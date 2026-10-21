import { describe, expect, it } from 'vitest';
import { simulateLoan } from '../shared/finance.js';

describe('simulateLoan (amortización francesa)', () => {
  it('coincide con un valor de referencia conocido: 100,000 al 12 % anual en 12 meses = 8,884.88', () => {
    const r = simulateLoan({ price: 120000, downPayment: 20000, annualRate: 12, months: 12 });
    expect(r.principal).toBe(100000);
    expect(r.monthlyPayment).toBe(8884.88);
    expect(r.totalPaid).toBeCloseTo(106618.55, 1);
  });

  it('coincide con otro valor de referencia: 640,000 al 12 % en 60 meses = 14,236.45 (PMT de Excel: 1 %, 60, -640000)', () => {
    const r = simulateLoan({ price: 800000, downPayment: 160000, annualRate: 12, months: 60 });
    expect(r.monthlyPayment).toBe(14236.45);
    expect(r.downPaymentPercent).toBe(20);
  });

  it('la suma de amortizaciones de la tabla reproduce el capital', () => {
    const { monthlyPayment, principal } = simulateLoan({ price: 500000, downPayment: 50000, annualRate: 18.5, months: 48 });
    let balance = principal;
    const r = 18.5 / 12 / 100;
    for (let i = 0; i < 48; i++) balance = balance * (1 + r) - monthlyPayment;
    expect(Math.abs(balance)).toBeLessThan(1); // diferencia solo por redondeo a centavos
  });

  it('con tasa 0 la cuota es capital / plazo y no hay intereses', () => {
    const r = simulateLoan({ price: 360000, downPayment: 0, annualRate: 0, months: 36 });
    expect(r.monthlyPayment).toBe(10000);
    expect(r.totalInterest).toBe(0);
  });

  it('a mayor plazo, menor cuota y más intereses', () => {
    const a = simulateLoan({ price: 900000, downPayment: 180000, annualRate: 14, months: 36 });
    const b = simulateLoan({ price: 900000, downPayment: 180000, annualRate: 14, months: 72 });
    expect(b.monthlyPayment).toBeLessThan(a.monthlyPayment);
    expect(b.totalInterest).toBeGreaterThan(a.totalInterest);
  });

  it('rechaza valores inválidos', () => {
    expect(() => simulateLoan({ price: 100, downPayment: 100, annualRate: 10, months: 12 })).toThrow();
    expect(() => simulateLoan({ price: 100, downPayment: -1, annualRate: 10, months: 12 })).toThrow();
    expect(() => simulateLoan({ price: 0, downPayment: 0, annualRate: 10, months: 12 })).toThrow();
    expect(() => simulateLoan({ price: 100, downPayment: 0, annualRate: -2, months: 12 })).toThrow();
    expect(() => simulateLoan({ price: 100, downPayment: 0, annualRate: 10, months: 0 })).toThrow();
    expect(() => simulateLoan({ price: 'abc', downPayment: 0, annualRate: 10, months: 12 })).toThrow();
  });
});
