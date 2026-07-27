/* ─────────────────────────────────────────────────────────────
   Step by Step Kiosk — Service Worker
   Cache-first. Load once on a good connection and the whole kiosk
   runs in a field with no signal for three days.

   Bump CACHE_VERSION whenever the precache list or any cached file
   changes, so devices pick up the new copy on next load.
   ───────────────────────────────────────────────────────────── */
const CACHE_VERSION = 'sbs-kiosk-v54';

/* Everything the kiosk needs to run fully offline.
   The video is cached here (never base64'd into the HTML). */
const PRECACHE = [
  './',
  './index.html',
  './game.html',
  './project/assets/stand-up-magazine.jpg',
  './FCF-2026.html',
  './New_Forest_Show_Kiosk_Video_1080p.mp4',
  './manifest.webmanifest',

  // Brand / shared assets
  './project/assets/logo-primary-white.png',
  './project/assets/logo-secondary-white.png',
  './project/assets/logo-fostering.jpg',
  './project/assets/qr-code.png',
  './project/assets/qr-donate.png',
  './project/assets/the-montagu-arms-exterior.jpg',

  // Home tile photos
  './project/assets/charlie-room.jpg',
  './project/assets/fern-2yp.jpg',
  './project/assets/opportunities-riv.jpg',
  './project/assets/Abseil-_26.jpg',
  './project/assets/georgie-cooking.jpg',

  // Tile 4 event photos
  './project/assets/event-marathon.jpg',
  './project/assets/event-tough-mudder.jpg',
  './project/assets/event-great-south-run.jpg',
  './project/assets/event-fire-walk.jpg',
  './project/assets/event-skydive.jpg',
  './project/assets/event-go-the-distance.jpg',
  './project/assets/jess-portrait-small.jpg',
  './project/assets/lorraine-portrait-small.jpg',
  './project/assets/anne-portrait-small.jpg',
  './project/assets/holly-portrait-small.jpg',

  // Tile 2 volunteer photos
  './project/assets/New_Forest_Committee.jpeg',
  './project/assets/volunteer-young-festival-original.jpg',
  './project/assets/reception-candidate-original.jpg',
  './project/assets/Garden_cleanup_basingstoke.jpg',
  './project/assets/volunteer-hero-original.jpg',
  './project/assets/aldershot-exterior-original.jpg',

  // FCF fostering content assets (ported section, phase 2)
  './project/assets/photo-can-i-foster.jpg',
  './project/assets/photo-luke-child.jpg',
  './project/assets/photo-mum-daughter.jpg',
  './project/assets/photo-foster-hug.jpg',
  './project/assets/carer-laura.jpg',
  './project/assets/carer-debbie.png',
  './project/assets/carer-hannah-mark.jpg',
  './project/assets/carer-dave.png'
];

/* Install: cache each item individually so one 404 can't abort the
   whole install (addAll is atomic and would fail the lot). */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok || res.type === 'opaque') await cache.put(url, res);
      } catch (e) {
        // Missing asset (e.g. not added yet) — skip, don't fail install.
        console.warn('[sw] precache skipped:', url);
      }
    }));
    self.skipWaiting();
  })());
});

/* Activate: drop old caches. */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* Fetch: cache-first for same-origin GETs. Serve from cache, fall back
   to network, and cache what the network returns for next time.

   ActiveCampaign POSTs (proc.php) and any cross-origin request are left
   to the network untouched — the entry queue handles offline submission. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(req, res.clone());
      }
      return res;
    } catch (e) {
      // Offline and not cached. For navigations, fall back to the shell.
      if (req.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw e;
    }
  })());
});

/* Let the page trigger an immediate takeover after an update. */
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
