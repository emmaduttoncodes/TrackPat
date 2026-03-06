import { ds, tile, tileLabel, tileValue } from './styles';
import { moods, symptomLabels } from './constants';

export function VitalsTile({ data, onClick }) {
  const stats = [
    { label: 'Temp', value: data.temperatureC ? `${data.temperatureC}°` : '—', unit: 'C', color: '#c97070' },
    { label: 'BP', value: data.systolic && data.diastolic ? `${data.systolic}/${data.diastolic}` : '—', unit: '', color: '#8b9cc7' },
    { label: 'Heart', value: data.heartRate || '—', unit: data.heartRate ? 'bpm' : '', color: '#c97070' },
    { label: 'Weight', value: data.weightKg || '—', unit: data.weightKg ? 'kg' : '', color: '#7ab8a8' },
  ];
  const allEmpty = stats.every((s) => s.value === '—');
  return (
    <div style={tile} onClick={onClick} className="active:scale-[0.98]">
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div style={{ ...tileLabel, color: ds.greenSage }}>Vitals</div>
        {allEmpty && <div style={{ fontSize: 12, color: ds.textPlaceholder }}>Tap to log</div>}
      </div>
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

export function MoodTile({ data, onClick }) {
  const found = moods.find((m) => m.value === data.value);
  return (
    <div style={{ ...tile, display: 'flex', flexDirection: 'column', minHeight: 120 }} onClick={onClick} className="active:scale-[0.98]">
      <div style={{ ...tileLabel, color: '#b8a0c9' }}>Mood</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {found ? (
          <div style={{ fontSize: 42, lineHeight: 1 }}>{found.emoji}</div>
        ) : (
          <div>
            <div style={{ fontSize: 32, opacity: 0.2, lineHeight: 1 }}>💭</div>
            <div style={{ fontSize: 12, color: ds.textPlaceholder, marginTop: 4 }}>Tap to log</div>
          </div>
        )}
      </div>
      {data.note && <div style={{ fontSize: 11, color: ds.textLight, marginTop: 6, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.note}</div>}
    </div>
  );
}

export function SleepTile({ data, onClick }) {
  const hrs = Number(data.hours) || 0;
  const pct = Math.min(hrs / 10, 1);
  return (
    <div style={{ ...tile, minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={onClick} className="active:scale-[0.98]">
      <div style={{ ...tileLabel, color: '#8b9cc7' }}>Sleep</div>
      <div className="flex items-end gap-2 mt-2">
        <div style={{ ...tileValue, fontSize: hrs ? 36 : 28, color: hrs ? ds.text : '#d4d0c8', lineHeight: 1 }}>{hrs ? hrs : '—'}</div>
        {hrs > 0 && <div style={{ fontSize: 14, color: '#8b9cc7', paddingBottom: 2 }}>hrs</div>}
        {!hrs && <div style={{ fontSize: 12, color: ds.textPlaceholder, paddingBottom: 2 }}>Tap to log</div>}
      </div>
      <div className="mt-2 rounded-full overflow-hidden" style={{ height: 6, background: '#eeecea' }}>
        <div className="rounded-full" style={{ height: '100%', width: `${pct * 100}%`, background: 'linear-gradient(90deg, #8b9cc7, #a8b8d8)', transition: 'width .3s' }} />
      </div>
      {data.qualityThumb && <div style={{ fontSize: 11, color: ds.textLight, marginTop: 4 }}>{data.qualityThumb === 'up' ? '👍 Good' : '👎 Poor'}</div>}
    </div>
  );
}

export function PainTile({ data, onClick }) {
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
            <div style={{ fontSize: 13, color: ds.textPlaceholder, marginTop: 6 }}>Tap to log</div>
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

export function ActivityTile({ data, onClick }) {
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
          <span style={{ fontSize: 13, color: ds.textPlaceholder }}>Tap to log</span>
        </div>
      )}
    </div>
  );
}

export function SmallTile({ label, icon, value, sub, color, onClick, empty }) {
  return (
    <div style={{ ...tile, minHeight: 72, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={onClick} className="active:scale-[0.98]">
      <div style={{ ...tileLabel, color }}>{label}</div>
      {empty ? (
        <div className="flex items-center gap-2 mt-1">
          <span style={{ fontSize: 20, opacity: 0.2 }}>{icon}</span>
          <span style={{ fontSize: 12, color: ds.textPlaceholder }}>Tap to log</span>
        </div>
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

export function SymptomsTile({ data, onClick }) {
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
