# TrackPat

A calm, offline-first post-transplant recovery tracker. Built as an installable PWA with local IndexedDB storage — your data never leaves your device.

## Features

### Overview (daily logging)
- **Vitals** — temperature, blood pressure, heart rate, weight
- **Pain** — 0-10 scale with body area tracking
- **Activity** — walk minutes logging
- **Sleep** — hours and quality
- **Appetite & Mood** — thumb/emoji scales with notes
- **Bowel movements** — tracking with notes
- **Symptoms** — checklist (fever, jaundice, nausea, vomiting, swelling, dark urine, reduced urine, abdominal pain, pale stools)
- **Medications** — schedule-based tracking with timed events and archiving
- Day-by-day navigation with encouraging messages

### Trends
- Mini charts for pain, activity, weight, mood and more
- Visual progress over time

### Profile
- Greeting with editable name and days-since-transplant counter
- Logging stats (streak, total days, weekly)
- **Food safety** — lifetime and temporary restrictions with a waiter mode for showing staff at restaurants
- **Clinic appointments** — notes, questions, and exportable clinician reports with charts

### Settings (via cog icon)
- Transplant date
- Backup and restore (JSON export/import)
- About and feedback

### Other
- **Onboarding** — guided setup for first-time users
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

All data is stored locally in IndexedDB. Nothing is sent to any server.

- Data survives browser restarts, phone reboots, and app closures
- Backup can be downloaded as JSON via Settings > Backup data
- Data is lost only if the app is uninstalled, browser data is manually cleared, or the device is factory reset

## Project structure

```
src/
  main.jsx    # Entry point, requests persistent storage
  App.jsx     # All UI components
  db.js       # Dexie database, data access helpers, export/import
  index.css   # Tailwind + global styles
public/
  icon.svg
  icon-192.png
  icon-512.png
```
