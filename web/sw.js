// Bhasha service worker: app shell precached; audio cached on first play (or all at once via "download audio").
const VERSION = "1.0.1";
const SHELL = `bhasha-shell-${VERSION}`;
const AUDIO = "bhasha-audio-v1";
const SHELL_FILES = [
  "./", "index.html", "manifest.webmanifest", "css/app.css",
  "js/app.js", "js/core.js", "js/content.js", "js/i18n.js",
  "icons/icon-64.png", "icons/icon-192.png", "icons/icon-512.png", "icons/favicon.png",
  "audio/index.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("bhasha-shell-") && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // Audio and fonts: cache first; they never change for a given file name.
  if (url.pathname.includes("/audio/") && url.pathname.endsWith(".mp3") || url.pathname.includes("/fonts/")) {
    e.respondWith(
      caches.open(AUDIO).then(async (c) => {
        const hit = await c.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok) c.put(e.request, res.clone());
        return res;
      })
    );
    return;
  }
  // App shell and data: network first so updates arrive, cache as offline fallback.
  e.respondWith(
    fetch(e.request)
      .then((res) => { if (res.ok) caches.open(SHELL).then((c) => c.put(e.request, res.clone())); return res; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});

// The page can ask to cache every audio file for one language/voice for offline use.
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "cache-audio" && Array.isArray(e.data.urls)) {
    e.waitUntil(caches.open(AUDIO).then((c) => Promise.all(e.data.urls.map((u) => c.add(u).catch(() => null)))));
  }
});
