// ─── Helpers ───────────────────────────────────────────────────────────
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatDate = (dateStr) => {
  if (dateStr === todayStr()) return 'Today';
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
};

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const getDayName = (dateStr) => DAY_NAMES[new Date(dateStr + 'T12:00:00').getDay()];

export const formatTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${suffix}`;
};

export const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const uid = () => Math.random().toString(36).slice(2, 9);

export const isWithinSixMonths = (transplantDate) => {
  if (!transplantDate) return true; // safe default — show all restrictions
  const tx = new Date(transplantDate + 'T12:00:00');
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return tx >= sixMonthsAgo;
};

const encouragements = [
  'One day at a time \u{1F496}', "You're doing so well \u{1F49B}", 'Small steps, big courage \u{1F331}',
  'Rest is part of healing \u{1F319}', 'Every day is progress \u{1F4AB}', "You're stronger than you know \u{1F496}",
  'Gentle days count too \u{1F343}', 'Your body is working hard for you \u{1F49B}', 'Be kind to yourself today \u{1F338}',
  'Each morning is a fresh start \u{1F305}', "You've got this, one step at a time \u{1F496}",
  "Healing isn't linear, and that's okay \u{1F33F}", 'The hard days make the good ones sweeter \u{1F4AB}',
  'Taking it slow is still moving forward \u{1F41A}', 'You are so loved \u{1F49B}',
  'Look how far you\'ve come \u{1F33B}', "It's okay to just rest today \u{1F54A}\u{FE0F}",
  "Tomorrow doesn't need you yet \u{1F319}", 'Your strength inspires us \u{1F496}',
  'This chapter is about getting well \u{1F331}',
];

export const getEncouragement = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return encouragements[dayOfYear % encouragements.length];
};
