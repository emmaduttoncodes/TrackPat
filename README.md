# TrackPat

A calm, offline-first post-transplant recovery tracker. Built as an installable PWA with local IndexedDB storage — your data never leaves your device.

> **Disclaimer:** TrackPat is a personal tracking aid — it does not replace medical advice. Always follow your transplant team's guidance and contact them if you have concerns.

## Features

### Overview (daily logging)
- **Vitals** — temperature, blood pressure, heart rate, weight
- **Pain** — 0-10 scale with location and multiple entries per day
- **Activity** — walk minutes with timestamps and energy level
- **Sleep** — hours and quality
- **Appetite & Mood** — thumb/emoji scales with notes
- **Bowel movements** — tracking with notes
- **Symptoms** — checklist (fever, jaundice, nausea, vomiting, swelling, dark urine, reduced urine, abdominal pain, pale stools)
- Day-by-day navigation with encouraging messages

### Medication
- **Scheduled medications** — time-of-day groups (Morning/Afternoon/Evening/Bedtime), per-day scheduling, food instructions
- **As-needed (PRN) medications** — log doses ad-hoc with timestamps
- **Clinic day alerts** — reminder to hold Tacrolimus before blood tests
- Edit, stop, and restart medications

### Trends
- Interactive mini charts for pain, activity, weight, and mood
- Press-and-hold to inspect individual data points
- **Clinician report export** — generates a printable HTML report with summary stats, mood distribution, trend charts, and a daily log table

### Profile
- Greeting with editable name and days-since-transplant counter
- Logging stats (streak, total days, weekly)
- **Food safety** — lifetime and temporary (first 6 months) dietary restrictions with a waiter mode for showing staff at restaurants
- **Clinic appointments** — prepare questions, capture notes, and export reports covering the period since your last visit

### Settings (via cog icon)
- Transplant date
- Backup and restore (JSON export/import)
- About and feedback

### Other
- **Onboarding** — guided setup for first-time users with medical disclaimer
- **Accessible bottom sheets** — keyboard-navigable with focus trap, Escape to close, and ARIA attributes
- **Toast notifications** — save confirmations and error feedback
- **Offline-first** — works without internet after install
- **Persistent storage** — requested on startup to protect data from browser cleanup

## Deploy to Cloudflare Pages

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/TrackPat.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) > **Workers & Pages** > **Create**
2. Connect your GitHub account and select the repo
3. Set build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Click **Save and Deploy**

### 3. Install on phone

1. Open the URL in your mobile browser
2. Tap **"Add to Home Screen"** when prompted
3. The app is now installed and works offline

> **Note:** Installing as a PWA grants persistent storage automatically on Android Chrome, protecting data from browser cleanup.

## Local development

```bash
npm install
npm run dev     # Dev server at localhost:5173
npm run build   # Production build to dist/
npm run preview # Preview the production build
```

## Tech stack

- React 18 + Vite
- Tailwind CSS
- Dexie (IndexedDB wrapper)
- lucide-react (icons)
- vite-plugin-pwa (service worker)

## Data storage

All data is stored locally in IndexedDB via Dexie. Nothing is sent to any server.

- Data survives browser restarts, phone reboots, and app closures
- Backup can be downloaded as JSON via Settings > Backup data
- Data is lost only if the app is uninstalled, browser data is manually cleared, or the device is factory reset

### Database schema

| Store | Key | Description |
|-------|-----|-------------|
| `days` | `date` (YYYY-MM-DD) | Daily health entries (vitals, pain, sleep, mood, etc.) |
| `medSchedules` | `id` | Medication schedule definitions |
| `medEvents` | `[date+scheduleId]` | Medication taken/skipped events |
| `prnMeds` | `id` | As-needed medication definitions |
| `prnDoses` | `++id` (auto) | Individual PRN dose logs |
| `settings` | `key` | Key-value store (name, transplant date, appointments) |

## Project structure

```
src/
  main.jsx             Entry point, requests persistent storage
  App.jsx              App shell — routing, state, onboarding
  db.js                Dexie database schema, CRUD helpers, export/import
  index.css            Tailwind imports + global styles

  helpers.js           Date formatting, encouragements, utilities
  constants.js         Moods, symptom labels, food restrictions
  styles.js            Design tokens (colours, radii, shadows)
  analytics.js         Event tracking

  ui.jsx               Toast, BottomSheet, Field, Input, TextArea, ThumbPicker
  BottomNav.jsx        Bottom tab navigation
  tiles.jsx            Dashboard tile components (Vitals, Mood, Sleep, Pain, Activity, Symptoms)
  sheets.jsx           Bottom sheet forms for each daily metric

  MedicationTab.jsx    Medication scheduling and dose logging
  TrendsPage.jsx       Charts and clinician report export
  ProfilePage.jsx      Profile, stats, and sub-view navigation

  reports/
    MiniChart.jsx          Interactive SVG trend charts
    clinicianReport.js     Printable HTML report builder

  profile/
    FoodSafetyView.jsx         Dietary restrictions + waiter mode
    ClinicAppointments.jsx     Appointment detail + list views
    SettingsView.jsx           Transplant date, backup/restore, about

public/
  icon.svg
  icon-192.png
  icon-512.png
```
