import { todayStr, formatDate } from '../helpers';
import { symptomLabels, moodEmojis } from '../constants';

export function buildReportSvgChart(data, color, title, yMin, yMax, formatY) {
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

export function buildClinicianReport({ patientName, transplantDate, startDate, endDate, days, painData, activityData, weightData, moodData }) {
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
    This report was generated from patient-reported data collected via Transplant Log. It is intended to support clinical discussion and should not replace clinical assessment.
  </div>
</div>
</body>
</html>`;
}
