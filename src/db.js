import Dexie from 'dexie';

export const db = new Dexie('RecoveryLogDB');

db.version(1).stores({
  days: 'date',                          // Primary key: YYYY-MM-DD
  medSchedules: 'id',                    // Primary key: id
  medEvents: '[date+scheduleId], date',  // Compound key + date index
});

// ─── Default medication schedules ─────────────────────────────────────
const defaultMedSchedules = [
  { id: 'm1', name: 'Tacrolimus', doseMg: '2', time: '08:00', group: 'Morning', active: true },
  { id: 'm2', name: 'Mycophenolate', doseMg: '500', time: '08:00', group: 'Morning', active: true },
  { id: 'm3', name: 'Prednisolone', doseMg: '20', time: '08:00', group: 'Morning', active: true },
  { id: 'm4', name: 'Omeprazole', doseMg: '20', time: '12:00', group: 'Afternoon', active: true },
  { id: 'm5', name: 'Tacrolimus', doseMg: '2', time: '20:00', group: 'Evening', active: true },
  { id: 'm6', name: 'Mycophenolate', doseMg: '500', time: '20:00', group: 'Evening', active: true },
];

// Seed default meds on first run
db.on('populate', (tx) => {
  tx.table('medSchedules').bulkAdd(defaultMedSchedules);
});

// ─── Empty day template ───────────────────────────────────────────────
export const emptyDay = () => ({
  vitals: { temperatureC: '', systolic: '', diastolic: '', heartRate: '', weightKg: '' },
  pain: [],
  activity: { walkMinutes: [], energyThumb: null, note: '' },
  sleep: { hours: '', qualityThumb: null, note: '' },
  appetite: { thumb: null, note: '' },
  mood: { value: null, note: '' },
  bowel: { hadBm: false, note: '' },
  symptoms: {
    fever: false, abdominalPainIncrease: false, jaundice: false, darkUrine: false,
    paleStools: false, reducedUrine: false, swelling: false, nausea: false, vomiting: false, note: '',
  },
});

// ─── Data access helpers ──────────────────────────────────────────────
export async function loadDay(date) {
  const row = await db.days.get(date);
  return row ? row.data : null;
}

export async function saveDay(date, data) {
  await db.days.put({ date, data });
}

export async function loadAllDays() {
  const rows = await db.days.toArray();
  const result = {};
  for (const row of rows) result[row.date] = row.data;
  return result;
}

export async function loadSchedules() {
  return db.medSchedules.toArray();
}

export async function saveSchedule(schedule) {
  await db.medSchedules.put(schedule);
}

export async function deleteSchedule(id) {
  await db.medSchedules.delete(id);
}

export async function loadMedEvents(date) {
  return db.medEvents.where('date').equals(date).toArray();
}

export async function saveMedEvent(event) {
  await db.medEvents.put(event);
}

export async function deleteMedEvent(date, scheduleId) {
  await db.medEvents.delete([date, scheduleId]);
}

// ─── Export all data as JSON ──────────────────────────────────────────
export async function exportAllData() {
  const [days, schedules, events] = await Promise.all([
    db.days.toArray(),
    db.medSchedules.toArray(),
    db.medEvents.toArray(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    days: days.map((d) => ({ date: d.date, ...d.data })),
    medSchedules: schedules,
    medEvents: events,
  };
}
