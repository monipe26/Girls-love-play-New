// Registrar el Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("No se pudo registrar el Service Worker:", error);
    });
  });
}

// Botón de instalación personalizado (aparece solo si el navegador lo permite)
let eventoInstalacion = null;

window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  eventoInstalacion = evento;

  const btnInstalar = document.querySelector("#btn-instalar-app");
  if (btnInstalar) {
    btnInstalar.hidden = false;
    btnInstalar.addEventListener("click", async () => {
      if (!eventoInstalacion) return;
      eventoInstalacion.prompt();
      await eventoInstalacion.userChoice;
      eventoInstalacion = null;
      btnInstalar.hidden = true;
    });
  }
});

// Si ya está instalada, ocultamos cualquier aviso de instalación
window.addEventListener("appinstalled", () => {
  const btnInstalar = document.querySelector("#btn-instalar-app");
  if (btnInstalar) btnInstalar.hidden = true;
});

// iPhone / iPad (Safari): no existe el aviso automático de instalación, así que
// mostramos una pista para instalarla a mano desde el menú Compartir.
(function () {
  const esIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const yaInstalada = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  const aviso = document.querySelector("#aviso-instalar-ios");
  if (esIos && !yaInstalada && aviso) aviso.hidden = false;
})();
