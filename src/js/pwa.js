// ---- Estadísticas de la app instalada (Google Analytics) ----
// Manda eventos a GA4 para saber cuánta gente instala la app y cuánta la abre desde el ícono.
function rastrear(nombre, datos) {
  try { if (typeof gtag === "function") gtag("event", nombre, datos || {}); } catch (e) {}
}

(function () {
  const abiertaComoApp = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  try {
    if (typeof gtag === "function") {
      // Propiedad de usuario: permite separar en GA4 a quienes usan la app instalada
      gtag("set", "user_properties", { modo_visita: abiertaComoApp ? "app_instalada" : "navegador" });
    }
  } catch (e) {}
  if (!abiertaComoApp) return;
  // Un solo evento por sesión (no uno por cada página que abre)
  let yaContada = false;
  try { yaContada = sessionStorage.getItem("glp-app-contada") === "1"; } catch (e) {}
  if (yaContada) return;
  try { sessionStorage.setItem("glp-app-contada", "1"); } catch (e) {}
  rastrear("pwa_abierta_como_app", { modo: "standalone" });
})();

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
      const eleccion = await eventoInstalacion.userChoice;
      rastrear(eleccion && eleccion.outcome === "accepted" ? "pwa_instalar_aceptado" : "pwa_instalar_rechazado", { origen: "boton" });
      eventoInstalacion = null;
      btnInstalar.hidden = true;
    });
  }
});

// Si ya está instalada, ocultamos cualquier aviso de instalación
window.addEventListener("appinstalled", () => {
  rastrear("pwa_instalada");
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

// Barra de instalación fija abajo (estilo "app"). Se muestra sola cuando se puede instalar
// (Android / PC) o, en iPhone, con la explicación para instalarla a mano. La X la oculta 7 días.
(function () {
  const barra = document.querySelector("#barra-instalar");
  if (!barra) return;
  const btn = document.querySelector("#barra-instalar-btn");
  const cerrar = document.querySelector("#barra-instalar-cerrar");
  const ayuda = document.querySelector("#barra-instalar-ayuda");
  const yaInstalada = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  const CLAVE = "glp-instalar-cerrada";
  let cerradaHasta = 0;
  try { cerradaHasta = Number(localStorage.getItem(CLAVE)) || 0; } catch (e) {}
  if (yaInstalada || Date.now() < cerradaHasta) return;

  const mostrar = () => { barra.hidden = false; document.body.classList.add("con-barra-instalar"); };
  const ocultar = () => { barra.hidden = true; document.body.classList.remove("con-barra-instalar"); };

  cerrar.addEventListener("click", () => {
    ocultar();
    try { localStorage.setItem(CLAVE, String(Date.now() + 7 * 24 * 60 * 60 * 1000)); } catch (e) {}
  });

  const esIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (esIos) {
    btn.addEventListener("click", () => {
      ayuda.textContent = "Tocá Compartir y después “Añadir a pantalla de inicio”";
    });
    mostrar();
    return;
  }

  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    btn.onclick = async () => {
      evento.prompt();
      const eleccion = await evento.userChoice;
      rastrear(eleccion && eleccion.outcome === "accepted" ? "pwa_instalar_aceptado" : "pwa_instalar_rechazado", { origen: "barra" });
      ocultar();
    };
    mostrar();
  });
  window.addEventListener("appinstalled", ocultar);
})();
