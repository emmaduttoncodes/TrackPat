import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { loadAllDays, loadSetting } from './db';
import { todayStr, addDays, formatDate } from './helpers';
import { moodEmojis } from './constants';
import { ds } from './styles';
import { BottomSheet } from './ui';
import { MiniChart } from './reports/MiniChart';
import { buildClinicianReport } from './reports/clinicianReport';
import { track } from './analytics';

export function TrendsPage() {
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
      track('report_generated');
    } else {
      alert('Your browser blocked the report from opening.\n\nTo fix this, look for a "pop-up blocked" notice in your browser\'s address bar and tap "Allow". Then try again.');
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
      <div style={{ padding: '24px 20px', maxWidth: ds.appMaxWidth, margin: '0 auto' }}>
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
            <Activity size={48} stroke="#b5b5b5" strokeWidth={1.5} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: ds.textLight, maxWidth: 280, margin: '0 auto 8px', lineHeight: 1.5 }}>Your charts will appear here once you start logging on the Overview tab.</p>
            <p style={{ fontSize: 13, color: ds.textPlaceholder, maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>You can also export a summary report for your transplant team before clinic visits.</p>
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
