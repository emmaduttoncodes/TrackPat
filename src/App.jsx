import { useState, useEffect, useCallback } from 'react';
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
        className="relative w-full max-w-lg rounded-t-3xl px-5 pb-8 pt-3"
        style={{ background: '#faf9f6', maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp .25s ease-out' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: '#d4d0c8' }} />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#3d3d3d', fontFamily: "'Source Serif 4', Georgia, serif" }}>{title}</h3>
          <button onClick={onClose} className="text-sm px-3 py-1 rounded-full" style={{ background: '#e8e6e1', color: '#6b6b6b' }}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Input Components ──────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e0ddd6',
  background: '#fff', fontSize: 15, color: '#3d3d3d', outline: 'none', fontFamily: "'DM Sans', sans-serif",
};
const labelStyle = { fontSize: 13, fontWeight: 500, color: '#7a7a7a', marginBottom: 4, display: 'block', fontFamily: "'DM Sans', sans-serif" };

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
      <input type={type} inputMode={type === 'number' ? 'decimal' : undefined} value={value} onChange={(e) => handleChange(e.target.value)} onBlur={handleBlur} placeholder={placeholder} style={{ ...inputStyle, borderColor: error ? '#d4a574' : '#e0ddd6' }} />
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
        background: value === v ? '#e8f5e9' : '#f0eeea',
        opacity: value === v ? 1 : 0.45,
        border: value === v ? '2px solid #a5c9a8' : '2px solid transparent',
      }}
    >{emoji}</button>
  );
  return <div className="flex gap-3">{btn('up', '👍')}{btn('down', '👎')}</div>;
}

