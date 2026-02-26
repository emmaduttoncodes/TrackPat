import { useState, useEffect, useRef } from 'react';
import { ds, tile, tileLabel } from '../styles';
import { formatDate } from '../helpers';

export function MiniChart({ title, color, data, unit, yMin, yMax, formatY }) {
  const svgRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(null);

  if (!data.length) {
    return (
      <div style={{ ...tile, marginBottom: 12 }}>
        <div style={{ ...tileLabel, color, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: ds.textPlaceholder, textAlign: 'center', padding: '20px 0' }}>No data yet</div>
      </div>
    );
  }

  const lo = yMin != null ? yMin : Math.min(...data.map((d) => d.y));
  const hi = yMax != null ? yMax : Math.max(...data.map((d) => d.y));
  const range = hi - lo || 1;
  const W = 300;
  const H = 120;
  const padL = 32;
  const padR = 8;
  const padT = 8;
  const padB = 24;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const points = data.map((d, i) => ({
    ...d,
    px: padL + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    py: padT + chartH - ((d.y - lo) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px},${p.py}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].px},${padT + chartH} L${points[0].px},${padT + chartH} Z`;

  const yLabels = [lo, lo + range / 2, hi];
  const labelIndices = data.length <= 7
    ? data.map((_, i) => i)
    : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  // Find nearest data point from a client X position
  const getNearestIdx = (clientX) => {
    const svg = svgRef.current;
    if (!svg || !points.length) return null;
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * W;
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].px - svgX);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    }
    return closest;
  };

  const holdTimer = useRef(null);
  const tracking = useRef(false);

  useEffect(() => {
    return () => clearTimeout(holdTimer.current);
  }, []);

  const handlePointerDown = (e) => {
    const x = e.clientX;
    holdTimer.current = setTimeout(() => {
      tracking.current = true;
      setActiveIdx(getNearestIdx(x));
    }, 200);
  };
  const handlePointerMove = (e) => {
    if (tracking.current) setActiveIdx(getNearestIdx(e.clientX));
  };
  const handlePointerUp = () => {
    clearTimeout(holdTimer.current);
    tracking.current = false;
    setActiveIdx(null);
  };

  const ap = activeIdx != null ? points[activeIdx] : null;

  return (
    <div style={{ ...tile, marginBottom: 12 }}>
      <div style={{ ...tileLabel, color, marginBottom: 8 }}>{title}</div>
      <svg
        ref={svgRef}
        viewBox={`0 -4 ${W} ${H + 4}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Y grid lines and labels */}
        {yLabels.map((v, i) => {
          const y = padT + chartH - ((v - lo) / range) * chartH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eeecea" strokeWidth="1" />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill={ds.textLight} fontSize="8" fontFamily="DM Sans, sans-serif">
                {formatY ? formatY(v) : Math.round(v)}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <path d={areaPath} fill={color} opacity="0.08" />
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.px} cy={p.py} r={activeIdx === i ? 5 : 3} fill={activeIdx === i ? color : '#fff'} stroke={color} strokeWidth="2" />
        ))}
        {/* X labels */}
        {labelIndices.map((i) => {
          const p = points[i];
          if (!p) return null;
          const parts = p.label.split('-');
          const lbl = `${parseInt(parts[2])}/${parseInt(parts[1])}`;
          return (
            <text key={i} x={p.px} y={H - 4} textAnchor="middle" fill={ds.textLight} fontSize="8" fontFamily="DM Sans, sans-serif">
              {lbl}
            </text>
          );
        })}
        {/* Active point indicator */}
        {ap && (() => {
          const label = `${formatY ? formatY(ap.y) : ap.y}${unit ? ` ${unit}` : ''} · ${formatDate(ap.label)}`;
          const labelW = Math.max(72, label.length * 5.5 + 16);
          const labelX = Math.min(Math.max(labelW / 2, ap.px), W - labelW / 2);
          return (
            <>
              <line x1={ap.px} y1={padT} x2={ap.px} y2={padT + chartH} stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="3,3" />
              <rect x={labelX - labelW / 2} y={-2} width={labelW} height="18" rx="4" fill={color} />
              <text x={labelX} y={10.5} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600" fontFamily="DM Sans, sans-serif">
                {label}
              </text>
            </>
          );
        })()}
      </svg>
      {/* Latest value */}
      <div style={{ fontSize: 12, color: ds.textLight, marginTop: 4, textAlign: 'right' }}>
        Latest: <span style={{ color: ds.text, fontWeight: 600 }}>{formatY ? formatY(data[data.length - 1].y) : data[data.length - 1].y}{unit ? ` ${unit}` : ''}</span>
      </div>
    </div>
  );
}
