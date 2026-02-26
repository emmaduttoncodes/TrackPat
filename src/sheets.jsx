import { ds, inputStyle, labelStyle } from './styles';
import { moods, symptomLabels } from './constants';
import { uid, nowTime } from './helpers';
import { Field, Input, TextArea, ThumbPicker } from './ui';

export function VitalsSheet({ data, onChange }) {
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

export function PainSheet({ data, onChange }) {
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
          <Input label="Pain level (0–10)" value={e.level} onChange={(v) => update(i, 'level', v)} type="number" placeholder="5" min={0} max={10} />
          <Input label="Location" value={e.location} onChange={(v) => update(i, 'location', v)} placeholder="e.g. abdomen" />
          <TextArea label="Note" value={e.note} onChange={(v) => update(i, 'note', v)} />
        </div>
      ))}
      <button onClick={addEntry} className="w-full py-3 rounded-2xl text-sm font-medium" style={{ background: ds.greenLight, color: ds.green }}>+ Add pain entry</button>
    </>
  );
}

export function ActivitySheet({ data, onChange }) {
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

export function SleepSheet({ data, onChange }) {
  const up = (k, v) => onChange({ ...data, [k]: v });
  return (
    <>
      <Input label="Hours slept" value={data.hours} onChange={(v) => up('hours', v)} type="number" placeholder="7" min={0} max={24} />
      <Field label="Sleep quality"><ThumbPicker value={data.qualityThumb} onChange={(v) => up('qualityThumb', v)} /></Field>
      <TextArea label="Note" value={data.note} onChange={(v) => up('note', v)} />
    </>
  );
}

export function AppetiteSheet({ data, onChange }) {
  return (
    <>
      <Field label="Appetite"><ThumbPicker value={data.thumb} onChange={(v) => onChange({ ...data, thumb: v })} /></Field>
      <TextArea label="Note" value={data.note} onChange={(v) => onChange({ ...data, note: v })} />
    </>
  );
}

export function MoodSheet({ data, onChange }) {
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

export function BowelSheet({ data, onChange }) {
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

export function SymptomsSheet({ data, onChange }) {
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