// ─── Dashboard Tiles ───────────────────────────────────────────────────
const tile = {
  background: '#fff', borderRadius: 20, padding: '14px 16px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)',
  cursor: 'pointer', transition: 'transform .1s', border: '1px solid rgba(0,0,0,0.03)',
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
    <div style={{ ...tile, padding: '16px 18px' }} onClick={onClick} className="active:scale-[0.98]">
      <div style={{ ...tileLabel, color: '#8fae8b', marginBottom: 12 }}>Vitals</div>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div style={{ ...tileValue, fontSize: s.value.length > 5 ? 16 : 22, color: s.value === '—' ? '#d4d0c8' : '#3d3d3d', lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.value === '—' ? '#ccc' : s.color, marginTop: 2, fontWeight: 500 }}>{s.unit && s.value !== '—' ? s.unit : s.label}</div>
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
      {data.note && <div style={{ fontSize: 11, color: '#aaa', marginTop: 6, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.note}</div>}
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
        <div style={{ ...tileValue, fontSize: hrs ? 36 : 28, color: hrs ? '#3d3d3d' : '#d4d0c8', lineHeight: 1 }}>{hrs ? hrs : '—'}</div>
        {hrs > 0 && <div style={{ fontSize: 14, color: '#8b9cc7', paddingBottom: 2 }}>hrs</div>}
      </div>
      <div className="mt-2 rounded-full overflow-hidden" style={{ height: 6, background: '#eeecea' }}>
        <div className="rounded-full" style={{ height: '100%', width: `${pct * 100}%`, background: 'linear-gradient(90deg, #8b9cc7, #a8b8d8)', transition: 'width .3s' }} />
      </div>
      {data.qualityThumb && <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{data.qualityThumb === 'up' ? '👍 Good' : '👎 Poor'}</div>}
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
                <span style={{ ...tileValue, fontSize: 28, color: '#3d3d3d', lineHeight: 1 }}>{last.level}</span>
                <span style={{ fontSize: 12, color: '#bbb', paddingBottom: 2 }}>/10</span>
              </div>
              {data.length > 1 && <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{data.length} entries today</div>}
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#ccc', marginTop: 6 }}>None</div>
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
            <span style={{ ...tileValue, fontSize: 28, color: '#3d3d3d', lineHeight: 1 }}>{total}</span>
            <span style={{ fontSize: 12, color: '#bbb', paddingBottom: 2 }}>min</span>
          </div>
          {data.energyThumb && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{data.energyThumb === 'up' ? '👍 Good energy' : '👎 Low energy'}</div>}
        </>
      ) : (
        <div className="flex items-center gap-2 mt-3">
          <span style={{ fontSize: 20, opacity: 0.2 }}>🚶</span>
          <span style={{ fontSize: 13, color: '#ccc' }}>No walks</span>
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
          {!value && sub && <span style={{ fontSize: 12, color: '#999', flexShrink: 0 }}>📝</span>}
          {sub && <span style={{ fontSize: 12, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
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
      style={{ ...tile, background: hasAny ? '#fdf6ee' : '#fff', borderColor: hasAny ? 'rgba(212,165,116,0.2)' : 'rgba(0,0,0,0.03)', padding: '12px 16px' }}
      onClick={onClick}
      className="active:scale-[0.98]"
    >
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 14 }}>{hasAny ? '⚠️' : '✅'}</span>
        <span style={{ ...tileLabel, color: hasAny ? '#c9914a' : '#8fae8b', margin: 0 }}>{hasAny ? 'Symptoms' : 'No symptoms'}</span>
        {hasAny && <span style={{ fontSize: 12, color: '#c9914a', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{summaryText}</span>}
        {!hasAny && <span style={{ color: '#ccc', fontSize: 16, marginLeft: 'auto' }}>›</span>}
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
        background: '#e8f0e8', borderTop: '1px solid rgba(0,0,0,0.04)',
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
                color: active ? '#7a9b7e' : '#b5b5b5', fontFamily: "'DM Sans', sans-serif",
                fontSize: 11, fontWeight: active ? 600 : 500,
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 20, height: 3, borderRadius: 2, background: '#7a9b7e',
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
      <div style={{ ...tile, padding: '16px 18px', marginBottom: 12 }}>
        <div style={{ ...tileLabel, color, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#ccc', textAlign: 'center', padding: '20px 0' }}>No data yet</div>
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
    <div style={{ ...tile, padding: '16px 18px', marginBottom: 12 }}>
      <div style={{ ...tileLabel, color, marginBottom: 8 }}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {/* Y grid lines and labels */}
        {yLabels.map((v, i) => {
          const y = padT + chartH - ((v - lo) / range) * chartH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eeecea" strokeWidth="1" />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="#bbb" fontSize="8" fontFamily="DM Sans, sans-serif">
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
            <text key={i} x={p.px} y={H - 4} textAnchor="middle" fill="#bbb" fontSize="8" fontFamily="DM Sans, sans-serif">
              {lbl}
            </text>
          );
        })}
      </svg>
      {/* Latest value */}
      <div style={{ fontSize: 12, color: '#999', marginTop: 4, textAlign: 'right' }}>
        Latest: <span style={{ color: '#3d3d3d', fontWeight: 600 }}>{formatY ? formatY(data[data.length - 1].y) : data[data.length - 1].y}{unit ? ` ${unit}` : ''}</span>
      </div>
    </div>
  );
}

const moodEmojis = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };

function TrendsPage() {
  const [allDays, setAllDays] = useState(null);

  useEffect(() => {
    loadAllDays().then(setAllDays);
  }, []);

  if (!allDays) {
    return (
      <div style={{ paddingTop: 'env(safe-area-inset-top)', background: '#f7f6f2', minHeight: '100vh' }}>
        <div style={{ padding: '24px 20px' }}>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 600, color: '#3d3d3d' }}>Trends</h2>
          <div style={{ color: '#8fae8b', textAlign: 'center', padding: 40 }}>Loading...</div>
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
    <div style={{ paddingTop: 'env(safe-area-inset-top)', background: '#f7f6f2', minHeight: '100vh' }}>
      <div style={{ padding: '24px 20px' }}>
        <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 600, color: '#3d3d3d', marginBottom: 20 }}>Trends</h2>

        {!hasAny && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b5b5b5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p style={{ fontSize: 14, color: '#999', maxWidth: 260, margin: '0 auto', lineHeight: 1.5 }}>Start logging data on the Overview tab and your trends will appear here.</p>
          </div>
        )}

        <MiniChart title="Pain" color="#d4a574" data={painData} unit="/10" yMin={0} yMax={10} />
        <MiniChart title="Activity" color="#7ab8a8" data={activityData} unit="min" yMin={0} />
        <MiniChart title="Weight" color="#8b9cc7" data={weightData} unit="kg" />
        <MiniChart title="Mood" color="#b8a0c9" data={moodData} yMin={1} yMax={5}
          formatY={(v) => moodEmojis[Math.round(v)] || Math.round(v)} />
      </div>
    </div>
  );
}

