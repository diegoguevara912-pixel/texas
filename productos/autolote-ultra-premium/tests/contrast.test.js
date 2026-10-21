import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

// Verifica WCAG 2.2 AA sobre los tokens reales de client/src/styles/tokens.css.
const css = fs.readFileSync(new URL('../client/src/styles/tokens.css', import.meta.url), 'utf8');
const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe('contraste de la paleta Atelier Nocturno', () => {
  const pairs = [
    ['ivory', 'ink-0', 4.5],
    ['ivory-dim', 'ink-1', 4.5],
    ['titanium', 'ink-0', 4.5],
    ['titanium', 'ink-2', 4.5],
    ['champagne', 'ink-0', 4.5],
    ['ink-0', 'champagne', 4.5], // texto del botón primario
    ['err', 'ink-0', 4.5],
    ['ok', 'ink-0', 4.5],
    ['warn', 'ink-0', 4.5],
  ];
  for (const [fg, bg, min] of pairs) {
    it(`${fg} sobre ${bg} ≥ ${min}:1`, () => {
      expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
    });
  }
});
