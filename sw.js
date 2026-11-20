/**
 * LFC ADMIN — Offline Shell Service Worker (sw.js)
 *
 * STRICT SECURITY GUARANTEE:
 * - Caches static UI shell assets ONLY (HTML, CSS, JS, Manifest, Shield Icons, Google Fonts).
 * - NEVER caches any Google Apps Script API response, POST payload, or financial JSON.
 */

const CACHE_NAME = 'lfc-admin-shell-v1.0.0';

const STATIC_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/config.js',
  './js/calc-engine.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png',
  './icons/shield-badge.png'
];

function isSensitiveOrApiRequest(request) {
  if (request.method !== 'GET') return true;
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  if (
    host.includes('script.google.com') ||
    host.includes('googleusercontent.com') ||
    host.includes('googleapis.com') && !host.includes('fonts.googleapis.com')
  ) {
    return true;
  }
  if (
    url.pathname.includes('/api') ||
    url.pathname.endsWith('/exec') ||
    url.searchParams.has('passcode') ||
    url.searchParams.has('action')
  ) {
    return true;
  }
  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never intercept or cache API/financial requests
  if (isSensitiveOrApiRequest(request)) {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFont =
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (!isSameOrigin && !isGoogleFont) {
    return;
  }

  // Network-first for HTML navigation so deployments update cleanly, fallback to cached shell offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Stale-while-revalidate for static UI assets and fonts
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
