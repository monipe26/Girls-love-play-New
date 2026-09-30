// Service worker de Girls Love Play (necesario para poder instalar la página como app).
// - HTML: primero internet; si no hay conexión, muestra la última versión guardada (o el inicio).
// - CSS, JS, imágenes e íconos propios: se sirven rápido desde la memoria y se actualizan solos.
// - No toca /admin/, /api/, pedidos que no sean GET ni contenido de otros sitios (YouTube, etc.).
const VERSION = "glp-v3";
const PRECARGA = ["/", "/manifest.webmanifest", "/assets/icons/icon-192.png", "/assets/icons/icon-512.png", "/css/base.css", "/css/components.css", "/css/home.css", "/css/responsive.css"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECARGA).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return;

  // Páginas: red primero
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put(pedido, copia));
          return respuesta;
        })
        .catch(() => caches.match(pedido).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Archivos estáticos: rápido desde memoria y se refresca de fondo
  evento.respondWith(
    caches.match(pedido).then((guardado) => {
      const red = fetch(pedido)
        .then((respuesta) => {
          if (respuesta && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(VERSION).then((cache) => cache.put(pedido, copia));
          }
          return respuesta;
        })
        .catch(() => guardado);
      return guardado || red;
    })
  );
});
