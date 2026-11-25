// Service worker del Entrenador ATC: app y temas siempre disponibles; audios guardados al escucharlos o descargarlos.
const V = "atc-3272275fe6";
const AUDIO = "atc-audio-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "audios.json", "icons/icon-180.png", "icons/icon-192.png", "ingles.json.enc", "crypt.json", "temas/tema1.json.enc", "temas/tema10.json.enc", "temas/tema2.json.enc", "temas/tema3.json.enc", "temas/tema4.json.enc", "temas/tema5.json.enc", "temas/tema6.json.enc", "temas/tema7.json.enc", "temas/tema8.json.enc", "temas/tema9.json.enc"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== AUDIO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.endsWith(".mp3.enc")) return; // cifrados: la página los descifra y guarda
  if (url.origin === location.origin && url.pathname.endsWith(".mp3")) {
    // audios: primero el guardado; si no está, se baja y se guarda
    e.respondWith(caches.open(AUDIO).then(c => c.match(url.href).then(hit => hit || fetch(url.href).then(r => { if (r.status === 200) c.put(url.href, r.clone()); return r; }))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(V).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit))));
    return;
  }
  if (url.origin !== location.origin) return;
  // app y datos: red primero (para recibir actualizaciones), con la copia guardada si no hay red o tarda
  e.respondWith(new Promise(resolve => {
    let done = false;
    const fallback = () => caches.match(req, {ignoreSearch: true}).then(hit => { if (!done && hit) { done = true; resolve(hit); } return hit; });
    const t = setTimeout(fallback, 3500);
    fetch(req).then(r => {
      clearTimeout(t);
      if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); }
      if (!done) { done = true; resolve(r); }
    }).catch(() => { clearTimeout(t); fallback().then(hit => { if (!done) { done = true; resolve(hit || new Response("Sin conexión", {status: 503})); } }); });
  }));
});