function ProfilePage({ onExport }) {
  const [transplantDate, setTransplantDate] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSetting('transplantDate').then((v) => {
      if (v) setTransplantDate(v);
      setLoaded(true);
    });
  }, []);

  const handleDateChange = (value) => {
    setTransplantDate(value);
    saveSetting('transplantDate', value);
  };

  const daysSince = () => {
    if (!transplantDate) return null;
    const tx = new Date(transplantDate + 'T12:00:00');
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return Math.floor((now - tx) / 86400000);
  };

  const days = daysSince();

  if (!loaded) return null;

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)', background: '#f7f6f2', minHeight: '100vh' }}>
      <div style={{ padding: '24px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b5b5b5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px' }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 600, color: '#3d3d3d', margin: 0 }}>Profile</h2>
        </div>

        {/* Days since transplant display */}
        {days != null && days >= 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #8fae8b 0%, #a3c4a0 40%, #90c5b0 100%)',
            borderRadius: 20, padding: '24px 20px', marginBottom: 20, textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{days}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 6, fontWeight: 500 }}>
              {days === 1 ? 'day' : 'days'} since transplant 🎉
            </div>
          </div>
        )}

        {/* Transplant date input */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)',
        }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#7a7a7a', marginBottom: 6, display: 'block', fontFamily: "'DM Sans', sans-serif" }}>
            Transplant Date
          </label>
          <input
            type="date"
            value={transplantDate}
            onChange={(e) => handleDateChange(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e0ddd6',
              background: '#fff', fontSize: 15, color: '#3d3d3d', outline: 'none', fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        {/* Export */}
        <button onClick={onExport} className="w-full py-3 rounded-2xl text-sm" style={{ background: '#e8e6e1', color: '#7a7a7a' }}>
          Download Backup
        </button>
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
      <Input label="Heart Rate (bpm)" value={data.heartRate} onChange={(v) => up('heartRate', v)} type="number" placeholder="72" min={20} max={250} />
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
        <div key={e.id} className="mb-4 p-3 rounded-2xl" style={{ background: '#f5f4f0' }}>
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontSize: 12, color: '#999' }}>{e.time}</span>
            <button onClick={() => remove(i)} style={{ fontSize: 12, color: '#c97070' }}>Remove</button>
          </div>
          <Input label="Pain Level (1–10)" value={e.level} onChange={(v) => update(i, 'level', v)} type="number" placeholder="5" min={1} max={10} />
          <Input label="Location" value={e.location} onChange={(v) => update(i, 'location', v)} placeholder="e.g. abdomen" />
          <TextArea label="Note" value={e.note} onChange={(v) => update(i, 'note', v)} />
        </div>
      ))}
      <button onClick={addEntry} className="w-full py-3 rounded-2xl text-sm font-medium" style={{ background: '#e8f0e8', color: '#5a7a5a' }}>+ Add Pain Entry</button>
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
      <button onClick={addWalk} className="mb-4 py-2 px-4 rounded-xl text-sm" style={{ background: '#e8f0e8', color: '#5a7a5a' }}>+ Add Walk</button>
      <Field label="Energy"><ThumbPicker value={data.energyThumb} onChange={(v) => up('energyThumb', v)} /></Field>
      <TextArea label="Note" value={data.note} onChange={(v) => up('note', v)} />
    </>
  );
}

