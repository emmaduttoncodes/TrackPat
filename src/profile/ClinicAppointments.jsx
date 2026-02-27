import { useState, useEffect } from 'react';
import { todayStr, formatDate, formatTime, addDays, uid } from '../helpers';
import { ds, inputStyle, labelStyle, tileLabel } from '../styles';
import { buildClinicianReport } from '../reports/clinicianReport';
import { track } from '../analytics';

function ClinicAppointmentDetail({ appointment, onSave, onDelete, onClose, allAppointments, allDays, patientName, transplantDate }) {
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time || '');
  const [questions, setQuestions] = useState(appointment.questions);
  const [notes, setNotes] = useState(appointment.notes);

  const handleExportReport = () => {
    const endDate = date || todayStr();
    // Find the most recent previous appointment by date
    const previousDates = (allAppointments || [])
      .filter(a => a.id !== appointment.id && a.date && a.date < endDate)
      .map(a => a.date)
      .sort();
    const startDate = previousDates.length > 0
      ? previousDates[previousDates.length - 1]
      : transplantDate || addDays(endDate, -30);

    const filteredDays = {};
    Object.entries(allDays || {}).forEach(([d, v]) => {
      if (d >= startDate && d <= endDate) filteredDays[d] = v;
    });
    const sorted = Object.entries(filteredDays).sort(([a], [b]) => a.localeCompare(b));

    const painData = sorted.flatMap(([d, v]) =>
      (v.pain || []).filter(e => Number(e.level) > 0).map(e => ({ label: d, y: Number(e.level) }))
    );
    const activityData = sorted
      .filter(([, v]) => v.activity && v.activity.walkMinutes && v.activity.walkMinutes.length > 0)
      .map(([d, v]) => ({ label: d, y: v.activity.walkMinutes.reduce((s, w) => s + (Number(w.minutes) || 0), 0) }))
      .filter(d => d.y > 0);
    const weightData = sorted
      .filter(([, v]) => v.vitals && v.vitals.weightKg && Number(v.vitals.weightKg) > 0)
      .map(([d, v]) => ({ label: d, y: Number(v.vitals.weightKg) }));
    const moodData = sorted
      .filter(([, v]) => v.mood && v.mood.value != null)
      .map(([d, v]) => ({ label: d, y: v.mood.value }));

    const html = buildClinicianReport({
      patientName: patientName || 'Patient',
      transplantDate,
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
      track('report_generated');
    } else {
      alert('Pop-up blocked. Please allow pop-ups for this site to export the report.');
    }
  };

  const exportDateRange = (() => {
    const endDate = date || todayStr();
    const previousDates = (allAppointments || [])
      .filter(a => a.id !== appointment.id && a.date && a.date < endDate)
      .map(a => a.date)
      .sort();
    const startDate = previousDates.length > 0
      ? previousDates[previousDates.length - 1]
      : transplantDate || addDays(endDate, -30);
    return { startDate, endDate };
  })();

  const save = () => {
    onSave({ ...appointment, date, time, questions, notes });
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: uid(), text: '' }]);
  };
  const updateQuestion = (i, text) => {
    const n = [...questions];
    n[i] = { ...n[i], text };
    setQuestions(n);
  };
  const removeQuestion = (i) => {
    setQuestions(questions.filter((_, j) => j !== i));
  };

  // Auto-save on changes
  useEffect(() => {
    const timeout = setTimeout(save, 400);
    return () => clearTimeout(timeout);
  }, [date, time, questions, notes]);

  return (
    <div className="fixed inset-0 z-50" style={{ background: ds.bg, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '24px 20px 120px', paddingTop: 'calc(24px + env(safe-area-inset-top))', maxWidth: ds.appMaxWidth, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#e8e6e1', color: ds.textMuted, border: 'none',
              fontSize: 18, cursor: 'pointer', flexShrink: 0,
            }}
          >‹</button>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 600, color: ds.text, margin: 0, flex: 1, minWidth: 0 }}>
            {date ? formatDate(date) : 'New appointment'}
          </h2>
          <button
            onClick={() => { onDelete(appointment.id); onClose(); }}
            style={{ fontSize: 13, color: '#c97070', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
          >Delete</button>
        </div>

        {/* Date & Time */}
        <div style={{
          background: ds.card, borderRadius: ds.radiusLg, padding: '16px 18px',
          boxShadow: ds.cardShadow, border: ds.cardBorder, marginBottom: 16,
        }}>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputStyle}
          />
          <label style={{ ...labelStyle, marginTop: 12 }}>Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Questions */}
        <div style={{
          background: ds.card, borderRadius: ds.radiusLg, padding: '16px 18px',
          boxShadow: ds.cardShadow, border: ds.cardBorder, marginBottom: 16,
        }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div style={{ ...tileLabel, color: '#8b9cc7', margin: 0 }}>Questions to ask</div>
            <button
              onClick={addQuestion}
              style={{ fontSize: 13, color: ds.green, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
            >+ Add</button>
          </div>
          {questions.length === 0 && (
            <p style={{ fontSize: 13, color: ds.textPlaceholder, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Tap "+ Add" to prepare questions for your appointment.
            </p>
          )}
          {questions.map((q, i) => (
            <div key={q.id} className="flex gap-2 items-start mb-2">
              <span style={{ fontSize: 12, color: ds.textLight, marginTop: 12, flexShrink: 0 }}>{i + 1}.</span>
              <textarea
                value={q.text}
                onChange={(e) => { updateQuestion(i, e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                placeholder="Type your question…"
                rows={1}
                style={{ ...inputStyle, flex: 1, resize: 'none', overflow: 'hidden' }}
              />
              <button
                onClick={() => removeQuestion(i)}
                style={{ fontSize: 14, color: '#c97070', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, flexShrink: 0 }}
              >×</button>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div style={{
          background: ds.card, borderRadius: ds.radiusLg, padding: '16px 18px',
          boxShadow: ds.cardShadow, border: ds.cardBorder, marginBottom: 16,
        }}>
          <div style={{ ...tileLabel, color: '#7ab8a8', marginBottom: 12 }}>Notes</div>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
            placeholder="Capture notes during or after your appointment…"
            rows={3}
            style={{ ...inputStyle, resize: 'none', overflow: 'hidden' }}
          />
        </div>

        {/* Export report */}
        {allDays && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={handleExportReport}
              style={{
                width: '100%', padding: '16px', borderRadius: ds.radiusMd, border: 'none',
                background: ds.green, color: '#fff', fontSize: 16, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >Export report for clinician</button>
            <p style={{ fontSize: 12, color: ds.textLight, textAlign: 'center', marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
              Covers {formatDate(exportDateRange.startDate)} – {formatDate(exportDateRange.endDate)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClinicAppointmentsView({ appointments, onSave, onClose, allDays, patientName, transplantDate }) {
  const [selectedAppt, setSelectedAppt] = useState(null);

  const sorted = [...appointments].sort((a, b) => {
    const today = todayStr();
    const aFuture = a.date >= today;
    const bFuture = b.date >= today;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    const dateCmp = aFuture
      ? a.date.localeCompare(b.date)
      : b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    return (a.time || '').localeCompare(b.time || '');
  });

  const addAppointment = () => {
    const newAppt = { id: uid(), date: '', time: '', questions: [], notes: '' };
    const updated = [...appointments, newAppt];
    onSave(updated);
    setSelectedAppt(newAppt);
    track('clinic_appointment_added');
  };

  const saveAppointment = (appt) => {
    const updated = appointments.map((a) => a.id === appt.id ? appt : a);
    onSave(updated);
  };

  const deleteAppointment = (id) => {
    const updated = appointments.filter((a) => a.id !== id);
    onSave(updated);
  };

  if (selectedAppt) {
    const current = appointments.find((a) => a.id === selectedAppt.id) || selectedAppt;
    return (
      <ClinicAppointmentDetail
        appointment={current}
        onSave={saveAppointment}
        onDelete={deleteAppointment}
        onClose={() => setSelectedAppt(null)}
        allAppointments={appointments}
        allDays={allDays}
        patientName={patientName}
        transplantDate={transplantDate}
      />
    );
  }

  const today = todayStr();

  return (
    <div className="fixed inset-0 z-50" style={{ background: ds.bg, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '24px 20px 120px', paddingTop: 'calc(24px + env(safe-area-inset-top))', maxWidth: ds.appMaxWidth, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#e8e6e1', color: ds.textMuted, border: 'none',
              fontSize: 18, cursor: 'pointer', flexShrink: 0,
            }}
          >‹</button>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 600, color: ds.text, margin: 0, flex: 1, minWidth: 0 }}>
            Clinic appointments
          </h2>
          <button
            onClick={addAppointment}
            style={{
              fontSize: 14, color: ds.green, background: 'none', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
            }}
          >+ Add</button>
        </div>

        {/* Empty state */}
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📋</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: ds.text, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>No appointments yet</p>
            <p style={{ fontSize: 13, color: ds.textMuted, maxWidth: 260, margin: '0 auto', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
              Tap "+ Add" to schedule an appointment and prepare questions for your clinic visit.
            </p>
          </div>
        )}

        {/* Appointment list */}
        {sorted.map((appt) => {
          const isUpcoming = appt.date >= today;
          const qCount = appt.questions.filter((q) => q.text.trim()).length;
          const hasNotes = appt.notes && appt.notes.trim().length > 0;
          return (
            <div
              key={appt.id}
              onClick={() => { setSelectedAppt(appt); track('clinic_appointment_viewed'); }}
              style={{
                background: ds.card, borderRadius: ds.radiusLg, padding: '14px 16px',
                boxShadow: ds.cardShadow, border: ds.cardBorder, marginBottom: 10,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              }}
              className="active:scale-[0.98]"
            >
              <div style={{
                width: 40, height: 40, borderRadius: ds.radiusSm, flexShrink: 0,
                background: isUpcoming ? ds.greenLight : ds.cardAlt,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {isUpcoming ? '📅' : '✓'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: ds.text, fontFamily: "'DM Sans', sans-serif" }}>
                  {appt.date ? formatDate(appt.date) + (appt.time ? ` at ${formatTime(appt.time)}` : '') : 'No date set'}
                </div>
                <div style={{ fontSize: 12, color: ds.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                  {[
                    qCount > 0 && `${qCount} question${qCount !== 1 ? 's' : ''}`,
                    hasNotes && 'Has notes',
                  ].filter(Boolean).join(' · ') || 'No details yet'}
                </div>
              </div>
              <span style={{ color: ds.textPlaceholder, fontSize: 18 }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
