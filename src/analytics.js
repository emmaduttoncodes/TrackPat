// Lightweight wrapper around Umami analytics.
// Fails silently if Umami isn't loaded (e.g. ad blocker, offline).
// Never sends health data — only anonymous feature-usage signals.
// Queues events when offline and flushes when back online.

const QUEUE_KEY = 'umami_queue';

function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}

function saveQueue(queue) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
}

function flush() {
  const queue = getQueue();
  if (!queue.length || !window.umami) return;
  saveQueue([]);
  queue.forEach((name) => {
    try { window.umami.track(name); } catch {}
  });
}

export function track(eventName) {
  if (!navigator.onLine || !window.umami) {
    const queue = getQueue();
    queue.push(eventName);
    saveQueue(queue);
    return;
  }
  try { window.umami.track(eventName); } catch {}
}

window.addEventListener('online', flush);