function SleepSheet({ data, onChange }) {
  const up = (k, v) => onChange({ ...data, [k]: v });
  return (
    <>
      <Input label="Hours Slept" value={data.hours} onChange={(v) => up('hours', v)} type="number" placeholder="7" min={0} max={24} />
      <Field label="Sleep Quality"><ThumbPicker value={data.qualityThumb} onChange={(v) => up('qualityThumb', v)} /></Field>
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
                background: data.value === m.value ? '#e8f0e8' : '#f0eeea',
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
        style={{ background: data.hadBm ? '#e8f5e9' : '#f0eeea' }}
      >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: data.hadBm ? '#7fb685' : '#d4d0c8' }}>
          {data.hadBm && <span className="text-white text-sm">✓</span>}
        </div>
        <span style={{ fontSize: 15, color: '#3d3d3d' }}>Had bowel movement today</span>
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
        <div key={k} onClick={() => toggle(k)} className="flex items-center gap-3 py-3 px-1 cursor-pointer" style={{ borderBottom: '1px solid #f0eeea' }}>
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: data[k] ? '#d4a574' : '#e0ddd6' }}>
            {data[k] && <span className="text-white text-xs">✓</span>}
          </div>
          <span style={{ fontSize: 14, color: data[k] ? '#3d3d3d' : '#999' }}>{label}</span>
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
        <button onClick={() => setEditMode(!editMode)} className="text-sm px-4 py-1.5 rounded-full font-medium" style={{ background: editMode ? '#d4a574' : '#e8e6e1', color: editMode ? '#fff' : '#6b6b6b' }}>
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>

      {groups.map((group) => {
        const meds = schedules.filter((s) => s.group === group && s.active);
        if (!meds.length) return null;
        return (
          <div key={group} className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: '#a5a5a5' }}>{group}</div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {meds.map((med, i) => {
                const ev = getEvent(med.id);
                return (
                  <div
                    key={med.id}
                    onClick={() => { if (editMode) setEditingMed({ ...med }); else openTakenSheet(med); }}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50"
                    style={{ borderBottom: i < meds.length - 1 ? '1px solid #f0eeea' : 'none' }}
                  >
                    {!editMode ? (
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: ev ? '#7fb685' : '#e0ddd6' }}>
                        {ev && <span className="text-white text-sm">✓</span>}
                      </div>
                    ) : (
                      <span style={{ color: '#ccc' }}>›</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 15, color: '#3d3d3d', fontWeight: 500 }}>{med.name}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {med.doseMg} mg · {med.time}
                        {med.foodInstruction === 'before' && <span style={{ color: '#c9a87a' }}> · Before food</span>}
                        {med.foodInstruction === 'with' && <span style={{ color: '#8b9cc7' }}> · With food</span>}
                      </div>
                    </div>
                    {ev && !editMode && <div style={{ fontSize: 12, color: '#7fb685' }}>✓ Taken {ev.takenAt}</div>}
                    {editMode && <span style={{ color: '#ccc', fontSize: 18 }}>›</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {editMode && (
        <button onClick={() => setAddingMed(true)} className="w-full py-3 rounded-2xl text-sm font-medium" style={{ background: '#e8f0e8', color: '#5a7a5a' }}>+ Add Medication</button>
      )}

      <BottomSheet open={!!editingMed} onClose={saveMedEdit} title="Edit Medication">
        {editingMed && (
          <>
            <Input label="Name" value={editingMed.name} onChange={(v) => setEditingMed({ ...editingMed, name: v })} />
            <Input label="Dose (mg)" value={editingMed.doseMg} onChange={(v) => setEditingMed({ ...editingMed, doseMg: v })} type="number" />
            <Input label="Time" value={editingMed.time} onChange={(v) => setEditingMed({ ...editingMed, time: v })} type="time" />
            <Field label="Group">
              <div className="flex gap-2">
                {groups.map((g) => (
                  <button key={g} onClick={() => setEditingMed({ ...editingMed, group: g })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: editingMed.group === g ? '#7a9b7e' : '#f0eeea', color: editingMed.group === g ? '#fff' : '#6b6b6b' }}>{g}</button>
                ))}
              </div>
            </Field>
            <Field label="Food Instruction">
              <div className="flex gap-2">
                {[{ value: '', label: 'None' }, { value: 'before', label: 'Before food' }, { value: 'with', label: 'With food' }].map((opt) => (
                  <button key={opt.value} onClick={() => setEditingMed({ ...editingMed, foodInstruction: opt.value })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: (editingMed.foodInstruction || '') === opt.value ? '#7a9b7e' : '#f0eeea', color: (editingMed.foodInstruction || '') === opt.value ? '#fff' : '#6b6b6b' }}>{opt.label}</button>
                ))}
              </div>
            </Field>
            <button onClick={() => deleteMed(editingMed.id)} className="w-full mt-4 py-3 rounded-2xl text-sm" style={{ background: '#fce8e8', color: '#c97070' }}>Delete Medication</button>
          </>
        )}
      </BottomSheet>

      <BottomSheet open={addingMed} onClose={() => setAddingMed(false)} title="Add Medication">
        <Input label="Name" value={newMed.name} onChange={(v) => setNewMed({ ...newMed, name: v })} placeholder="Medication name" />
        <Input label="Dose (mg)" value={newMed.doseMg} onChange={(v) => setNewMed({ ...newMed, doseMg: v })} type="number" />
        <Input label="Time" value={newMed.time} onChange={(v) => setNewMed({ ...newMed, time: v })} type="time" />
        <Field label="Group">
          <div className="flex gap-2">
            {groups.map((g) => (
              <button key={g} onClick={() => setNewMed({ ...newMed, group: g })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: newMed.group === g ? '#7a9b7e' : '#f0eeea', color: newMed.group === g ? '#fff' : '#6b6b6b' }}>{g}</button>
            ))}
          </div>
        </Field>
        <Field label="Food Instruction">
          <div className="flex gap-2">
            {[{ value: '', label: 'None' }, { value: 'before', label: 'Before food' }, { value: 'with', label: 'With food' }].map((opt) => (
              <button key={opt.value} onClick={() => setNewMed({ ...newMed, foodInstruction: opt.value })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: newMed.foodInstruction === opt.value ? '#7a9b7e' : '#f0eeea', color: newMed.foodInstruction === opt.value ? '#fff' : '#6b6b6b' }}>{opt.label}</button>
            ))}
          </div>
        </Field>
        <button onClick={saveNewMed} className="w-full mt-3 py-3 rounded-2xl text-sm font-semibold" style={{ background: '#7a9b7e', color: '#fff' }}>Save Medication</button>
      </BottomSheet>

      <BottomSheet open={!!takenSheet} onClose={() => setTakenSheet(null)} title={takenSheet ? takenSheet.name : ''}>
        {takenSheet && (
          <>
            <div className="mb-4 p-3 rounded-2xl" style={{ background: '#f5f4f0' }}>
              <div style={{ fontSize: 14, color: '#7a7a7a' }}>{takenSheet.doseMg} mg</div>
            </div>
            <Input label="Time Taken" value={takenSheet.takenAt} onChange={(v) => setTakenSheet({ ...takenSheet, takenAt: v })} type="time" />
            <TextArea label="Note (optional)" value={takenSheet.note} onChange={(v) => setTakenSheet({ ...takenSheet, note: v })} placeholder="Any notes..." />
            <button onClick={saveTaken} className="w-full mt-2 py-3 rounded-2xl text-sm font-semibold" style={{ background: '#7a9b7e', color: '#fff' }}>Mark as Taken</button>
            {getEvent(takenSheet.scheduleId) && (
              <button onClick={removeTaken} className="w-full mt-2 py-3 rounded-2xl text-sm" style={{ background: '#fce8e8', color: '#c97070' }}>Mark as Not Taken</button>
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
    bowel: { title: 'Bowel Movement', content: <BowelSheet data={dayData.bowel} onChange={(v) => updateDay('bowel', v)} /> },
    symptoms: { title: 'Symptoms', content: <SymptomsSheet data={dayData.symptoms} onChange={(v) => updateDay('symptoms', v)} /> },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f6f2' }}>
        <div style={{ color: '#8fae8b', fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f6f2', fontFamily: "'DM Sans', sans-serif" }}>
      {page === 'overview' && (
        <>
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
                  style={{ background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#3d3d3d' : '#999', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
                >{t === 'overview' ? 'Overview' : 'Medication'}</button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            {tab === 'overview' ? (
              <div className="flex flex-col gap-3">
                {isDayEmpty && (
                  <div className="text-center py-2 px-4 rounded-2xl" style={{ background: 'rgba(143,174,139,0.08)', color: '#8fae8b', fontSize: 13 }}>
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
                    value={dayData.bowel.hadBm ? '✓' : null}
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
        </>
      )}

      {page === 'trends' && <TrendsPage />}
      {page === 'profile' && <ProfilePage onExport={handleExport} />}

      {/* Spacer for bottom nav */}
      <div style={{ height: 72 }} />

      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}
