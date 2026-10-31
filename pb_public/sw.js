/* Service worker: l'app si apre anche senza rete (es. al mercato).
   - file dell'app: risposta dalla cache, aggiornata in background (il nuovo deploy si vede alla riapertura successiva)
   - foto delle ricette e font: cache al primo uso
   - API di PocketBase: sempre dalla rete (la coda offline la gestisce app.js) */
const SHELL = "cucinario-shell-v3", RUNTIME = "cucinario-runtime-v1";
// niente "index.html": PocketBase lo redirige a "./" e una risposta rediretta non si può usare per aprire la pagina
const FILES = ["./", "app.css", "app.js", "manifest.json", "vendor/pocketbase.umd.js", "ciqual.json",
  "icons/icon.svg", "icons/icon-192.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function cacheFirst(req) {
  return caches.open(RUNTIME).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === "opaque") c.put(req, res.clone());
    return res;
  })));
}

function staleWhileRevalidate(req, key) {
  return caches.open(SHELL).then(c => c.match(key || req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(res => {
      if (res.ok) c.put(key || req, res.clone());
      return res;
    });
    if (hit) { net.catch(() => {}); return hit; }
    return net;
  }));
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    if (url.pathname.startsWith("/api/files/")) return e.respondWith(cacheFirst(req));
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_/")) return;
    if (req.mode === "navigate") return e.respondWith(staleWhileRevalidate(req, "./"));
    return e.respondWith(staleWhileRevalidate(req));
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    return e.respondWith(cacheFirst(req));
  }
});
