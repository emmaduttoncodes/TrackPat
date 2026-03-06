import { useState } from 'react';
import {
  loadSchedules, saveSchedule, loadMedEvents, saveMedEvent, deleteMedEvent,
  loadPrnMeds, savePrnMed, deletePrnMed, loadPrnDoses, addPrnDose, deletePrnDose,
} from './db';
import { getDayName, DAY_NAMES, formatTime, nowTime, uid } from './helpers';
import { ds, inputStyle, tileLabel } from './styles';
import { BottomSheet, Field, Input, TextArea, NudgeCard } from './ui';
import { track } from './analytics';
import { Sparkles } from 'lucide-react';

export function MedicationTab({ schedules, setSchedules, events, setEvents, prnMeds, setPrnMeds, prnDoses, setPrnDoses, currentDate, showToast, isClinicDay, activeNudge, onNudgeComplete }) {
  const [editMode, setEditMode] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [addingMed, setAddingMed] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', doseMg: '', time: '08:00', group: 'Morning', active: true, foodInstruction: '', days: [] });
  const [takenSheet, setTakenSheet] = useState(null);
  // PRN state
  const [addingPrn, setAddingPrn] = useState(false);
  const [newPrn, setNewPrn] = useState({ name: '', doseMg: '', note: '' });
  const [editingPrn, setEditingPrn] = useState(null);
  const [prnDoseSheet, setPrnDoseSheet] = useState(null);
  const [showPrnDoses, setShowPrnDoses] = useState(false);
  const groups = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];
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
    try {
      await saveMedEvent({ date: currentDate, scheduleId: takenSheet.scheduleId, taken: true, takenAt: takenSheet.takenAt, takenDoseMg: takenSheet.doseMg, note: takenSheet.note });
      const updated = await loadMedEvents(currentDate);
      setEvents(updated);
      setTakenSheet(null);
      showToast('Medication logged');
      track('medication_logged');
    } catch {
      showToast('Failed to save — please try again');
    }
  };

  const removeTaken = async () => {
    if (!takenSheet) return;
    try {
      await deleteMedEvent(currentDate, takenSheet.scheduleId);
      const updated = await loadMedEvents(currentDate);
      setEvents(updated);
      setTakenSheet(null);
      showToast('Entry removed');
    } catch {
      showToast('Failed to update — please try again');
    }
  };

  const saveMedEdit = async () => {
    if (!editingMed) return;
    try {
      await saveSchedule(editingMed);
      const updated = await loadSchedules();
      setSchedules(updated);
      setEditingMed(null);
      showToast('Medication updated');
    } catch {
      showToast('Failed to save — please try again');
    }
  };

  const stopMed = async (id) => {
    const med = schedules.find((s) => s.id === id);
    if (!med) return;
    try {
      await saveSchedule({ ...med, active: false });
      const updated = await loadSchedules();
      setSchedules(updated);
      setEditingMed(null);
      showToast('Medication stopped');
    } catch {
      showToast('Failed to update — please try again');
    }
  };

  const restartMed = async (id) => {
    const med = schedules.find((s) => s.id === id);
    if (!med) return;
    try {
      await saveSchedule({ ...med, active: true });
      const updated = await loadSchedules();
      setSchedules(updated);
      showToast('Medication restarted');
    } catch {
      showToast('Failed to update — please try again');
    }
  };

  const saveNewMed = async () => {
    if (!newMed.name) return;
    try {
      await saveSchedule({ ...newMed, id: uid() });
      const updated = await loadSchedules();
      setSchedules(updated);
      setNewMed({ name: '', doseMg: '', time: '08:00', group: 'Morning', active: true, foodInstruction: '', days: [] });
      setAddingMed(false);
      showToast('Medication added');
    } catch {
      showToast('Failed to save — please try again');
    }
  };

  // ─── PRN helpers ────────────────────────────────────
  const saveNewPrn = async () => {
    if (!newPrn.name) return;
    try {
      await savePrnMed({ ...newPrn, id: uid(), active: true });
      setPrnMeds(await loadPrnMeds());
      setNewPrn({ name: '', doseMg: '', note: '' });
      setAddingPrn(false);
      showToast('As-needed medication added');
    } catch {
      showToast('Failed to save — please try again');
    }
  };

  const savePrnEdit = async () => {
    if (!editingPrn) return;
    try {
      await savePrnMed(editingPrn);
      setPrnMeds(await loadPrnMeds());
      setEditingPrn(null);
      showToast('Medication updated');
    } catch {
      showToast('Failed to save — please try again');
    }
  };

  const removePrnMed = async (id) => {
    try {
      await deletePrnMed(id);
      setPrnMeds(await loadPrnMeds());
      setEditingPrn(null);
      showToast('Medication removed');
    } catch {
      showToast('Failed to remove — please try again');
    }
  };

  const openPrnDoseSheet = (med) => {
    setPrnDoseSheet({ prnMedId: med.id, name: med.name, doseMg: med.doseMg || '', time: nowTime(), note: '' });
  };

  const savePrnDose = async () => {
    if (!prnDoseSheet) return;
    try {
      await addPrnDose({ prnMedId: prnDoseSheet.prnMedId, date: currentDate, time: prnDoseSheet.time, doseMg: prnDoseSheet.doseMg, note: prnDoseSheet.note });
      setPrnDoses(await loadPrnDoses(currentDate));
      setPrnDoseSheet(null);
      showToast('Dose logged');
      track('prn_dose_logged');
    } catch {
      showToast('Failed to save — please try again');
    }
  };

  const removePrnDose = async (id) => {
    try {
      await deletePrnDose(id);
      setPrnDoses(await loadPrnDoses(currentDate));
      showToast('Dose removed');
    } catch {
      showToast('Failed to remove — please try again');
    }
  };

  const activePrnMeds = prnMeds.filter((m) => m.active);
  const stoppedPrnMeds = prnMeds.filter((m) => !m.active);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => { setEditMode(!editMode); if (!editMode && activeNudge === 'nudge_meds') onNudgeComplete('nudge_meds'); }} className="text-sm px-4 py-1.5 rounded-full font-medium" style={{ background: editMode ? '#d4a574' : '#e8e6e1', color: editMode ? '#fff' : ds.textMuted }}>
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>

      {activeNudge === 'nudge_meds' && (
        <div style={{ marginBottom: 16 }}>
          <NudgeCard icon={Sparkles} title="Step 2: Review your medications" onDismiss={() => onNudgeComplete('nudge_meds')}>
            Tap Edit to check your medication list and make any changes.
          </NudgeCard>
        </div>
      )}

      {isClinicDay && schedules.some(s => s.name.toLowerCase() === 'tacrolimus' && s.active) && (
        <div style={{ background: ds.amberGradient, borderRadius: ds.radiusLg, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            Clinic day — hold Tacrolimus
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
            Don't take Tacrolimus before your appointment. Bring it with you and take it after your blood test.
          </div>
        </div>
      )}

      {groups.map((group) => {
        const dayName = getDayName(currentDate);
        const meds = schedules.filter((s) => s.group === group && s.active && (!s.days || s.days.length === 0 || s.days.includes(dayName))).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        if (!meds.length) return null;
        return (
          <div key={group} className="mb-5">
            <div className="mb-2 px-1" style={{ ...tileLabel, color: '#a5a5a5' }}>{group}</div>
            <div className="rounded-2xl overflow-hidden" style={{ background: ds.card, boxShadow: ds.cardShadow }}>
              {meds.map((med, i) => {
                const ev = getEvent(med.id);
                const isTacOnClinic = isClinicDay && med.name.toLowerCase() === 'tacrolimus';
                return (
                  <div
                    key={med.id}
                    onClick={() => { if (editMode) setEditingMed({ ...med }); else openTakenSheet(med); }}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50"
                    style={{ borderBottom: i < meds.length - 1 ? `1px solid ${ds.divider}` : 'none', background: isTacOnClinic ? ds.amberLight : undefined }}
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
                        {med.days && med.days.length > 0 && <span style={{ color: '#9b8bb4' }}> · {med.days.join(', ')}</span>}
                        {med.foodInstruction === 'before' && <span style={{ color: '#c9a87a' }}> · Before food</span>}
                        {med.foodInstruction === 'with' && <span style={{ color: '#8b9cc7' }}> · With food</span>}
                        {isTacOnClinic && <span style={{ color: ds.amber }}> · Take after clinic</span>}
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
        <button onClick={() => setAddingMed(true)} className="w-full py-3 rounded-2xl text-sm font-medium" style={{ background: ds.greenLight, color: ds.green }}>+ Add scheduled medication</button>
      )}

      {/* ─── As-needed (PRN) section ─── */}
      <div className="mt-6 mb-5">
        <div className="mb-2 px-1" style={{ ...tileLabel, color: ds.green }}>As needed</div>
        {activePrnMeds.length === 0 && !editMode && (
          <div className="text-center py-4 rounded-2xl" style={{ background: ds.greenLight, color: ds.green, fontSize: 13 }}>
            No as-needed medications yet. Tap Edit to add one.
          </div>
        )}
        {activePrnMeds.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: ds.card, boxShadow: ds.cardShadow }}>
            {activePrnMeds.map((med, i) => {
              const doses = prnDoses.filter((d) => d.prnMedId === med.id);
              const count = doses.length;
              const lastDose = doses.length ? doses.sort((a, b) => b.time.localeCompare(a.time))[0] : null;
              return (
                <div
                  key={med.id}
                  onClick={() => { if (editMode) setEditingPrn({ ...med }); else openPrnDoseSheet(med); }}
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50"
                  style={{ borderBottom: i < activePrnMeds.length - 1 ? `1px solid ${ds.divider}` : 'none' }}
                >
                  {!editMode ? (
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: count > 0 ? ds.greenCheck : ds.border }}>
                      {count > 0 && <span className="text-white text-xs font-bold">{count}</span>}
                    </div>
                  ) : (
                    <span style={{ color: ds.textPlaceholder }}>›</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 15, color: ds.text, fontWeight: 500 }}>{med.name}</div>
                    <div style={{ fontSize: 12, color: ds.textLight }}>
                      {med.doseMg ? `${med.doseMg} mg` : 'As needed'}
                      {med.note && <span style={{ color: '#b0a090' }}> · {med.note}</span>}
                    </div>
                  </div>
                  {!editMode && count > 0 && (
                    <div style={{ fontSize: 12, color: ds.green, textAlign: 'right' }}>
                      <div>{count}x today</div>
                      {lastDose && <div style={{ color: ds.textLight }}>{formatTime(lastDose.time)}</div>}
                    </div>
                  )}
                  {editMode && <span style={{ color: ds.textPlaceholder, fontSize: 18 }}>›</span>}
                </div>
              );
            })}
          </div>
        )}
        {editMode && (
          <button onClick={() => setAddingPrn(true)} className="w-full mt-2 py-3 rounded-2xl text-sm font-medium" style={{ background: ds.greenLight, color: ds.green }}>+ Add as-needed medication</button>
        )}
        {editMode && stoppedPrnMeds.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 px-1" style={{ ...tileLabel, color: '#a5a5a5' }}>Stopped as-needed</div>
            <div className="rounded-2xl overflow-hidden" style={{ background: ds.card, boxShadow: ds.cardShadow, opacity: 0.7 }}>
              {stoppedPrnMeds.map((med, i) => (
                <div key={med.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < stoppedPrnMeds.length - 1 ? `1px solid ${ds.divider}` : 'none' }}>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 15, color: ds.textMuted, fontWeight: 500 }}>{med.name}</div>
                    <div style={{ fontSize: 12, color: ds.textLight }}>{med.doseMg ? `${med.doseMg} mg` : 'As needed'}</div>
                  </div>
                  <button onClick={async () => { await savePrnMed({ ...med, active: true }); setPrnMeds(await loadPrnMeds()); showToast('Medication restarted'); }} className="text-sm px-3 py-1.5 rounded-full font-medium" style={{ background: ds.greenLight, color: ds.green }}>Restart</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Today's as-needed doses ─── */}
      {prnDoses.length > 0 && !editMode && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <div style={{ ...tileLabel, color: ds.green }}>Today's as-needed doses</div>
            <button onClick={() => setShowPrnDoses(!showPrnDoses)} className="text-xs font-medium" style={{ color: ds.green }}>{showPrnDoses ? 'Hide' : 'Show'}</button>
          </div>
          {showPrnDoses && (
            <div className="rounded-2xl overflow-hidden" style={{ background: ds.card, boxShadow: ds.cardShadow }}>
              {[...prnDoses].sort((a, b) => a.time.localeCompare(b.time)).map((dose, i) => {
                const med = prnMeds.find((m) => m.id === dose.prnMedId);
                return (
                  <div key={dose.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < prnDoses.length - 1 ? `1px solid ${ds.divider}` : 'none' }}>
                    <div style={{ fontSize: 12, color: ds.green, fontWeight: 600, minWidth: 52 }}>{formatTime(dose.time)}</div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 14, color: ds.text, fontWeight: 500 }}>{med ? med.name : 'Unknown'}</div>
                      {dose.doseMg && <div style={{ fontSize: 12, color: ds.textLight }}>{dose.doseMg} mg</div>}
                      {dose.note && <div style={{ fontSize: 12, color: ds.textLight }}>{dose.note}</div>}
                    </div>
                    <button onClick={() => { if (window.confirm('Remove this dose?')) removePrnDose(dose.id); }} style={{ fontSize: 16, color: ds.textPlaceholder, padding: 4 }}>×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {editMode && (() => {
        const stopped = schedules.filter((s) => !s.active);
        if (!stopped.length) return null;
        return (
          <div className="mt-6">
            <div className="mb-2 px-1" style={{ ...tileLabel, color: '#a5a5a5' }}>Stopped medications</div>
            <div className="rounded-2xl overflow-hidden" style={{ background: ds.card, boxShadow: ds.cardShadow, opacity: 0.7 }}>
              {stopped.map((med, i) => (
                <div key={med.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < stopped.length - 1 ? `1px solid ${ds.divider}` : 'none' }}>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 15, color: ds.textMuted, fontWeight: 500 }}>{med.name}</div>
                    <div style={{ fontSize: 12, color: ds.textLight }}>{med.doseMg} mg · {med.time}</div>
                  </div>
                  <button onClick={() => restartMed(med.id)} className="text-sm px-3 py-1.5 rounded-full font-medium" style={{ background: ds.greenLight, color: ds.green }}>Restart</button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <BottomSheet open={!!editingMed} onClose={saveMedEdit} title="Edit medication">
        {editingMed && (
          <>
            <Input label="Name" value={editingMed.name} onChange={(v) => setEditingMed({ ...editingMed, name: v })} />
            <Input label="Dose (mg)" value={editingMed.doseMg} onChange={(v) => setEditingMed({ ...editingMed, doseMg: v })} type="number" />
            <Input label="Time" value={editingMed.time} onChange={(v) => setEditingMed({ ...editingMed, time: v })} type="time" />
            <Field label="Group">
              <div className="flex gap-2 flex-wrap">
                {groups.map((g) => (
                  <button key={g} onClick={() => setEditingMed({ ...editingMed, group: g })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: editingMed.group === g ? ds.green : ds.divider, color: editingMed.group === g ? '#fff' : ds.textMuted }}>{g}</button>
                ))}
              </div>
            </Field>
            <Field label="Days">
              <div className="flex gap-1.5 flex-wrap">
                {DAY_NAMES.map((d) => {
                  const days = editingMed.days || [];
                  const selected = days.includes(d);
                  return (
                    <button key={d} onClick={() => setEditingMed({ ...editingMed, days: selected ? days.filter((x) => x !== d) : [...days, d] })} className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: selected ? ds.green : ds.divider, color: selected ? '#fff' : ds.textMuted }}>{d}</button>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: ds.textLight, marginTop: 6 }}>{(!editingMed.days || editingMed.days.length === 0) ? 'Every day (default)' : editingMed.days.join(', ')}</div>
            </Field>
            <Field label="Food instruction">
              <div className="flex gap-2">
                {[{ value: '', label: 'None' }, { value: 'before', label: 'Before food' }, { value: 'with', label: 'With food' }].map((opt) => (
                  <button key={opt.value} onClick={() => setEditingMed({ ...editingMed, foodInstruction: opt.value })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: (editingMed.foodInstruction || '') === opt.value ? ds.green : ds.divider, color: (editingMed.foodInstruction || '') === opt.value ? '#fff' : ds.textMuted }}>{opt.label}</button>
                ))}
              </div>
            </Field>
            <button onClick={() => { if (window.confirm('Stop this medication? It will be moved to the stopped list.')) stopMed(editingMed.id); }} className="w-full mt-4 py-3 rounded-2xl text-sm" style={{ background: '#fce8e8', color: '#c97070' }}>Stop medication</button>
          </>
        )}
      </BottomSheet>

      <BottomSheet open={addingMed} onClose={() => setAddingMed(false)} title="Add medication">
        <Input label="Name" value={newMed.name} onChange={(v) => setNewMed({ ...newMed, name: v })} placeholder="Medication name" />
        <Input label="Dose (mg)" value={newMed.doseMg} onChange={(v) => setNewMed({ ...newMed, doseMg: v })} type="number" />
        <Input label="Time" value={newMed.time} onChange={(v) => setNewMed({ ...newMed, time: v })} type="time" />
        <Field label="Group">
          <div className="flex gap-2 flex-wrap">
            {groups.map((g) => (
              <button key={g} onClick={() => setNewMed({ ...newMed, group: g })} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: newMed.group === g ? ds.green : ds.divider, color: newMed.group === g ? '#fff' : ds.textMuted }}>{g}</button>
            ))}
          </div>
        </Field>
        <Field label="Days">
          <div className="flex gap-1.5 flex-wrap">
            {DAY_NAMES.map((d) => {
              const days = newMed.days || [];
              const selected = days.includes(d);
              return (
                <button key={d} onClick={() => setNewMed({ ...newMed, days: selected ? days.filter((x) => x !== d) : [...days, d] })} className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: selected ? ds.green : ds.divider, color: selected ? '#fff' : ds.textMuted }}>{d}</button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: ds.textLight, marginTop: 6 }}>{(!newMed.days || newMed.days.length === 0) ? 'Every day (default)' : newMed.days.join(', ')}</div>
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
              <button onClick={removeTaken} className="w-full mt-2 py-3 rounded-2xl text-sm" style={{ background: '#fce8e8', color: '#c97070' }}>Remove this entry</button>
            )}
          </>
        )}
      </BottomSheet>

      {/* PRN: Log dose sheet */}
      <BottomSheet open={!!prnDoseSheet} onClose={() => setPrnDoseSheet(null)} title={prnDoseSheet ? prnDoseSheet.name : ''}>
        {prnDoseSheet && (
          <>
            <Input label="Dose (mg)" value={prnDoseSheet.doseMg} onChange={(v) => setPrnDoseSheet({ ...prnDoseSheet, doseMg: v })} type="number" />
            <Input label="Time" value={prnDoseSheet.time} onChange={(v) => setPrnDoseSheet({ ...prnDoseSheet, time: v })} type="time" />
            <TextArea label="Note (optional)" value={prnDoseSheet.note} onChange={(v) => setPrnDoseSheet({ ...prnDoseSheet, note: v })} placeholder="e.g. headache, mild pain..." />
            <button onClick={savePrnDose} className="w-full mt-2 py-3 rounded-2xl text-sm font-semibold" style={{ background: ds.green, color: '#fff' }}>Log dose</button>
          </>
        )}
      </BottomSheet>

      {/* PRN: Add new med */}
      <BottomSheet open={addingPrn} onClose={() => setAddingPrn(false)} title="Add as-needed medication">
        <Input label="Name" value={newPrn.name} onChange={(v) => setNewPrn({ ...newPrn, name: v })} placeholder="e.g. Paracetamol" />
        <Input label="Default dose (mg)" value={newPrn.doseMg} onChange={(v) => setNewPrn({ ...newPrn, doseMg: v })} type="number" />
        <TextArea label="Note (optional)" value={newPrn.note} onChange={(v) => setNewPrn({ ...newPrn, note: v })} placeholder="e.g. For pain" />
        <button onClick={saveNewPrn} className="w-full mt-3 py-3 rounded-2xl text-sm font-semibold" style={{ background: ds.green, color: '#fff' }}>Save medication</button>
      </BottomSheet>

      {/* PRN: Edit med */}
      <BottomSheet open={!!editingPrn} onClose={savePrnEdit} title="Edit as-needed medication">
        {editingPrn && (
          <>
            <Input label="Name" value={editingPrn.name} onChange={(v) => setEditingPrn({ ...editingPrn, name: v })} />
            <Input label="Default dose (mg)" value={editingPrn.doseMg} onChange={(v) => setEditingPrn({ ...editingPrn, doseMg: v })} type="number" />
            <TextArea label="Note (optional)" value={editingPrn.note || ''} onChange={(v) => setEditingPrn({ ...editingPrn, note: v })} placeholder="e.g. For pain" />
            <button onClick={() => { if (window.confirm('Stop this medication?')) { savePrnMed({ ...editingPrn, active: false }).then(() => loadPrnMeds()).then((m) => { setPrnMeds(m); setEditingPrn(null); showToast('Medication stopped'); }); } }} className="w-full mt-4 py-3 rounded-2xl text-sm" style={{ background: '#fce8e8', color: '#c97070' }}>Stop medication</button>
            <button onClick={() => { if (window.confirm('Remove this medication permanently?')) removePrnMed(editingPrn.id); }} className="w-full mt-2 py-3 rounded-2xl text-sm" style={{ background: '#fce8e8', color: '#c97070' }}>Remove permanently</button>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
