// ─── Shared Constants ─────────────────────────────────────────────────
export const moods = [
  { value: 1, emoji: '😞' }, { value: 2, emoji: '🙁' }, { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' }, { value: 5, emoji: '😄' },
];

export const symptomLabels = {
  fever: 'Fever', abdominalPainIncrease: 'Abdominal pain increase', jaundice: 'Jaundice',
  darkUrine: 'Dark urine', paleStools: 'Pale stools', reducedUrine: 'Reduced urine output',
  swelling: 'Swelling', nausea: 'Nausea', vomiting: 'Vomiting',
};

export const FOOD_RESTRICTIONS = {
  lifetime: [
    { name: 'Grapefruit & grapefruit juice', reason: 'Drug interactions with immunosuppressants', icon: '🍊' },
    { name: 'Seville oranges & marmalade', reason: 'Drug interactions with immunosuppressants', icon: '🍊' },
    { name: 'Pomelo', reason: 'Drug interactions with immunosuppressants', icon: '🍈' },
    { name: 'Pomegranate & pomegranate juice', reason: 'Drug interactions with immunosuppressants', icon: '🍎' },
    { name: 'Excess lime juice', reason: 'Drug interactions with immunosuppressants', icon: '🍋' },
    { name: 'Earl Grey tea (max 2 cups/day)', reason: 'Bergamot interacts with immunosuppressants', icon: '🫖' },
    { name: 'Star fruit', reason: 'Toxicity risk for transplant patients', icon: '⭐' },
    { name: "St John's Wort", reason: 'Alters immunosuppressant levels', icon: '🌿' },
    { name: 'Herbal supplements without doctor approval', reason: 'May alter immunosuppressant levels', icon: '💊' },
    { name: 'Alcohol', reason: 'Hepatotoxic to transplanted liver', icon: '🍷' },
    { name: 'Raw/undercooked shellfish', reason: 'Infection risk while immunocompromised', icon: '🦪' },
    { name: 'Undercooked pork & sausages', reason: 'Hepatitis E risk (lifelong)', icon: '🥩' },
    { name: 'Unpasteurised dairy', reason: 'Ongoing infection risk', icon: '🧀' },
    { name: 'Excessive liquorice', reason: 'Compounds medication side effects', icon: '🍬' },
  ],
  temporary: [
    { name: 'Raw/undercooked eggs', reason: 'Salmonella risk', icon: '🥚' },
    { name: 'Raw/undercooked meat', reason: 'Parasites and bacterial risk', icon: '🥩' },
    { name: 'Raw/undercooked fish & sushi', reason: 'Parasites and bacterial risk', icon: '🐟' },
    { name: 'Smoked salmon', reason: 'Listeria risk', icon: '🐠' },
    { name: 'Uncooked cured meats (salami, Parma ham)', reason: 'Listeria risk', icon: '🥓' },
    { name: 'Deli counter meats & salads', reason: 'Listeria risk', icon: '🥗' },
    { name: 'Rotisserie chicken', reason: 'Bacterial risk if not freshly cooked', icon: '🍗' },
    { name: 'Unpasteurised pate', reason: 'Listeria risk', icon: '🍖' },
    { name: 'Uncooked soft/blue cheese (brie, camembert)', reason: 'Listeria risk', icon: '🧀' },
    { name: 'Unpasteurised milk, yoghurt & juices', reason: 'Listeria risk', icon: '🧃' },
    { name: 'Live probiotic supplements', reason: 'Infection risk while immunocompromised', icon: '💊' },
    { name: 'Soft or homemade ice cream', reason: 'Bacterial risk', icon: '🍦' },
    { name: 'Honey (unless cooked)', reason: 'Bacterial risk', icon: '🍯' },
    { name: 'Raw sprouts', reason: 'Contamination risk', icon: '🌱' },
    { name: 'Unwashed raw fruit & veg', reason: 'Contamination risk', icon: '🥬' },
    { name: 'Buffet/leftover food left out', reason: 'Bacterial growth risk', icon: '🍱' },
    { name: 'Raw fermented foods', reason: 'Bacterial risk', icon: '🫙' },
  ],
};

export const moodEmojis = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };
