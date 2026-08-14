import React from 'react';

const COLORS = [
  'hsl(215, 100%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(36, 100%, 50%)',
  'hsl(258, 80%, 65%)',
  'hsl(0, 85%, 60%)',
  'hsl(190, 90%, 45%)',
  'hsl(320, 75%, 55%)',
  'hsl(60, 90%, 45%)',
];

// ─── Gráfico de Pizza / Rosca ────────────────────────────────────────────────
export function PieChart({ data, title, donut = false }) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (total === 0) return null;

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = donut ? 75 : 85;
  const innerR = donut ? 42 : 0;

  let cumulativeAngle = -Math.PI / 2;

  const slices = data.map((item, i) => {
    const fraction = item.value / total;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + fraction * 2 * Math.PI;
    cumulativeAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(startAngle);
    const yi1 = cy + innerR * Math.sin(startAngle);
    const xi2 = cx + innerR * Math.cos(endAngle);
    const yi2 = cy + innerR * Math.sin(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;

    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const labelR = r * 0.65 + (donut ? innerR * 0.35 : 0);
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    let d;
    if (donut) {
      d = [
        `M ${xi1} ${yi1}`,
        `L ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${xi2} ${yi2}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1}`,
        'Z',
      ].join(' ');
    } else {
      d = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');
    }

    return { d, color: COLORS[i % COLORS.length], fraction, lx, ly, label: item.label };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      {title && (
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h3>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <svg width={size} height={size} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}>
          {slices.map((s, i) => (
            <g key={i}>
              <path
                d={s.d}
                fill={s.color}
                stroke="var(--panel-bg)"
                strokeWidth={2}
                style={{ transition: 'opacity 0.2s', cursor: 'default' }}
                onMouseEnter={e => (e.target.style.opacity = '0.82')}
                onMouseLeave={e => (e.target.style.opacity = '1')}
              />
              {s.fraction > 0.07 && (
                <text
                  x={s.lx}
                  y={s.ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="11"
                  fontWeight="800"
                  style={{ pointerEvents: 'none' }}
                >
                  {(s.fraction * 100).toFixed(0)}%
                </text>
              )}
            </g>
          ))}
          {donut && (
            <circle cx={cx} cy={cy} r={innerR - 2} fill="var(--panel-bg)" />
          )}
        </svg>

        {/* Legenda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
              <div style={{
                width: 12, height: 12, borderRadius: '3px',
                background: COLORS[i % COLORS.length], flexShrink: 0
              }} />
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.label}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', paddingLeft: '0.5rem', fontWeight: 800 }}>
                {item.formatted}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Gráfico de Barras Verticais ─────────────────────────────────────────────
export function BarChart({ data, title, color = 'var(--primary)', formatValue }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value || 0));
  if (maxValue === 0) return null;

  const height = 180;
  const barWidth = Math.min(48, Math.floor(340 / data.length) - 8);
  const gap = Math.min(16, Math.floor(340 / data.length) - barWidth);
  const totalWidth = data.length * (barWidth + gap) - gap + 40;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {title && (
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h3>
      )}
      <svg width={totalWidth} height={height + 60} style={{ overflow: 'visible', maxWidth: '100%' }}>
        {/* Grade horizontal */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = height - frac * height + 4;
          return (
            <line
              key={i}
              x1={20} y1={y} x2={totalWidth - 4} y2={y}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4"
            />
          );
        })}

        {data.map((item, i) => {
          const barH = Math.max(4, (item.value / maxValue) * height);
          const x = 20 + i * (barWidth + gap);
          const y = height - barH + 4;
          const barColor = Array.isArray(color) ? color[i % color.length] : color;

          return (
            <g key={i}>
              {/* Sombra */}
              <rect x={x + 2} y={y + 3} width={barWidth} height={barH} rx={6} fill="rgba(0,0,0,0.15)" />
              {/* Barra */}
              <rect x={x} y={y} width={barWidth} height={barH} rx={6} fill={barColor}
                style={{ cursor: 'default', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.target.style.opacity = '0.8')}
                onMouseLeave={e => (e.target.style.opacity = '1')}
              />
              {/* Valor acima */}
              <text
                x={x + barWidth / 2} y={y - 6}
                textAnchor="middle" fill="var(--text-muted)"
                fontSize="10" fontWeight="700"
              >
                {formatValue ? formatValue(item.value) : item.value}
              </text>
              {/* Label abaixo */}
              <text
                x={x + barWidth / 2} y={height + 20}
                textAnchor="middle" fill="var(--text-muted)"
                fontSize="10" fontWeight="700"
              >
                {item.label.length > 9 ? item.label.slice(0, 8) + '…' : item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Gráfico de Barras Horizontais ───────────────────────────────────────────
export function HorizontalBarChart({ data, title, formatValue }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value || 0));
  if (maxValue === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {title && (
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {data.map((item, i) => {
          const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const barColor = COLORS[i % COLORS.length];
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {i < 3 && (
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900,
                      background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#b45309', color: 'white'
                    }}>{i + 1}</span>
                  )}
                  {item.label}
                </span>
                <span style={{ fontWeight: 800, color: barColor }}>
                  {formatValue ? formatValue(item.value) : item.value}
                </span>
              </div>
              <div style={{ width: '100%', height: 10, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 99,
                  background: barColor,
                  transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: `0 2px 8px ${barColor}55`
                }} />
              </div>
              {item.sub && (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.sub}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
