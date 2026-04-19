// Flamingo Pay Service Worker — offline shell + cache-first + push notifications

const CACHE_NAME = "flamingo-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  "/",
  "/offline.html",
  "/logo-primary.png",
  "/logo-primary.svg",
  "/kaching.wav",
];

// Install: cache the shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigations, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and Chrome extension requests
  if (request.method !== "GET") return;
  if (request.url.startsWith("chrome-extension://")) return;

  // Navigation requests: network first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets: cache first
  if (
    request.url.match(/\.(png|svg|jpg|jpeg|webp|ico|woff2?|css|js|wav)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }
});

// ─── Push notifications ──────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Flamingo Pay",
      body: event.data.text(),
    };
  }

  const options = {
    body: payload.body || "",
    icon: payload.icon || "/logo-primary.png",
    badge: payload.badge || "/logo-primary.png",
    tag: payload.tag || "flamingo-payment",
    renotify: true, // vibrate even if same tag
    vibrate: [200, 100, 200, 100, 200], // ka-ching rhythm
    data: payload.data || {},
    actions: [
      { action: "view", title: "View Dashboard" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Payment received!", options)
  );
});

// Handle notification click — open the merchant dashboard
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const urlPath = event.notification.data?.url || "/merchant/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a Flamingo tab is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes("/merchant") && "focus" in client) {
          client.focus();
          client.navigate(urlPath);
          return;
        }
      }
      // Otherwise open a new tab
      return self.clients.openWindow(urlPath);
    })
  );
});
