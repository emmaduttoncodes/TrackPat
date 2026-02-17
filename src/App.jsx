import { useState, useEffect, useCallback, useRef } from 'react';
import {
  db, emptyDay, loadDay, saveDay, loadAllDays, loadSchedules, saveSchedule,
  deleteSchedule, loadMedEvents, saveMedEvent, deleteMedEvent, exportAllData,
  loadSetting, saveSetting,
} from './db';

// ─── Helpers ───────────────────────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (dateStr) => {
  if (dateStr === todayStr()) return 'Today';
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
};

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const uid = () => Math.random().toString(36).slice(2, 9);

const encouragements = [
  'One day at a time 💖', "You're doing so well 💛", 'Small steps, big courage 🌱',
  'Rest is part of healing 🌙', 'Every day is progress 💫', "You're stronger than you know 💖",
  'Gentle days count too 🍃', 'Your body is working hard for you 💛', 'Be kind to yourself today 🌸',
  'Each morning is a fresh start 🌅', "You've got this, one step at a time 💖",
  "Healing isn't linear, and that's okay 🌿", 'The hard days make the good ones sweeter 💫',
  'Taking it slow is still moving forward 🐚', 'You are so loved 💛',
  'Look how far you\'ve come 🌻', "It's okay to just rest today 🕊️",
  "Tomorrow doesn't need you yet 🌙", 'Your strength inspires us 💖',
  'This chapter is about getting well 🌱',
];

const getEncouragement = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return encouragements[dayOfYear % encouragements.length];
};

