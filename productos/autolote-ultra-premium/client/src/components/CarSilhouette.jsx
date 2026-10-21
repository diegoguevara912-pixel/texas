// Silueta ilustrativa para vehículos sin fotografía. Nunca se presenta como foto del vehículo.
export default function CarSilhouette({ color = '#2a2825', label = 'Fotografía pendiente', body = 'Sedán' }) {
  const tall = /SUV|Pick|Van/i.test(body || '');
  const roof = tall ? 'M168 118 C 200 70, 250 58, 330 58 L 430 58 C 470 58, 500 80, 530 118' : 'M180 120 C 220 78, 270 66, 340 66 L 420 66 C 470 66, 505 92, 540 122';
  return (
    <div className="ph" role="img" aria-label={`Ilustración genérica: ${label}`}>
      <svg viewBox="0 0 720 260">
        <defs>
          <linearGradient id={`b${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lighten(color, 0.35)} />
            <stop offset=".55" stopColor={color} />
            <stop offset="1" stopColor={lighten(color, -0.5)} />
          </linearGradient>
          <radialGradient id="floorglow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#000" stopOpacity=".7" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="360" cy="214" rx="300" ry="20" fill="url(#floorglow)" />
        <path
          d={`M70 190 C 66 160, 90 140, 150 130 L 168 126 ${roof.replace(/^M\d+ \d+/, '')} L 600 136 C 640 142, 660 160, 655 190 Z`}
          fill={`url(#b${color.slice(1)})`}
          stroke="rgba(241,236,227,.18)"
        />
        <path d={roof} fill="none" stroke="rgba(241,236,227,.35)" strokeWidth="2" />
        <path d="M110 160 L 610 160" stroke="rgba(241,236,227,.12)" />
        <path d="M600 150 l 40 6" stroke="#f1ece3" strokeWidth="4" strokeLinecap="round" opacity=".8" />
        <path d="M78 156 l 22 -2" stroke="#c0392b" strokeWidth="4" strokeLinecap="round" opacity=".8" />
        {[200, 530].map((x) => (
          <g key={x}>
            <circle cx={x} cy="192" r="36" fill="#0b0b0a" />
            <circle cx={x} cy="192" r="22" fill="none" stroke="#7d7a74" strokeWidth="3" />
            <circle cx={x} cy="192" r="6" fill="#7d7a74" />
          </g>
        ))}
      </svg>
      <span className="ph-label">{label}</span>
    </div>
  );
}

function lighten(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt)))));
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
