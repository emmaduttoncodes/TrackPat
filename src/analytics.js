// Lightweight wrapper around Umami analytics.
// Fails silently if Umami isn't loaded (e.g. ad blocker, offline).
// Never sends health data — only anonymous feature-usage signals.

export function track(eventName) {
  try { window.umami?.track(eventName); } catch {}
}