// ─── Shared Constants ─────────────────────────────────────────────────
const moods = [
  { value: 1, emoji: '😞' }, { value: 2, emoji: '🙁' }, { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' }, { value: 5, emoji: '😄' },
];

const symptomLabels = {
  fever: 'Fever', abdominalPainIncrease: 'Abdominal pain increase', jaundice: 'Jaundice',
  darkUrine: 'Dark urine', paleStools: 'Pale stools', reducedUrine: 'Reduced urine output',
  swelling: 'Swelling', nausea: 'Nausea', vomiting: 'Vomiting',
};

// ─── Design Tokens ────────────────────────────────────────────────────
const ds = {
  // Colors
  green: '#7a9b7e',       // primary actions, active states, nav
  greenLight: '#e8f0e8',  // green tinted backgrounds
  greenCheck: '#7fb685',  // checkmarks, success indicators
  greenSage: '#8fae8b',   // tile labels (vitals, symptoms ok)
  // Text
  text: '#3d3d3d',
  textMuted: '#7a7a7a',
  textLight: '#999',
  textPlaceholder: '#ccc',
  // Surfaces
  bg: '#f7f6f2',
  card: '#fff',
  cardAlt: '#f5f4f0',
  border: '#e0ddd6',
  divider: '#f0eeea',
  // Radius
  radiusLg: 20,    // tiles, cards, gradient boxes
  radiusMd: 16,    // buttons, action containers
  radiusSm: 12,    // inputs, small buttons
  // Shadows
  cardShadow: '0 1px 4px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)',
  cardBorder: '1px solid rgba(0,0,0,0.03)',
};

// ─── Bottom Sheet ──────────────────────────────────────────────────────
function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-t-2xl px-5 pb-8 pt-3"
        style={{ background: '#faf9f6', maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp .25s ease-out' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: '#d4d0c8' }} />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: ds.text, fontFamily: "'Source Serif 4', Georgia, serif" }}>{title}</h3>
          <button onClick={onClose} className="text-sm px-3 py-1 rounded-full" style={{ background: '#e8e6e1', color: ds.textMuted }}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Input Components ──────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: ds.radiusSm, border: '1px solid ' + ds.border,
  background: ds.card, fontSize: 15, color: ds.text, outline: 'none', fontFamily: "'DM Sans', sans-serif",
};
const labelStyle = { fontSize: 13, fontWeight: 500, color: ds.textMuted, marginBottom: 4, display: 'block', fontFamily: "'DM Sans', sans-serif" };

function Field({ label, children }) {
  return <div className="mb-3"><label style={labelStyle}>{label}</label>{children}</div>;
}

function Input({ label, value, onChange, type = 'text', placeholder = '', min, max }) {
  const [error, setError] = useState('');
  const handleBlur = () => {
    if (min != null && max != null && value !== '') {
      const n = Number(value);
      if (isNaN(n) || n < min || n > max) {
        setError(`Must be between ${min}–${max}`);
        return;
      }
    }
    setError('');
  };
  const handleChange = (v) => {
    if (error) setError('');
    onChange(v);
  };
  return (
    <Field label={label}>
      <input type={type} inputMode={type === 'number' ? 'decimal' : undefined} value={value} onChange={(e) => handleChange(e.target.value)} onBlur={handleBlur} placeholder={placeholder} style={{ ...inputStyle, borderColor: error ? '#d4a574' : ds.border }} />
      {error && <div style={{ fontSize: 12, color: '#c97070', marginTop: 4 }}>{error}</div>}
    </Field>
  );
}

function TextArea({ label, value, onChange, placeholder = '' }) {
  return (
    <Field label={label}>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
    </Field>
  );
}

function ThumbPicker({ value, onChange }) {
  const btn = (v, emoji) => (
    <button
      onClick={() => onChange(value === v ? null : v)}
      className="text-2xl rounded-xl px-4 py-2 transition-all"
      style={{
        background: value === v ? '#e8f5e9' : ds.divider,
        opacity: value === v ? 1 : 0.45,
        border: value === v ? '2px solid #a5c9a8' : '2px solid transparent',
      }}
    >{emoji}</button>
  );
  return <div className="flex gap-3">{btn('up', '👍')}{btn('down', '👎')}</div>;
}

// ─── Dashboard Tiles ───────────────────────────────────────────────────
const tile = {
  background: ds.card, borderRadius: ds.radiusLg, padding: '16px 18px',
  boxShadow: ds.cardShadow,
  cursor: 'pointer', transition: 'transform .1s', border: ds.cardBorder,
  position: 'relative', overflow: 'hidden',
};
const tileLabel = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: "'DM Sans', sans-serif" };
const tileValue = { fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 };

function VitalsTile({ data, onClick }) {
  const stats = [
    { label: 'Temp', value: data.temperatureC ? `${data.temperatureC}°` : '—', unit: 'C', color: '#c97070' },
    { label: 'BP', value: data.systolic && data.diastolic ? `${data.systolic}/${data.diastolic}` : '—', unit: '', color: '#8b9cc7' },
    { label: 'Heart', value: data.heartRate || '—', unit: data.heartRate ? 'bpm' : '', color: '#c97070' },
    { label: 'Weight', value: data.weightKg || '—', unit: data.weightKg ? 'kg' : '', color: '#7ab8a8' },
  ];
  return (
    <div style={tile} onClick={onClick} className="active:scale-[0.98]">
      <div style={{ ...tileLabel, color: ds.greenSage, marginBottom: 12 }}>Vitals</div>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div style={{ ...tileValue, fontSize: s.value.length > 5 ? 16 : 22, color: s.value === '—' ? '#d4d0c8' : ds.text, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.value === '—' ? ds.textPlaceholder : s.color, marginTop: 2, fontWeight: 500 }}>{s.unit && s.value !== '—' ? s.unit : s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoodTile({ data, onClick }) {
  const found = moods.find((m) => m.value === data.value);
  return (
    <div style={{ ...tile, display: 'flex', flexDirection: 'column', minHeight: 120 }} onClick={onClick} className="active:scale-[0.98]">
      <div style={{ ...tileLabel, color: '#b8a0c9' }}>Mood</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {found ? (
          <div style={{ fontSize: 42, lineHeight: 1 }}>{found.emoji}</div>
        ) : (
          <div style={{ fontSize: 32, opacity: 0.2, lineHeight: 1 }}>💭</div>
        )}
      </div>
      {data.note && <div style={{ fontSize: 11, color: ds.textLight, marginTop: 6, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.note}</div>}
    </div>
  );
}

function SleepTile({ data, onClick }) {
  const hrs = Number(data.hours) || 0;
  const pct = Math.min(hrs / 10, 1);
  return (
    <div style={{ ...tile, minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={onClick} className="active:scale-[0.98]">
      <div style={{ ...tileLabel, color: '#8b9cc7' }}>Sleep</div>
      <div className="flex items-end gap-2 mt-2">
        <div style={{ ...tileValue, fontSize: hrs ? 36 : 28, color: hrs ? ds.text : '#d4d0c8', lineHeight: 1 }}>{hrs ? hrs : '—'}</div>
        {hrs > 0 && <div style={{ fontSize: 14, color: '#8b9cc7', paddingBottom: 2 }}>hrs</div>}
      </div>
      <div className="mt-2 rounded-full overflow-hidden" style={{ height: 6, background: '#eeecea' }}>
        <div className="rounded-full" style={{ height: '100%', width: `${pct * 100}%`, background: 'linear-gradient(90deg, #8b9cc7, #a8b8d8)', transition: 'width .3s' }} />
      </div>
      {data.qualityThumb && <div style={{ fontSize: 11, color: ds.textLight, marginTop: 4 }}>{data.qualityThumb === 'up' ? '👍 Good' : '👎 Poor'}</div>}
    </div>
  );
}

function PainTile({ data, onClick }) {
  const last = data.length ? data[data.length - 1] : null;
  const level = last ? Number(last.level) || 0 : 0;
  return (
    <div style={{ ...tile, minHeight: 90 }} onClick={onClick} className="active:scale-[0.98]">
      <div className="flex items-start justify-between">
        <div>
          <div style={{ ...tileLabel, color: '#d4a574' }}>Pain</div>
          {last ? (
            <>
              <div className="flex items-end gap-1 mt-1">
                <span style={{ ...tileValue, fontSize: 28, color: ds.text, lineHeight: 1 }}>{last.level}</span>
                <span style={{ fontSize: 12, color: ds.textLight, paddingBottom: 2 }}>/10</span>
              </div>
              {data.length > 1 && <div style={{ fontSize: 11, color: ds.textLight, marginTop: 2, whiteSpace: 'nowrap' }}>{data.length} entries today</div>}
            </>
          ) : (
            <div style={{ fontSize: 13, color: ds.textPlaceholder, marginTop: 6 }}>None</div>
          )}
        </div>
        {last && (
          <div className="flex gap-0.5 items-end" style={{ height: 32, paddingTop: 8 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-sm" style={{ width: 3, height: `${(i + 1) * 10}%`, background: i < level ? (level >= 7 ? '#d4a574' : '#c9c0a0') : '#eeecea' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityTile({ data, onClick }) {
  const total = data.walkMinutes.reduce((s, w) => s + (Number(w.minutes) || 0), 0);
  return (
    <div style={{ ...tile, minHeight: 90 }} onClick={onClick} className="active:scale-[0.98]">
      <div style={{ ...tileLabel, color: '#7ab8a8' }}>Activity</div>
      {total > 0 ? (
        <>
          <div className="flex items-end gap-1 mt-1">
            <span style={{ ...tileValue, fontSize: 28, color: ds.text, lineHeight: 1 }}>{total}</span>
            <span style={{ fontSize: 12, color: ds.textLight, paddingBottom: 2 }}>min</span>
          </div>
          {data.energyThumb && <div style={{ fontSize: 11, color: ds.textLight, marginTop: 2 }}>{data.energyThumb === 'up' ? '👍 Good energy' : '👎 Low energy'}</div>}
        </>
      ) : (
        <div className="flex items-center gap-2 mt-3">
          <span style={{ fontSize: 20, opacity: 0.2 }}>🚶</span>
          <span style={{ fontSize: 13, color: ds.textPlaceholder }}>No walks</span>
        </div>
      )}
    </div>
  );
}

function SmallTile({ label, icon, value, sub, color, onClick, empty }) {
  return (
    <div style={{ ...tile, minHeight: 72, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={onClick} className="active:scale-[0.98]">
      <div style={{ ...tileLabel, color }}>{label}</div>
      {empty ? (
        <div style={{ fontSize: 20, opacity: 0.2, marginTop: 4 }}>{icon}</div>
      ) : (
        <div className="flex items-center gap-2 mt-1" style={{ minWidth: 0 }}>
          {value && <span style={{ fontSize: 20, flexShrink: 0 }}>{value}</span>}
          {!value && sub && <span style={{ fontSize: 12, color: ds.textLight, flexShrink: 0 }}>📝</span>}
          {sub && <span style={{ fontSize: 12, color: ds.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

function SymptomsTile({ data, onClick }) {
  const active = Object.entries(symptomLabels).filter(([k]) => data[k]).map(([, l]) => l);
  const hasNote = data.note && data.note.trim().length > 0;
  const hasAny = active.length > 0 || hasNote;
  const details = active.slice(0, 3).join(' · ');
  const overflow = active.length > 3 ? ` +${active.length - 3}` : '';
  const summaryText = details ? `${details}${overflow}` : hasNote ? 'Note recorded' : '';
  return (
    <div
      style={{ ...tile, background: hasAny ? '#fdf6ee' : ds.card, borderColor: hasAny ? 'rgba(212,165,116,0.2)' : 'rgba(0,0,0,0.03)', padding: '12px 16px' }}
      onClick={onClick}
      className="active:scale-[0.98]"
    >
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 14 }}>{hasAny ? '⚠️' : '✅'}</span>
        <span style={{ ...tileLabel, color: hasAny ? '#c9914a' : ds.greenSage, margin: 0 }}>{hasAny ? 'Symptoms' : 'No symptoms'}</span>
        {hasAny && <span style={{ fontSize: 12, color: '#c9914a', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{summaryText}</span>}
        {!hasAny && <span style={{ color: ds.textPlaceholder, fontSize: 16, marginLeft: 'auto' }}>›</span>}
      </div>
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────
function BottomNav({ page, setPage }) {
  const items = [
    {
      id: 'overview', label: 'Overview',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: 'trends', label: 'Trends',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: 'profile', label: 'Profile',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: ds.greenLight, borderTop: '1px solid rgba(0,0,0,0.04)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ display: 'flex', height: 56 }}>
        {items.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                color: active ? ds.green : '#b5b5b5', fontFamily: "'DM Sans', sans-serif",
                fontSize: 11, fontWeight: active ? 600 : 500,
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 20, height: 3, borderRadius: 2, background: ds.green,
                }} />
              )}
              <div style={{ marginTop: 2 }}>{item.icon}</div>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Placeholder Pages ────────────────────────────────────────────────
function MiniChart({ title, color, data, unit, yMin, yMax, formatY }) {
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

  return (
    <div style={{ ...tile, marginBottom: 12 }}>
      <div style={{ ...tileLabel, color, marginBottom: 8 }}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
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
          <circle key={i} cx={p.px} cy={p.py} r="3" fill="#fff" stroke={color} strokeWidth="2" />
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
      </svg>
      {/* Latest value */}
      <div style={{ fontSize: 12, color: ds.textLight, marginTop: 4, textAlign: 'right' }}>
        Latest: <span style={{ color: ds.text, fontWeight: 600 }}>{formatY ? formatY(data[data.length - 1].y) : data[data.length - 1].y}{unit ? ` ${unit}` : ''}</span>
      </div>
    </div>
  );
}

const moodEmojis = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };

function buildReportSvgChart(data, color, title, yMin, yMax, formatY) {
  if (!data.length) {
    return `<div class="chart-wrap"><div class="chart-title" style="color:${color}">${title}</div><div style="text-align:center;padding:20px 0;color:#999;font-size:13px">No data</div></div>`;
  }
  const lo = yMin != null ? yMin : Math.min(...data.map(d => d.y));
  const hi = yMax != null ? yMax : Math.max(...data.map(d => d.y));
  const range = hi - lo || 1;
  const W = 480, H = 140, padL = 36, padR = 10, padT = 10, padB = 28;
  const chartW = W - padL - padR, chartH = H - padT - padB;

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

  let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">`;
  yLabels.forEach(v => {
    const y = padT + chartH - ((v - lo) / range) * chartH;
    svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e0ddd6" stroke-width="1"/>`;
    svg += `<text x="${padL - 4}" y="${y + 3}" text-anchor="end" fill="#999" font-size="9" font-family="sans-serif">${formatY ? formatY(v) : Math.round(v)}</text>`;
  });
  svg += `<path d="${areaPath}" fill="${color}" opacity="0.1"/>`;
  svg += `<path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  points.forEach(p => {
    svg += `<circle cx="${p.px}" cy="${p.py}" r="3" fill="#fff" stroke="${color}" stroke-width="2"/>`;
  });
  labelIndices.forEach(i => {
    const p = points[i];
    if (!p) return;
    const parts = p.label.split('-');
    const lbl = `${parseInt(parts[2])}/${parseInt(parts[1])}`;
    svg += `<text x="${p.px}" y="${H - 4}" text-anchor="middle" fill="#999" font-size="9" font-family="sans-serif">${lbl}</text>`;
  });
  svg += '</svg>';

  const latest = data[data.length - 1];
  const latestVal = formatY ? formatY(latest.y) : latest.y;

  return `<div class="chart-wrap"><div class="chart-title" style="color:${color}">${title}</div>${svg}<div style="font-size:11px;color:#999;text-align:right;margin-top:4px">Latest: <strong style="color:#3d3d3d">${latestVal}</strong></div></div>`;
}

function buildClinicianReport({ patientName, transplantDate, startDate, endDate, days, painData, activityData, weightData, moodData }) {
  const fmtDate = (s) => { const d = new Date(s + 'T12:00:00'); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const daysSinceTx = transplantDate ? Math.floor((new Date() - new Date(transplantDate + 'T12:00:00')) / 86400000) : null;

  // Summary stats
  const painValues = painData.map(d => d.y);
  const avgPain = painValues.length ? (painValues.reduce((a, b) => a + b, 0) / painValues.length).toFixed(1) : '—';
  const maxPain = painValues.length ? Math.max(...painValues) : '—';

  const actValues = activityData.map(d => d.y);
  const totalActivity = actValues.reduce((a, b) => a + b, 0);
  const numDays = Object.keys(days).length || 1;
  const avgActivity = actValues.length ? Math.round(totalActivity / numDays) : '—';

  const weightValues = weightData.map(d => d.y);
  const wMin = weightValues.length ? Math.min(...weightValues).toFixed(1) : '—';
  const wMax = weightValues.length ? Math.max(...weightValues).toFixed(1) : '—';
  const weightRange = weightValues.length ? (wMin === wMax ? `${wMin} kg` : `${wMin}–${wMax} kg`) : '—';

  const moodCount = moodData.length;

  // Mood distribution
  const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  moodData.forEach(d => { moodCounts[d.y] = (moodCounts[d.y] || 0) + 1; });
  const moodLabels = { 1: 'Very low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Great' };
  const moodColors = { 1: '#c97070', 2: '#d4a574', 3: '#c9c0a0', 4: '#8fae8b', 5: '#7a9b7e' };
  let moodBarsHtml = '';
  if (moodCount > 0) {
    [5, 4, 3, 2, 1].forEach(v => {
      const pct = Math.round((moodCounts[v] / moodCount) * 100);
      moodBarsHtml += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="width:60px;font-size:11px;text-align:right;color:#7a7a7a">${moodLabels[v]}</span>
        <div style="flex:1;height:16px;background:#f0eeea;border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${moodColors[v]};border-radius:4px;min-width:${pct > 0 ? '2px' : '0'}"></div>
        </div>
        <span style="width:32px;font-size:11px;color:#7a7a7a">${pct}%</span>
      </div>`;
    });
  } else {
    moodBarsHtml = '<div style="text-align:center;padding:12px;color:#999;font-size:13px">No mood entries</div>';
  }

  // Charts
  const painChart = buildReportSvgChart(painData, '#d4a574', 'Pain (0–10)', 0, 10);
  const activityChart = buildReportSvgChart(activityData, '#7ab8a8', 'Activity (min)');
  const weightChart = buildReportSvgChart(weightData, '#8b9cc7', 'Weight (kg)');
  const moodChart = buildReportSvgChart(moodData, '#b8a0c9', 'Mood (1–5)', 1, 5);

  // Daily log table
  const sorted = Object.entries(days).sort(([a], [b]) => a.localeCompare(b));
  let tableRows = '';
  sorted.forEach(([date, d]) => {
    const painEntries = (d.pain || []).filter(e => Number(e.level) > 0);
    const painStr = painEntries.length ? painEntries.map(e => e.level).join(', ') : '—';
    const actMins = d.activity && d.activity.walkMinutes ? d.activity.walkMinutes.reduce((s, w) => s + (Number(w.minutes) || 0), 0) : 0;
    const actStr = actMins > 0 ? `${actMins} min` : '—';
    const wt = d.vitals && d.vitals.weightKg && Number(d.vitals.weightKg) > 0 ? `${d.vitals.weightKg} kg` : '—';
    const mood = d.mood && d.mood.value != null ? moodEmojis[d.mood.value] || d.mood.value : '—';
    const symptoms = d.symptoms ? Object.entries(symptomLabels).filter(([k]) => d.symptoms[k]).map(([, l]) => l) : [];
    const sympStr = symptoms.length > 0 ? symptoms.join(', ') : '—';
    const sympStyle = symptoms.length > 0 ? 'color:#c9914a;font-weight:500' : '';
    tableRows += `<tr>
      <td>${fmtDate(date)}</td><td>${painStr}</td><td>${actStr}</td><td>${wt}</td><td>${mood}</td>
      <td style="${sympStyle}">${sympStr}</td>
    </tr>`;
  });

  if (!sorted.length) {
    tableRows = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px">No data for this period</td></tr>';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Recovery report – ${patientName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#3d3d3d;background:#fff;font-size:13px;line-height:1.5}
.accent-bar{height:6px;background:#7a9b7e}
.container{max-width:760px;margin:0 auto;padding:24px 32px}
h1{font-size:20px;font-weight:700;margin-bottom:2px}
.subtitle{font-size:13px;color:#7a7a7a;margin-bottom:4px}
.meta{display:flex;gap:20px;flex-wrap:wrap;font-size:12px;color:#7a7a7a;margin-top:12px;padding-top:12px;border-top:1px solid #e0ddd6}
.meta span{white-space:nowrap}
.section-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#999;margin:24px 0 10px}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.stat-box{border:1px solid #e0ddd6;border-radius:10px;padding:14px 12px;text-align:center}
.stat-num{font-size:26px;font-weight:700;line-height:1}
.stat-label{font-size:11px;color:#7a7a7a;margin-top:4px}
.stat-sub{font-size:11px;color:#999;margin-top:2px}
.mood-dist{border:1px solid #e0ddd6;border-radius:10px;padding:16px}
.charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.chart-wrap{border:1px solid #e0ddd6;border-radius:10px;padding:14px}
.chart-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px}
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{text-transform:uppercase;font-size:10px;font-weight:600;letter-spacing:0.5px;color:#999;text-align:left;padding:8px 6px;border-bottom:2px solid #e0ddd6}
tbody td{padding:7px 6px;border-bottom:1px solid #f0eeea}
tbody tr:last-child td{border-bottom:none}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e0ddd6;font-size:11px;color:#999;text-align:center}
@media print{
  @page{size:A4 portrait;margin:15mm 12mm}
  body{print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .container{padding:0}
  .charts-grid,.stats-grid,.mood-dist,table{break-inside:avoid}
}
</style>
</head>
<body>
<div class="accent-bar"></div>
<div class="container">
  <h1>Recovery progress report</h1>
  <div class="subtitle">${patientName}</div>
  <div class="meta">
    ${transplantDate ? `<span>Transplant: ${fmtDate(transplantDate)}</span>` : ''}
    ${daysSinceTx != null && daysSinceTx >= 0 ? `<span>Day ${daysSinceTx} post-transplant</span>` : ''}
    <span>Period: ${fmtDate(startDate)} – ${fmtDate(endDate)}</span>
    <span>Generated: ${fmtDate(todayStr())}</span>
  </div>

  <div class="section-title">Summary</div>
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-num">${avgPain}</div>
      <div class="stat-label">Avg pain</div>
      <div class="stat-sub">${maxPain !== '—' ? `Max: ${maxPain}/10` : ''}</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${totalActivity || '—'}</div>
      <div class="stat-label">Total activity (min)</div>
      <div class="stat-sub">${avgActivity !== '—' ? `Avg: ${avgActivity}/day` : ''}</div>
    </div>
    <div class="stat-box">
      <div class="stat-num" style="font-size:${weightRange.length > 10 ? '18' : '26'}px">${weightRange}</div>
      <div class="stat-label">Weight range</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${moodCount}</div>
      <div class="stat-label">Mood entries</div>
    </div>
  </div>

  <div class="section-title">Mood Distribution</div>
  <div class="mood-dist">${moodBarsHtml}</div>

  <div class="section-title">Trends</div>
  <div class="charts-grid">
    ${painChart}${activityChart}${weightChart}${moodChart}
  </div>

  <div class="section-title">Daily Log</div>
  <table>
    <thead><tr><th>Date</th><th>Pain</th><th>Activity</th><th>Weight</th><th>Mood</th><th>Symptoms</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">
    This report was generated from patient-reported data collected via TrackPat. It is intended to support clinical discussion and should not replace clinical assessment.
  </div>
</div>
</body>
</html>`;
}

function TrendsPage() {
  const [allDays, setAllDays] = useState(null);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [patientInfo, setPatientInfo] = useState({ name: 'Patient', transplantDate: '' });

  useEffect(() => {
    Promise.all([
      loadAllDays(),
      loadSetting('userName'),
      loadSetting('transplantDate'),
    ]).then(([days, storedName, txDate]) => {
      setAllDays(days);
      setPatientInfo({ name: storedName || 'Patient', transplantDate: txDate || '' });
    });
  }, []);

  const handleExport = (period) => {
    setShowExportSheet(false);
    const today = todayStr();
    const numDays = period === '1w' ? 7 : period === '1m' ? 30 : 90;
    const startDate = addDays(today, -(numDays - 1));
    const endDate = today;

    // Filter days to the selected period
    const filteredDays = {};
    Object.entries(allDays || {}).forEach(([date, d]) => {
      if (date >= startDate && date <= endDate) filteredDays[date] = d;
    });

    const sorted = Object.entries(filteredDays).sort(([a], [b]) => a.localeCompare(b));

    const painData = sorted.flatMap(([date, d]) =>
      (d.pain || []).filter(e => Number(e.level) > 0).map(e => ({ label: date, y: Number(e.level) }))
    );
    const activityData = sorted
      .filter(([, d]) => d.activity && d.activity.walkMinutes && d.activity.walkMinutes.length > 0)
      .map(([date, d]) => ({ label: date, y: d.activity.walkMinutes.reduce((s, w) => s + (Number(w.minutes) || 0), 0) }))
      .filter(d => d.y > 0);
    const weightData = sorted
      .filter(([, d]) => d.vitals && d.vitals.weightKg && Number(d.vitals.weightKg) > 0)
      .map(([date, d]) => ({ label: date, y: Number(d.vitals.weightKg) }));
    const moodData = sorted
      .filter(([, d]) => d.mood && d.mood.value != null)
      .map(([date, d]) => ({ label: date, y: d.mood.value }));

    const html = buildClinicianReport({
      patientName: patientInfo.name,
      transplantDate: patientInfo.transplantDate,
      startDate,
      endDate,
      days: filteredDays,
      painData,
      activityData,
      weightData,
      moodData,
    });

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 400);
    } else {
      alert('Pop-up blocked. Please allow pop-ups for this site to export the report.');
    }
  };

  if (!allDays) {
    return (
      <div style={{ paddingTop: 'env(safe-area-inset-top)', background: ds.bg, minHeight: '100vh' }}>
        <div style={{ padding: '24px 20px' }}>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 600, color: ds.text }}>Trends</h2>
          <div style={{ color: ds.greenSage, textAlign: 'center', padding: 40 }}>Loading...</div>
        </div>
      </div>
    );
  }

  const sorted = Object.entries(allDays).sort(([a], [b]) => a.localeCompare(b));

  const painData = sorted
    .flatMap(([date, d]) =>
      (d.pain || [])
        .filter((e) => Number(e.level) > 0)
        .map((e) => ({ label: date, y: Number(e.level) }))
    );

  const activityData = sorted
    .filter(([, d]) => d.activity && d.activity.walkMinutes && d.activity.walkMinutes.length > 0)
    .map(([date, d]) => ({
      label: date,
      y: d.activity.walkMinutes.reduce((s, w) => s + (Number(w.minutes) || 0), 0),
    }))
    .filter((d) => d.y > 0);

  const weightData = sorted
    .filter(([, d]) => d.vitals && d.vitals.weightKg && Number(d.vitals.weightKg) > 0)
    .map(([date, d]) => ({ label: date, y: Number(d.vitals.weightKg) }));

  const moodData = sorted
    .filter(([, d]) => d.mood && d.mood.value != null)
    .map(([date, d]) => ({ label: date, y: d.mood.value }));

  const hasAny = painData.length || activityData.length || weightData.length || moodData.length;

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)', background: ds.bg, minHeight: '100vh' }}>
      <div style={{ padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 600, color: ds.text, margin: 0 }}>Trends</h2>
          {hasAny ? (
            <button
              onClick={() => setShowExportSheet(true)}
              style={{
                background: ds.green, color: '#fff', border: 'none', borderRadius: ds.radiusSm,
                padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >Export for clinician</button>
          ) : null}
        </div>

        {!hasAny && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b5b5b5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p style={{ fontSize: 14, color: ds.textLight, maxWidth: 260, margin: '0 auto', lineHeight: 1.5 }}>Start logging data on the Overview tab and your trends will appear here.</p>
          </div>
        )}

        <MiniChart title="Pain" color="#d4a574" data={painData} unit="/10" yMin={0} yMax={10} />
        <MiniChart title="Activity" color="#7ab8a8" data={activityData} unit="min" yMin={0} />
        <MiniChart title="Weight" color="#8b9cc7" data={weightData} unit="kg" />
        <MiniChart title="Mood" color="#b8a0c9" data={moodData} yMin={1} yMax={5}
          formatY={(v) => moodEmojis[Math.round(v)] || Math.round(v)} />
      </div>

      <BottomSheet open={showExportSheet} onClose={() => setShowExportSheet(false)} title="Export for clinician">
        <p style={{ fontSize: 13, color: ds.textMuted, marginBottom: 16 }}>Choose a time period for the report. A printable document will open in a new tab.</p>
        {[
          { key: '1w', label: '1 week', sub: 'Last 7 days' },
          { key: '1m', label: '1 month', sub: 'Last 30 days' },
          { key: '3m', label: '3 months', sub: 'Last 90 days' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleExport(opt.key)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '14px 16px', marginBottom: 8, borderRadius: ds.radiusSm,
              background: ds.card, border: '1px solid ' + ds.border, cursor: 'pointer',
              textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: ds.text }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: ds.textMuted }}>{opt.sub}</div>
            </div>
            <span style={{ color: ds.textPlaceholder, fontSize: 18 }}>›</span>
          </button>
        ))}
      </BottomSheet>
    </div>
  );
}

function ProfilePage({ onExport }) {
  const [transplantDate, setTransplantDate] = useState('');
  const [name, setName] = useState('Friend');
  const [editingName, setEditingName] = useState(false);
  const [allDays, setAllDays] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadSetting('transplantDate'),
      loadSetting('userName'),
      loadAllDays(),
    ]).then(([txDate, storedName, days]) => {
      if (txDate) setTransplantDate(txDate);
      if (storedName) setName(storedName);
      setAllDays(days);
      setLoaded(true);
    });
  }, []);

  const handleDateChange = (value) => {
    setTransplantDate(value);
    saveSetting('transplantDate', value);
  };

  const handleNameSave = () => {
    const trimmed = name.trim() || 'Friend';
    setName(trimmed);
    saveSetting('userName', trimmed);
    setEditingName(false);
  };

  const daysSince = () => {
    if (!transplantDate) return null;
    const tx = new Date(transplantDate + 'T12:00:00');
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return Math.floor((now - tx) / 86400000);
  };

  // Check if a day has any meaningful data
  const isDayLogged = (d) => {
    if (!d) return false;
    if (d.vitals && (d.vitals.temperatureC || d.vitals.systolic || d.vitals.diastolic || d.vitals.heartRate || d.vitals.weightKg)) return true;
    if (d.pain && d.pain.some((e) => e.level)) return true;
    if (d.activity && (d.activity.walkMinutes.some((w) => w.minutes) || d.activity.energyThumb || d.activity.note)) return true;
    if (d.sleep && (d.sleep.hours || d.sleep.qualityThumb || d.sleep.note)) return true;
    if (d.appetite && (d.appetite.thumb || d.appetite.note)) return true;
    if (d.mood && (d.mood.value != null || d.mood.note)) return true;
    if (d.bowel && (d.bowel.hadBm || d.bowel.note)) return true;
    if (d.symptoms) {
      const { note, ...flags } = d.symptoms;
      if (note || Object.values(flags).some(Boolean)) return true;
    }
    return false;
  };

  // Compute quick stats
  const computeStats = () => {
    if (!allDays) return { daysLogged: 0, streak: 0, last7: 0 };
    const loggedDates = new Set(Object.entries(allDays).filter(([, d]) => isDayLogged(d)).map(([date]) => date));
    const daysLogged = loggedDates.size;

    // Current streak (consecutive days ending today or yesterday)
    const today = todayStr();
    let streak = 0;
    let checkDate = today;
    while (loggedDates.has(checkDate)) {
      streak++;
      checkDate = addDays(checkDate, -1);
    }
    // If no entry today, check streak ending yesterday
    if (streak === 0) {
      checkDate = addDays(today, -1);
      while (loggedDates.has(checkDate)) {
        streak++;
        checkDate = addDays(checkDate, -1);
      }
    }

    // Days logged in last 7 completed days (not including today)
    let last7 = 0;
    for (let i = 1; i <= 7; i++) {
      if (loggedDates.has(addDays(today, -i))) last7++;
    }

    return { daysLogged, streak, last7 };
  };

  const days = daysSince();
  const stats = computeStats();

  if (!loaded) return null;

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)', background: ds.bg, minHeight: '100vh' }}>
      <div style={{ padding: '24px 20px' }}>
        {/* Greeting header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
            background: ds.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={ds.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          {editingName ? (
            <div className="flex items-center justify-center gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                style={{
                  fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 600,
                  color: ds.text, textAlign: 'center', border: 'none', borderBottom: '2px solid ' + ds.green,
                  background: 'transparent', outline: 'none', width: 180, padding: '2px 0',
                }}
              />
            </div>
          ) : (
            <h2
              onClick={() => setEditingName(true)}
              style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 600, color: ds.text, margin: 0, cursor: 'pointer' }}
            >
              Hi, {name} <span style={{ fontSize: 14, color: '#b5b5b5', display: 'inline-block', transform: 'scaleX(-1)' }}>✎</span>
            </h2>
          )}
        </div>

        {/* Days since transplant display */}
        {days != null && days >= 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #8fae8b 0%, #a3c4a0 40%, #90c5b0 100%)',
            borderRadius: 20, padding: '24px 20px', marginBottom: 16, textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{days}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 6, fontWeight: 500 }}>
              {days === 1 ? 'day' : 'days'} since transplant 🎉
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 16 }}>
          <div style={{
            background: ds.card, borderRadius: ds.radiusLg, padding: '14px 10px', textAlign: 'center',
            boxShadow: ds.cardShadow, border: ds.cardBorder,
          }}>
            <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28, fontWeight: 700, color: ds.text, lineHeight: 1 }}>{stats.streak}</div>
            <div style={{ fontSize: 11, color: ds.greenSage, fontWeight: 600, marginTop: 4 }}>day streak</div>
          </div>
          <div style={{
            background: ds.card, borderRadius: ds.radiusLg, padding: '14px 10px', textAlign: 'center',
            boxShadow: ds.cardShadow, border: ds.cardBorder,
          }}>
            <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28, fontWeight: 700, color: ds.text, lineHeight: 1 }}>{stats.daysLogged}</div>
            <div style={{ fontSize: 11, color: '#8b9cc7', fontWeight: 600, marginTop: 4 }}>days logged</div>
          </div>
          <div style={{
            background: ds.card, borderRadius: ds.radiusLg, padding: '14px 10px', textAlign: 'center',
            boxShadow: ds.cardShadow, border: ds.cardBorder,
          }}>
            <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28, fontWeight: 700, color: ds.text, lineHeight: 1 }}>{stats.last7}<span style={{ fontSize: 16, color: ds.textLight, fontWeight: 400 }}>/7</span></div>
            <div style={{ fontSize: 11, color: '#b8a0c9', fontWeight: 600, marginTop: 4 }}>this week</div>
          </div>
        </div>

        {/* Settings section */}
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: '#a5a5a5', marginBottom: 8, paddingLeft: 4, fontFamily: "'DM Sans', sans-serif" }}>
          Settings
        </div>
        <div style={{
          background: ds.card, borderRadius: ds.radiusLg, marginBottom: 16, overflow: 'hidden',
          boxShadow: ds.cardShadow, border: ds.cardBorder,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${ds.divider}` }}>
            <label style={{ ...labelStyle, marginBottom: 6 }}>
              Transplant date
            </label>
            <input
              type="date"
              value={transplantDate}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{
                ...inputStyle,
              }}
            />
          </div>
          <button onClick={onExport} className="w-full text-left" style={{ padding: '16px', fontSize: 15, color: ds.text, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Download backup
            <span style={{ float: 'right', color: ds.textPlaceholder }}>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Overview Sheets ───────────────────────────────────────────────────
function VitalsSheet({ data, onChange }) {
  const up = (k, v) => onChange({ ...data, [k]: v });
  return (
    <>
      <Input label="Temperature (°C)" value={data.temperatureC} onChange={(v) => up('temperatureC', v)} type="number" placeholder="36.5" min={30} max={45} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Systolic BP" value={data.systolic} onChange={(v) => up('systolic', v)} type="number" placeholder="120" min={50} max={250} />
        <Input label="Diastolic BP" value={data.diastolic} onChange={(v) => up('diastolic', v)} type="number" placeholder="80" min={30} max={180} />
      </div>
      <Input label="Heart rate (bpm)" value={data.heartRate} onChange={(v) => up('heartRate', v)} type="number" placeholder="72" min={20} max={250} />
      <Input label="Weight (kg)" value={data.weightKg} onChange={(v) => up('weightKg', v)} type="number" placeholder="65" min={20} max={300} />
    </>
  );
}

function PainSheet({ data, onChange }) {
  const addEntry = () => onChange([...data, { id: uid(), time: nowTime(), level: '', location: '', note: '' }]);
  const update = (i, k, v) => {
    const n = [...data];
    n[i] = { ...n[i], [k]: v };
    onChange(n);
  };
  const remove = (i) => onChange(data.filter((_, j) => j !== i));
  return (
    <>
      {data.map((e, i) => (
        <div key={e.id} className="mb-4 p-3 rounded-2xl" style={{ background: ds.cardAlt }}>
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontSize: 12, color: ds.textLight }}>{e.time}</span>
            <button onClick={() => remove(i)} style={{ fontSize: 12, color: '#c97070' }}>Remove</button>
          </div>
          <Input label="Pain level (1–10)" value={e.level} onChange={(v) => update(i, 'level', v)} type="number" placeholder="5" min={1} max={10} />
          <Input label="Location" value={e.location} onChange={(v) => update(i, 'location', v)} placeholder="e.g. abdomen" />
          <TextArea label="Note" value={e.note} onChange={(v) => update(i, 'note', v)} />
        </div>
      ))}
      <button onClick={addEntry} className="w-full py-3 rounded-2xl text-sm font-medium" style={{ background: ds.greenLight, color: ds.green }}>+ Add pain entry</button>
    </>
  );
}

function ActivitySheet({ data, onChange }) {
  const up = (k, v) => onChange({ ...data, [k]: v });
  const addWalk = () => up('walkMinutes', [...data.walkMinutes, { id: uid(), time: nowTime(), minutes: '' }]);
  const updateWalk = (i, k, v) => { const n = [...data.walkMinutes]; n[i] = { ...n[i], [k]: v }; up('walkMinutes', n); };
  const removeWalk = (i) => up('walkMinutes', data.walkMinutes.filter((_, j) => j !== i));
  return (
    <>
      <label style={labelStyle}>Walks</label>
      {data.walkMinutes.map((w, i) => (
        <div key={w.id} className="flex gap-2 items-center mb-2">
          <input type="number" inputMode="decimal" value={w.minutes} onChange={(e) => updateWalk(i, 'minutes', e.target.value)} placeholder="mins" style={{ ...inputStyle, width: 80 }} />
          <input type="time" value={w.time} onChange={(e) => updateWalk(i, 'time', e.target.value)} style={{ ...inputStyle, width: 110 }} />
          <button onClick={() => removeWalk(i)} style={{ fontSize: 12, color: '#c97070' }}>×</button>
        </div>
      ))}
      <button onClick={addWalk} className="mb-4 py-2 px-4 rounded-xl text-sm" style={{ background: ds.greenLight, color: ds.green }}>+ Add walk</button>
      <Field label="Energy"><ThumbPicker value={data.energyThumb} onChange={(v) => up('energyThumb', v)} /></Field>
      <TextArea label="Note" value={data.note} onChange={(v) => up('note', v)} />
    </>
  );
}

function SleepSheet({ data, onChange }) {
  const up = (k, v) => onChange({ ...data, [k]: v });
  return (
    <>
      <Input label="Hours slept" value={data.hours} onChange={(v) => up('hours', v)} type="number" placeholder="7" min={0} max={24} />
      <Field label="Sleep quality"><ThumbPicker value={data.qualityThumb} onChange={(v) => up('qualityThumb', v)} /></Field>
      <TextArea label="Note" value={data.note} onChange={(v) => up('note', v)} />
    </>
  );
}

function AppetiteSheet({ data, onChange }) {
  return (
    <>
      <Field label="Appetite"><ThumbPicker value={data.thumb} onChange={(v) => onChange({ ...data, thumb: v })} /></Field>
      <TextArea label="Note" value={data.note} onChange={(v) => onChange({ ...data, note: v })} />
    </>
  );
}

function MoodSheet({ data, onChange }) {
  return (
    <>
      <Field label="How are you feeling?">
        <div className="flex gap-2 justify-center">
          {moods.map((m) => (
            <button
              key={m.value}
              onClick={() => onChange({ ...data, value: data.value === m.value ? null : m.value })}
              className="text-3xl rounded-2xl w-14 h-14 flex items-center justify-center transition-all"
              style={{
                background: data.value === m.value ? ds.greenLight : ds.divider,
                opacity: data.value === m.value ? 1 : 0.4,
                border: data.value === m.value ? '2px solid #a5c9a8' : '2px solid transparent',
              }}
            >{m.emoji}</button>
          ))}
        </div>
      </Field>
      <TextArea label="Note" value={data.note} onChange={(v) => onChange({ ...data, note: v })} />
    </>
  );
}

function BowelSheet({ data, onChange }) {
  return (
    <>
      <div
        onClick={() => onChange({ ...data, hadBm: !data.hadBm })}
        className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer mb-3"
        style={{ background: data.hadBm ? '#e8f5e9' : ds.divider }}
      >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: data.hadBm ? ds.greenCheck : '#d4d0c8' }}>
          {data.hadBm && <span className="text-white text-sm">✓</span>}
        </div>
        <span style={{ fontSize: 15, color: ds.text }}>Had bowel movement today</span>
      </div>
      <TextArea label="Note" value={data.note} onChange={(v) => onChange({ ...data, note: v })} />
    </>
  );
}

function SymptomsSheet({ data, onChange }) {
  const toggle = (k) => onChange({ ...data, [k]: !data[k] });
  return (
    <>
      {Object.entries(symptomLabels).map(([k, label]) => (
        <div key={k} onClick={() => toggle(k)} className="flex items-center gap-3 py-3 px-1 cursor-pointer" style={{ borderBottom: `1px solid ${ds.divider}` }}>
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: data[k] ? '#d4a574' : ds.border }}>
            {data[k] && <span className="text-white text-xs">✓</span>}
          </div>
          <span style={{ fontSize: 14, color: data[k] ? ds.text : ds.textLight }}>{label}</span>
        </div>
      ))}
      <div className="mt-3"><TextArea label="Note" value={data.note} onChange={(v) => onChange({ ...data, note: v })} /></div>
    </>
  );
}

// ─── Medication Tab ────────────────────────────────────────────────────
function MedicationTab({ schedules, setSchedules, events, setEvents, currentDate }) {
  const [editMode, setEditMode] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [addingMed, setAddingMed] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', doseMg: '', time: '08:00', group: 'Morning', active: true, foodInstruction: '' });
  const [takenSheet, setTakenSheet] = useState(null);

  const groups = ['Morning', 'Afternoon', 'Evening'];
  const getEvent = (scheduleId) => events.find((e) => e.date === currentDate && e.scheduleId === scheduleId);

  const openTakenSheet = (med) => {
    const existing = getEvent(med.id);
    if (existing) {
      setTakenSheet({ scheduleId: med.id, name: med.name, doseMg: med.doseMg, takenAt: existing.takenAt, note: existing.note || '' });
    } else {
      setTakenSheet({ scheduleId: med.id, name: med.name, doseMg: med.doseMg, takenAt: nowTime(), note: '' });
    }
  };

  const saveTaken = async () => {
    if (!takenSheet) return;
    await saveMedEvent({ date: currentDate, scheduleId: takenSheet.scheduleId, taken: true, takenAt: takenSheet.takenAt, takenDoseMg: takenSheet.doseMg, note: takenSheet.note });
    const updated = await loadMedEvents(currentDate);
    setEvents(updated);
    setTakenSheet(null);
  };

  const removeTaken = async () => {
    if (!takenSheet) return;
    await deleteMedEvent(currentDate, takenSheet.scheduleId);
    const updated = await loadMedEvents(currentDate);
    setEvents(updated);
    setTakenSheet(null);
  };

  const saveMedEdit = async () => {
    if (!editingMed) return;
    await saveSchedule(editingMed);
    const updated = await loadSchedules();
    setSchedules(updated);
    setEditingMed(null);
  };

  const deleteMed = async (id) => {
    await deleteSchedule(id);
    const updated = await loadSchedules();
    setSchedules(updated);
    setEditingMed(null);
  };

  const saveNewMed = async () => {
    if (!newMed.name) return;
    await saveSchedule({ ...newMed, id: uid() });
    const updated = await loadSchedules();
    setSchedules(updated);
    setNewMed({ name: '', doseMg: '', time: '08:00', group: 'Morning', active: true, foodInstruction: '' });
    setAddingMed(false);
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setEditMode(!editMode)} className="text-sm px-4 py-1.5 rounded-full font-medium" style={{ background: editMode ? '#d4a574' : '#e8e6e1', color: editMode ? '#fff' : ds.textMuted }}>
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>

      {groups.map((group) => {
        const meds = schedules.filter((s) => s.group === group && s.active).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        if (!meds.length) return null;
        return (
          <div key={group} className="mb-5">
            <div className="mb-2 px-1" style={{ ...tileLabel, color: '#a5a5a5' }}>{group}</div>
            <div className="rounded-2xl overflow-hidden" style={{ background: ds.card, boxShadow: ds.cardShadow }}>
              {meds.map((med, i) => {
                const ev = getEvent(med.id);
                return (
                  <div
                    key={med.id}
                    onClick={() => { if (editMode) setEditingMed({ ...med }); else openTakenSheet(med); }}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50"
                    style={{ borderBottom: i < meds.length - 1 ? `1px solid ${ds.divider}` : 'none' }}
                  >
                    {!editMode ? (
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: ev ? ds.greenCheck : ds.border }}>
                        {ev && <span className="text-white text-sm">✓</span>}
                      </div>
                    ) : (
                      <span style={{ color: ds.textPlaceholder }}>›</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 15, color: ds.text, fontWeight: 500 }}>{med.name}</div>
                      <div style={{ fontSize: 12, color: ds.textLight }}>
                        {med.doseMg} mg · {med.time}
                        {med.foodInstruction === 'before' && <span style={{ color: '#c9a87a' }}> · Before food</span>}
                        {med.foodInstruction === 'with' && <span style={{ color: '#8b9cc7' }}> · With food</span>}
                      </div>
                    </div>
                    {ev && !editMode && <div style={{ fontSize: 12, color: ds.greenCheck }}>✓ Taken {ev.takenAt}</div>}
                    {editMode && <span style={{ color: ds.textPlaceholder, fontSize: 18 }}>›</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {editMode && (
        <button onClick={() => setAddingMed(true)} className="w-full py-3 rounded-2xl text-sm font-medium" style={{ background: ds.greenLight, color: ds.green }}>+ Add medication</button>
      )}

      <BottomSheet open={!!editingMed} onClose={saveMedEdit} title="Edit medication">
        {editingMed && (
          <>
            <Input label="Name" value={editingMed.name} onChange={(v) => setEditingMed({ ...editingMed, name: v })} />
            <Input label="Dose (mg)" value={editingMed.doseMg} onChange={(v) => setEditingMed({ ...editingMed, doseMg: v })} type="number" />
            <Input label="Time" value={editingMed.time} onChange={(v) => setEditingMed({ ...editingMed, time: v })} type="time" />
            <Field label="Group">
              <div className="flex gap-2">
                {groups.map((g) => (
                  <button key={g} onClick={() => setEditingMed({ ...editingMed, group: g })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: editingMed.group === g ? ds.green : ds.divider, color: editingMed.group === g ? '#fff' : ds.textMuted }}>{g}</button>
                ))}
              </div>
            </Field>
            <Field label="Food instruction">
              <div className="flex gap-2">
                {[{ value: '', label: 'None' }, { value: 'before', label: 'Before food' }, { value: 'with', label: 'With food' }].map((opt) => (
                  <button key={opt.value} onClick={() => setEditingMed({ ...editingMed, foodInstruction: opt.value })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: (editingMed.foodInstruction || '') === opt.value ? ds.green : ds.divider, color: (editingMed.foodInstruction || '') === opt.value ? '#fff' : ds.textMuted }}>{opt.label}</button>
                ))}
              </div>
            </Field>
            <button onClick={() => deleteMed(editingMed.id)} className="w-full mt-4 py-3 rounded-2xl text-sm" style={{ background: '#fce8e8', color: '#c97070' }}>Delete medication</button>
          </>
        )}
      </BottomSheet>

      <BottomSheet open={addingMed} onClose={() => setAddingMed(false)} title="Add medication">
        <Input label="Name" value={newMed.name} onChange={(v) => setNewMed({ ...newMed, name: v })} placeholder="Medication name" />
        <Input label="Dose (mg)" value={newMed.doseMg} onChange={(v) => setNewMed({ ...newMed, doseMg: v })} type="number" />
        <Input label="Time" value={newMed.time} onChange={(v) => setNewMed({ ...newMed, time: v })} type="time" />
        <Field label="Group">
          <div className="flex gap-2">
            {groups.map((g) => (
              <button key={g} onClick={() => setNewMed({ ...newMed, group: g })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: newMed.group === g ? ds.green : ds.divider, color: newMed.group === g ? '#fff' : ds.textMuted }}>{g}</button>
            ))}
          </div>
        </Field>
        <Field label="Food instruction">
          <div className="flex gap-2">
            {[{ value: '', label: 'None' }, { value: 'before', label: 'Before food' }, { value: 'with', label: 'With food' }].map((opt) => (
              <button key={opt.value} onClick={() => setNewMed({ ...newMed, foodInstruction: opt.value })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: newMed.foodInstruction === opt.value ? ds.green : ds.divider, color: newMed.foodInstruction === opt.value ? '#fff' : ds.textMuted }}>{opt.label}</button>
            ))}
          </div>
        </Field>
        <button onClick={saveNewMed} className="w-full mt-3 py-3 rounded-2xl text-sm font-semibold" style={{ background: ds.green, color: '#fff' }}>Save medication</button>
      </BottomSheet>

      <BottomSheet open={!!takenSheet} onClose={() => setTakenSheet(null)} title={takenSheet ? takenSheet.name : ''}>
        {takenSheet && (
          <>
            <div className="mb-4 p-3 rounded-2xl" style={{ background: ds.cardAlt }}>
              <div style={{ fontSize: 14, color: ds.textMuted }}>{takenSheet.doseMg} mg</div>
            </div>
            <Input label="Time taken" value={takenSheet.takenAt} onChange={(v) => setTakenSheet({ ...takenSheet, takenAt: v })} type="time" />
            <TextArea label="Note (optional)" value={takenSheet.note} onChange={(v) => setTakenSheet({ ...takenSheet, note: v })} placeholder="Any notes..." />
            <button onClick={saveTaken} className="w-full mt-2 py-3 rounded-2xl text-sm font-semibold" style={{ background: ds.green, color: '#fff' }}>Mark as taken</button>
            {getEvent(takenSheet.scheduleId) && (
              <button onClick={removeTaken} className="w-full mt-2 py-3 rounded-2xl text-sm" style={{ background: '#fce8e8', color: '#c97070' }}>Mark as not taken</button>
            )}
          </>
        )}
      </BottomSheet>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('overview');
  const [currentDate, setCurrentDate] = useState(todayStr());
  const [tab, setTab] = useState('overview');
  const [dayData, setDayData] = useState(emptyDay());
  const [isDayEmpty, setIsDayEmpty] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [medEvents, setMedEvents] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scroll to top when switching pages
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  // Swipe to change date
  const touchRef = useRef(null);
  const handleTouchStart = useCallback((e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleTouchEnd = useCallback((e) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx > 0) {
      setCurrentDate((prev) => addDays(prev, -1));
    } else {
      setCurrentDate((prev) => prev < todayStr() ? addDays(prev, 1) : prev);
    }
  }, []);

  // Load data when date changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [day, scheds, evts] = await Promise.all([
        loadDay(currentDate),
        loadSchedules(),
        loadMedEvents(currentDate),
      ]);
      if (cancelled) return;
      setDayData(day || emptyDay());
      setIsDayEmpty(!day);
      setSchedules(scheds);
      setMedEvents(evts);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [currentDate]);

  // Auto-save day data to IndexedDB
  const updateDay = useCallback((section, value) => {
    setDayData((prev) => {
      const updated = { ...prev, [section]: value };
      saveDay(currentDate, updated); // fire-and-forget persist
      setIsDayEmpty(false);
      return updated;
    });
  }, [currentDate]);

  const canGoForward = currentDate < todayStr();

  // Export backup
  const handleExport = async () => {
    const data = await exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-log-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sheetConfigs = {
    vitals: { title: 'Vitals', content: <VitalsSheet data={dayData.vitals} onChange={(v) => updateDay('vitals', v)} /> },
    pain: { title: 'Pain', content: <PainSheet data={dayData.pain} onChange={(v) => updateDay('pain', v)} /> },
    activity: { title: 'Activity', content: <ActivitySheet data={dayData.activity} onChange={(v) => updateDay('activity', v)} /> },
    sleep: { title: 'Sleep', content: <SleepSheet data={dayData.sleep} onChange={(v) => updateDay('sleep', v)} /> },
    appetite: { title: 'Appetite', content: <AppetiteSheet data={dayData.appetite} onChange={(v) => updateDay('appetite', v)} /> },
    mood: { title: 'Mood', content: <MoodSheet data={dayData.mood} onChange={(v) => updateDay('mood', v)} /> },
    bowel: { title: 'Bowel movement', content: <BowelSheet data={dayData.bowel} onChange={(v) => updateDay('bowel', v)} /> },
    symptoms: { title: 'Symptoms', content: <SymptomsSheet data={dayData.symptoms} onChange={(v) => updateDay('symptoms', v)} /> },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: ds.bg }}>
        <div style={{ color: ds.greenSage, fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: ds.bg, fontFamily: "'DM Sans', sans-serif" }}>
      {page === 'overview' && (
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {/* Header */}
          <div className="px-5 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #8fae8b 0%, #a3c4a0 40%, #90c5b0 100%)' }}>
            <div className="flex items-center justify-between mb-1">
              <button onClick={() => setCurrentDate(addDays(currentDate, -1))} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <span className="text-white text-lg">‹</span>
              </button>
              <div className="text-center">
                <div className="text-xl font-bold text-white" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>{formatDate(currentDate)}</div>
                <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{getEncouragement(currentDate)}</div>
              </div>
              <button
                onClick={() => canGoForward && setCurrentDate(addDays(currentDate, 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: canGoForward ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', cursor: canGoForward ? 'pointer' : 'default' }}
              >
                <span style={{ color: canGoForward ? '#fff' : 'rgba(255,255,255,0.3)' }} className="text-lg">›</span>
              </button>
            </div>
          </div>

          {/* Segmented Control */}
          <div className="px-5 -mt-3">
            <div className="flex rounded-2xl p-1" style={{ background: '#e8e6e1' }}>
              {['overview', 'medication'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: tab === t ? ds.card : 'transparent', color: tab === t ? ds.text : ds.textLight, boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
                >{t === 'overview' ? 'Overview' : 'Medication'}</button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            {tab === 'overview' ? (
              <div className="flex flex-col gap-3">
                {isDayEmpty && (
                  <div className="text-center py-2 px-4 rounded-2xl" style={{ background: 'rgba(143,174,139,0.08)', color: ds.greenSage, fontSize: 13 }}>
                    Tap any card to start recording
                  </div>
                )}
                <VitalsTile data={dayData.vitals} onClick={() => setActiveSheet('vitals')} />
                <div className="grid grid-cols-2 gap-3">
                  <MoodTile data={dayData.mood} onClick={() => setActiveSheet('mood')} />
                  <SleepTile data={dayData.sleep} onClick={() => setActiveSheet('sleep')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <PainTile data={dayData.pain} onClick={() => setActiveSheet('pain')} />
                  <ActivityTile data={dayData.activity} onClick={() => setActiveSheet('activity')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SmallTile label="Appetite" icon="🍽" color="#c9a87a"
                    value={dayData.appetite.thumb === 'up' ? '👍' : dayData.appetite.thumb === 'down' ? '👎' : null}
                    sub={dayData.appetite.note || null}
                    empty={!dayData.appetite.thumb && !(dayData.appetite.note && dayData.appetite.note.trim())}
                    onClick={() => setActiveSheet('appetite')} />
                  <SmallTile label="Bowels" icon="🚽" color="#8fb8b0"
                    value={dayData.bowel.hadBm ? '💩' : null}
                    sub={dayData.bowel.hadBm ? (dayData.bowel.note ? dayData.bowel.note : 'Yes') : (dayData.bowel.note ? dayData.bowel.note : null)}
                    empty={!dayData.bowel.hadBm && !(dayData.bowel.note && dayData.bowel.note.trim())}
                    onClick={() => setActiveSheet('bowel')} />
                </div>
                <SymptomsTile data={dayData.symptoms} onClick={() => setActiveSheet('symptoms')} />
              </div>
            ) : (
              <MedicationTab schedules={schedules} setSchedules={setSchedules} events={medEvents} setEvents={setMedEvents} currentDate={currentDate} />
            )}
          </div>

          {/* Bottom Sheets */}
          {activeSheet && sheetConfigs[activeSheet] && (
            <BottomSheet open={true} onClose={() => setActiveSheet(null)} title={sheetConfigs[activeSheet].title}>
              {sheetConfigs[activeSheet].content}
            </BottomSheet>
          )}
        </div>
      )}

      {page === 'trends' && <TrendsPage />}
      {page === 'profile' && <ProfilePage onExport={handleExport} />}

      {/* Spacer for bottom nav */}
      <div style={{ height: 72 }} />

      <BottomNav page={page} setPage={(p) => { if (p === 'overview') setCurrentDate(todayStr()); setPage(p); }} />
    </div>
  );
}
