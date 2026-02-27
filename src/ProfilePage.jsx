import { useState, useEffect, useRef } from 'react';
import { User, Settings } from 'lucide-react';
import { loadSetting, saveSetting, loadAllDays } from './db';
import { todayStr, formatDate, formatTime, addDays, isWithinSixMonths } from './helpers';
import { ds } from './styles';
import { FoodSafetyView } from './profile/FoodSafetyView';
import { ClinicAppointmentsView } from './profile/ClinicAppointments';
import { SettingsView } from './profile/SettingsView';
import { track } from './analytics';

export function ProfilePage({ onExport, onImport, showToast }) {
  const [transplantDate, setTransplantDate] = useState('');
  const [name, setName] = useState('Friend');
  const [editingName, setEditingName] = useState(false);
  const [showFoodSafety, setShowFoodSafety] = useState(false);
  const [showClinicAppts, setShowClinicAppts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [clinicAppts, setClinicAppts] = useState([]);
  const [allDays, setAllDays] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      loadSetting('transplantDate'),
      loadSetting('userName'),
      loadSetting('clinicAppointments'),
      loadAllDays(),
    ]).then(([txDate, storedName, appts, days]) => {
      if (txDate) setTransplantDate(txDate);
      if (storedName) setName(storedName);
      if (appts) setClinicAppts(appts);
      setAllDays(days);
      setLoaded(true);
    });
  }, []);

  const handleDateChange = async (value) => {
    setTransplantDate(value);
    try {
      await saveSetting('transplantDate', value);
      showToast('Transplant date saved');
    } catch {
      showToast('Failed to save transplant date');
    }
  };

  const handleNameSave = async () => {
    const trimmed = name.trim() || 'Friend';
    setName(trimmed);
    setEditingName(false);
    try {
      await saveSetting('userName', trimmed);
    } catch {
      showToast('Failed to save name');
    }
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
      <div style={{ padding: '24px 20px', position: 'relative', maxWidth: ds.appMaxWidth, margin: '0 auto' }}>
        {/* Settings cog */}
        <button
          onClick={() => { setShowSettings(true); track('settings_opened'); }}
          style={{
            position: 'absolute', top: 24, right: 20, background: 'none', border: 'none',
            cursor: 'pointer', padding: 4, zIndex: 1,
          }}
          aria-label="Settings"
        >
          <Settings size={20} stroke={ds.textMuted} strokeWidth={1.8} />
        </button>

        {/* Greeting header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
            background: ds.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={30} stroke={ds.green} strokeWidth={1.8} />
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

        {/* Food safety */}
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: '#a5a5a5', marginBottom: 8, paddingLeft: 4, fontFamily: "'DM Sans', sans-serif" }}>
          Health reference
        </div>
        <div
          onClick={() => { setShowFoodSafety(true); track('food_safety_opened'); }}
          style={{
            background: ds.card, borderRadius: ds.radiusLg, padding: '14px 16px',
            boxShadow: ds.cardShadow, border: ds.cardBorder, marginBottom: 16,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
          }}
          className="active:scale-[0.98]"
        >
          <span style={{ fontSize: 24 }}>🍽️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: ds.text, fontFamily: "'DM Sans', sans-serif" }}>Food safety</div>
            <div style={{ fontSize: 12, color: ds.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              {isWithinSixMonths(transplantDate)
                ? 'Extra precautions — first 6 months'
                : 'Lifetime restrictions apply'}
            </div>
          </div>
          <span style={{ color: ds.textPlaceholder, fontSize: 18 }}>›</span>
        </div>

        {/* Clinic appointments */}
        <div
          onClick={() => setShowClinicAppts(true)}
          style={{
            background: ds.card, borderRadius: ds.radiusLg, padding: '14px 16px',
            boxShadow: ds.cardShadow, border: ds.cardBorder, marginBottom: 16,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
          }}
          className="active:scale-[0.98]"
        >
          <span style={{ fontSize: 24 }}>📋</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: ds.text, fontFamily: "'DM Sans', sans-serif" }}>Clinic appointments</div>
            <div style={{ fontSize: 12, color: ds.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              {(() => {
                const today = todayStr();
                const upcoming = clinicAppts.filter((a) => a.date >= today).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
                if (upcoming.length === 0) return 'No upcoming appointments';
                const next = upcoming[0];
                return `Next: ${formatDate(next.date)}${next.time ? ` at ${formatTime(next.time)}` : ''}`;
              })()}
            </div>
          </div>
          <span style={{ color: ds.textPlaceholder, fontSize: 18 }}>›</span>
        </div>

        {showFoodSafety && (
          <FoodSafetyView transplantDate={transplantDate} onClose={() => setShowFoodSafety(false)} />
        )}
        {showClinicAppts && (
          <ClinicAppointmentsView
            appointments={clinicAppts}
            onSave={async (updated) => {
              setClinicAppts(updated);
              try { await saveSetting('clinicAppointments', updated); }
              catch { showToast('Failed to save appointments'); }
            }}
            onClose={() => setShowClinicAppts(false)}
            allDays={allDays}
            patientName={name}
            transplantDate={transplantDate}
          />
        )}
        {showSettings && (
          <SettingsView
            transplantDate={transplantDate}
            onDateChange={handleDateChange}
            onExport={onExport}
            onImport={onImport}
            fileInputRef={fileInputRef}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
}
