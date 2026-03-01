import { useState, useEffect, useCallback, useRef } from 'react';
import {
  emptyDay, loadDay, saveDay, loadAllDays, loadSchedules,
  loadMedEvents, exportAllData, importAllData, loadSetting, saveSetting,
  loadPrnMeds, loadPrnDoses,
} from './db';
import { todayStr, formatDate, addDays, getEncouragement } from './helpers';
import { ds } from './styles';
import { Toast, BottomSheet, Field } from './ui';
import { BottomNav } from './BottomNav';
import { VitalsTile, MoodTile, SleepTile, PainTile, ActivityTile, SmallTile, SymptomsTile } from './tiles';
import { VitalsSheet, PainSheet, ActivitySheet, SleepSheet, AppetiteSheet, MoodSheet, BowelSheet, SymptomsSheet } from './sheets';
import { MedicationTab } from './MedicationTab';
import { TrendsPage } from './TrendsPage';
import { ProfilePage } from './ProfilePage';
import { inputStyle } from './styles';
import { track } from './analytics';

// ─── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('overview');
  const [currentDate, setCurrentDate] = useState(todayStr());
  const [tab, setTab] = useState('overview');
  const [dayData, setDayData] = useState(emptyDay());
  const [isDayEmpty, setIsDayEmpty] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [medEvents, setMedEvents] = useState([]);
  const [prnMeds, setPrnMeds] = useState([]);
  const [prnDoses, setPrnDoses] = useState([]);
  const [clinicAppts, setClinicAppts] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [profileKey, setProfileKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingDate, setOnboardingDate] = useState('');

  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2000);
  }, []);

  useEffect(() => {
    return () => clearTimeout(toastTimer.current);
  }, []);

  // Scroll to top when switching pages
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  // Load data when date changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [day, scheds, evts, prns, prnD, appts] = await Promise.all([
        loadDay(currentDate),
        loadSchedules(),
        loadMedEvents(currentDate),
        loadPrnMeds(),
        loadPrnDoses(currentDate),
        loadSetting('clinicAppointments'),
      ]);
      if (cancelled) return;
      setDayData(day || emptyDay());
      setIsDayEmpty(!day);
      setSchedules(scheds);
      setMedEvents(evts);
      setPrnMeds(prns);
      setPrnDoses(prnD);
      setClinicAppts(appts || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [currentDate]);

  // Check for first-time user → show onboarding
  useEffect(() => {
    loadSetting('userName').then((name) => {
      if (!name) setShowOnboarding(true);
    });
  }, []);

  const completeOnboarding = async () => {
    const trimmed = onboardingName.trim() || 'Friend';
    try {
      await saveSetting('userName', trimmed);
      if (onboardingDate) await saveSetting('transplantDate', onboardingDate);
      setShowOnboarding(false);
      track('onboarding_completed');
    } catch {
      showToast('Failed to save — please try again');
    }
  };

  // Auto-save day data to IndexedDB
  const updateDay = useCallback((section, value) => {
    setDayData((prev) => {
      const updated = { ...prev, [section]: value };
      saveDay(currentDate, updated).catch(() => showToast('Failed to save — please try again'));
      setIsDayEmpty(false);
      track('overview_' + section);
      return updated;
    });
  }, [currentDate, showToast]);

  const isClinicDay = (clinicAppts || []).some(a => a.date === currentDate);
  const hasTacrolimus = schedules.some(s => s.name.toLowerCase() === 'tacrolimus' && s.active);

  const canGoForward = currentDate < todayStr();

  // Export backup
  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recovery-log-backup-${todayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup downloaded');
      track('backup_exported');
    } catch {
      showToast('Failed to export backup');
    }
  };

  const handleImport = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version || !Array.isArray(data.days) || !Array.isArray(data.medSchedules)) {
        showToast('Invalid backup file');
        return;
      }
      if (!window.confirm('Restore from this backup? This will replace all current data.')) return;
      await importAllData(data);
      // Reload current state
      const [day, scheds, evts, prns, prnD] = await Promise.all([
        loadDay(currentDate),
        loadSchedules(),
        loadMedEvents(currentDate),
        loadPrnMeds(),
        loadPrnDoses(currentDate),
      ]);
      setDayData(day || emptyDay());
      setIsDayEmpty(!day);
      setSchedules(scheds);
      setMedEvents(evts);
      setPrnMeds(prns);
      setPrnDoses(prnD);
      setProfileKey((k) => k + 1);
      showToast('Backup restored');
      track('backup_restored');
    } catch {
      showToast('Failed to restore backup');
    }
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
    <div className="min-h-screen" style={{ background: ds.bg, fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>
    <div style={{ maxWidth: ds.appMaxWidth, margin: '0 auto' }}>
      <Toast message={toastMsg} />

      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: ds.bg }}>
          <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
              <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 26, fontWeight: 700, color: ds.text, margin: '0 0 8px', whiteSpace: 'nowrap' }}>Welcome to Transplant Log</h1>
              <p style={{ fontSize: 14, color: ds.textMuted, lineHeight: 1.5, margin: 0 }}>
                A simple daily log to support your recovery journey after transplant.
              </p>
            </div>
            <div style={{
              background: ds.cardAlt, borderRadius: ds.radiusSm, padding: '12px 14px',
              marginBottom: 20, border: `1px solid ${ds.border}`,
            }}>
              <div style={{ fontSize: 13, color: ds.textMuted, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
                This app is a personal tracking aid — it does not replace medical advice. Always follow your transplant team's guidance and contact them if you have concerns.
              </div>
            </div>
            <div style={{
              background: ds.card, borderRadius: ds.radiusLg, padding: '20px 18px',
              boxShadow: ds.cardShadow, border: ds.cardBorder,
            }}>
              <Field label="Your name">
                <input
                  autoFocus
                  value={onboardingName}
                  onChange={(e) => setOnboardingName(e.target.value)}
                  placeholder="e.g. Pat"
                  style={inputStyle}
                />
              </Field>
              <Field label="Transplant date (optional)">
                <input
                  type="date"
                  value={onboardingDate}
                  onChange={(e) => setOnboardingDate(e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <button
                onClick={completeOnboarding}
                style={{
                  width: '100%', padding: '14px', borderRadius: ds.radiusMd, border: 'none',
                  background: ds.green, color: '#fff', fontSize: 16, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: 8,
                }}
              >Get started</button>
            </div>
          </div>
        </div>
      )}

      {page === 'overview' && (
        <div>
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
                  onClick={() => { setTab(t); track('tab_' + t); }}
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
                {isClinicDay && hasTacrolimus && (
                  <div style={{ background: ds.amberGradient, borderRadius: ds.radiusLg, padding: '16px 20px' }}>
                    <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                      Clinic day — hold Tacrolimus
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                      Don't take Tacrolimus before your appointment. Bring it with you and take it after your blood test.
                    </div>
                  </div>
                )}
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
              <MedicationTab schedules={schedules} setSchedules={setSchedules} events={medEvents} setEvents={setMedEvents} prnMeds={prnMeds} setPrnMeds={setPrnMeds} prnDoses={prnDoses} setPrnDoses={setPrnDoses} currentDate={currentDate} showToast={showToast} isClinicDay={isClinicDay} />
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
      {page === 'profile' && <ProfilePage key={profileKey} onExport={handleExport} onImport={handleImport} showToast={showToast} />}

      {/* Spacer for bottom nav */}
      <div style={{ height: 72 }} />

      <BottomNav page={page} setPage={(p) => { if (p === 'overview') setCurrentDate(todayStr()); setPage(p); track('tab_' + p); }} />
    </div>
    </div>
  );
}
