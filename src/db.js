import Dexie from 'dexie';

export const db = new Dexie('RecoveryLogDB');

db.version(1).stores({
  days: 'date',                          // Primary key: YYYY-MM-DD
  medSchedules: 'id',                    // Primary key: id
  medEvents: '[date+scheduleId], date',  // Compound key + date index
});

// v2: add foodInstruction to existing medication schedules
db.version(2).stores({
  days: 'date',
  medSchedules: 'id',
  medEvents: '[date+scheduleId], date',
}).upgrade((tx) => {
  const foodDefaults = {
    Tacrolimus: 'before', Mycophenolate: 'before',
    Prednisolone: 'with', Omeprazole: 'before',
  };
  return tx.table('medSchedules').toCollection().modify((med) => {
    if (!med.foodInstruction) {
      med.foodInstruction = foodDefaults[med.name] || '';
    }
  });
});

// v3: add settings table
db.version(3).stores({
  days: 'date',
  medSchedules: 'id',
  medEvents: '[date+scheduleId], date',
  settings: 'key',
});

// v4: add as-needed (PRN) medication tables
db.version(4).stores({
  days: 'date',
  medSchedules: 'id',
  medEvents: '[date+scheduleId], date',
  settings: 'key',
  prnMeds: 'id',
  prnDoses: '++id, date',
});

// ─── Default medication schedules ─────────────────────────────────────
const defaultMedSchedules = [
  { id: 'm1', name: 'Tacrolimus', doseMg: '2', time: '08:00', group: 'Morning', active: true, foodInstruction: 'before' },
  { id: 'm2', name: 'Mycophenolate', doseMg: '500', time: '08:00', group: 'Morning', active: true, foodInstruction: 'before' },
  { id: 'm3', name: 'Prednisolone', doseMg: '20', time: '08:00', group: 'Morning', active: true, foodInstruction: 'with' },
  { id: 'm4', name: 'Omeprazole', doseMg: '20', time: '12:00', group: 'Afternoon', active: true, foodInstruction: 'before' },
  { id: 'm5', name: 'Tacrolimus', doseMg: '2', time: '20:00', group: 'Evening', active: true, foodInstruction: 'before' },
  { id: 'm6', name: 'Mycophenolate', doseMg: '500', time: '20:00', group: 'Evening', active: true, foodInstruction: 'before' },
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

// ─── PRN (as-needed) medication helpers ──────────────────────────────
export async function loadPrnMeds() {
  return db.prnMeds.toArray();
}

export async function savePrnMed(med) {
  await db.prnMeds.put(med);
}

export async function deletePrnMed(id) {
  await db.prnMeds.delete(id);
}

export async function loadPrnDoses(date) {
  return db.prnDoses.where('date').equals(date).toArray();
}

export async function addPrnDose(dose) {
  await db.prnDoses.add(dose);
}

export async function deletePrnDose(id) {
  await db.prnDoses.delete(id);
}

// ─── Settings helpers ────────────────────────────────────────────────
export async function loadSetting(key) {
  const row = await db.settings.get(key);
  return row ? row.value : null;
}

export async function saveSetting(key, value) {
  await db.settings.put({ key, value });
}

// ─── Import all data from JSON ────────────────────────────────────────
export async function importAllData(data) {
  await db.transaction('rw', db.days, db.medSchedules, db.medEvents, db.settings, db.prnMeds, db.prnDoses, async () => {
    await db.days.clear();
    await db.medSchedules.clear();
    await db.medEvents.clear();
    await db.settings.clear();
    await db.prnMeds.clear();
    await db.prnDoses.clear();

    if (data.days && data.days.length) {
      await db.days.bulkAdd(data.days.map((d) => {
        const { date, ...rest } = d;
        // Guard against already-nested data shape
        const dayData = rest.data && typeof rest.data === 'object' && !Array.isArray(rest.data)
          ? rest.data
          : rest;
        return { date, data: dayData };
      }));
    }
    if (data.medSchedules && data.medSchedules.length) {
      await db.medSchedules.bulkAdd(data.medSchedules);
    }
    if (data.medEvents && data.medEvents.length) {
      await db.medEvents.bulkAdd(data.medEvents);
    }
    if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
      const entries = Object.entries(data.settings).map(([key, value]) => ({ key, value }));
      if (entries.length) await db.settings.bulkAdd(entries);
    }
    if (data.prnMeds && data.prnMeds.length) {
      await db.prnMeds.bulkAdd(data.prnMeds);
    }
    if (data.prnDoses && data.prnDoses.length) {
      await db.prnDoses.bulkAdd(data.prnDoses);
    }
  });
}

// ─── Export all data as JSON ──────────────────────────────────────────
export async function exportAllData() {
  const [days, schedules, events, settings, prnMeds, prnDoses] = await Promise.all([
    db.days.toArray(),
    db.medSchedules.toArray(),
    db.medEvents.toArray(),
    db.settings.toArray(),
    db.prnMeds.toArray(),
    db.prnDoses.toArray(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    days: days.map((d) => ({ date: d.date, ...d.data })),
    medSchedules: schedules,
    medEvents: events,
    settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    prnMeds,
    prnDoses,
  };
}
