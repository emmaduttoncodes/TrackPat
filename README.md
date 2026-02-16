# Recovery Log

A calm, offline-first recovery tracking app. Built as an installable PWA with local IndexedDB storage.

## Quick Deploy to Cloudflare Pages

### 1. Push to GitHub

```bash
# Create a new repo on github.com, then:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/recovery-log.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. Connect your GitHub account and select the `recovery-log` repo
3. Set build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Click **Save and Deploy**

Your app will be live at `https://recovery-log.pages.dev` (or custom domain).

### 3. Install on Phone

1. Open the URL in Chrome on Android
2. Chrome will show **"Add to Home Screen"** — tap it
3. The app is now installed and works offline

> **Important:** Installing as a PWA grants persistent storage automatically on Android Chrome, protecting the data from browser cleanup.

## Local Development

```bash
npm install
npm run dev     # Dev server at localhost:5173
npm run build   # Production build to dist/
npm run preview # Preview the production build
```

## Data Storage

All data is stored locally in IndexedDB on the device. Nothing is sent to any server.

- **Persistent storage** is requested on app startup
- **Backup** can be downloaded as JSON via the "Download Backup" button on the Overview tab
- Data survives browser restarts, phone reboots, and app closures
- Data is lost only if: the app is uninstalled, browser data is manually cleared, or the phone is factory reset

## Project Structure

```
src/
  main.jsx    # Entry point, requests persistent storage
  App.jsx     # All UI components
  db.js       # Dexie database, data access helpers, export
  index.css   # Tailwind + global styles
public/
  icon-192.png
  icon-512.png
```
