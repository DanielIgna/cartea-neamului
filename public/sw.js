/*
 * Cartea Neamului pe telefon: un service worker mic, care nu ține nimic din arbore în memorie.
 * Doar când telefonul n-are internet, în locul paginii cerute arată o pagină care spune asta, cu un buton de reîncercare.
 * Tot restul merge direct la site, ca înainte.
 */
const CACHE = "cartea-neamului-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/icons/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.mode !== "navigate") return;
  event.respondWith(fetch(req).catch(() => caches.match(OFFLINE).then((r) => r || Response.error())));
});
