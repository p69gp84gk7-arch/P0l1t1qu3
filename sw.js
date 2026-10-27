/* Service worker : l'application reste consultable hors connexion
   (dernière version vue), tout en allant toujours chercher la plus récente en ligne. */
const CACHE = "presidentielles-v5";
const COQUILLE = ["./", "index.html", "config.js", "assets/styles.css", "assets/donnees.js", "assets/app.js",
  "assets/demarrage.js", "data/snapshot.json", "manifest.webmanifest", "assets/icone.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) { const copie = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copie)); }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
