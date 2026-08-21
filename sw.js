/* Cambia VERSIONE a ogni aggiornamento: obbliga il telefono a ripulire la cache. */
const VERSIONE = "registro-2026-08-21-1816";
const FILE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSIONE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Prima la rete, la cache solo se non c'è linea: cosi un aggiornamento arriva subito. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copia = r.clone();
        caches.open(VERSIONE).then((c) => c.put(e.request, copia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match("./index.html")))
  );
});
