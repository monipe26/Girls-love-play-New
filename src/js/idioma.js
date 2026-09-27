// Selector de idioma (header): botón propio que dispara el widget de
// Google Translate por atrás. El sitio real (HTML que ve Google/SEO) sigue
// siendo 100% español siempre; esto solo traduce lo que ve el visitante,
// en su navegador.
function seleccionarIdiomaGoogle(codigo) {
  var combo = document.querySelector(".goog-te-combo");

  if (codigo === "") {
    // "Español": Google Translate no tiene una forma de "deseleccionar"
    // desde el combo (la lista solo trae los idiomas destino), así que se
    // borra la cookie donde guarda el idioma elegido y se recarga.
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + location.hostname;
    location.reload();
    return;
  }

  if (!combo) return; // el widget de Google todavía no cargó, se ignora el click
  combo.value = codigo;
  combo.dispatchEvent(new Event("change"));
  reforzarOcultamientoBanner();
}

// Refuerzo extra (además del CSS) para la barra gris de Google: a veces la
// agrega/reordena un instante después de disparar el cambio de idioma, así
// que se la busca y se tapa a mano durante unos segundos por las dudas.
function reforzarOcultamientoBanner() {
  var intentos = 0;
  var intervalo = setInterval(function () {
    intentos++;
    document.querySelectorAll(".goog-te-banner-frame, .goog-te-balloon-frame").forEach(function (el) {
      el.style.setProperty("display", "none", "important");
    });
    document.body.style.setProperty("top", "0px", "important");
    if (intentos > 15) clearInterval(intervalo); // ~3s y se deja de insistir
  }, 200);
}

document.addEventListener("DOMContentLoaded", function () {
  var contenedor = document.querySelector(".selector-idioma");
  var boton = document.querySelector(".btn-idioma");
  var menu = document.querySelector(".menu-idiomas");
  if (!contenedor || !boton || !menu) return;

  function cerrarMenu() {
    menu.setAttribute("hidden", "");
    boton.setAttribute("aria-expanded", "false");
  }

  boton.addEventListener("click", function (evento) {
    evento.stopPropagation();
    var estaAbierto = !menu.hasAttribute("hidden");
    if (estaAbierto) {
      cerrarMenu();
    } else {
      menu.removeAttribute("hidden");
      boton.setAttribute("aria-expanded", "true");
    }
  });

  menu.querySelectorAll("button[data-lang]").forEach(function (item) {
    item.addEventListener("click", function () {
      seleccionarIdiomaGoogle(item.getAttribute("data-lang"));
      cerrarMenu();
    });
  });

  document.addEventListener("click", function (evento) {
    if (!evento.target.closest(".selector-idioma")) cerrarMenu();
  });
});
