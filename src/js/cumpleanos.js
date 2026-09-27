// 🎂 Aviso de cumpleaños (ventanita flotante, no invasiva, solo en el home).
// Reconstruido a partir de la lógica del sitio viejo: busca si alguna
// actriz cumple años hoy (según el día vigente en Tailandia, que es lo
// que define el cumpleaños) y, si es así, muestra una tarjetita que se
// puede cerrar y que además se cierra sola a los 15s.
//
// Depende de que el HTML de la página haya definido antes:
//   window.actricesCumpleData = [...]  (ver src/index.njk)
// y de que exista un <div id="aviso-cumple-index"></div> en el HTML.

function getFechaHoyThailand() {
  var fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  var partes = fmt.formatToParts(new Date());
  function obtener(tipo) {
    var p = partes.find(function (x) {
      return x.type === tipo;
    });
    return p ? p.value : "";
  }
  return { year: obtener("year"), month: obtener("month"), day: obtener("day") };
}

function obtenerActricesDeCumple() {
  if (!window.actricesCumpleData || !window.actricesCumpleData.length) return [];
  var hoy = getFechaHoyThailand();
  return window.actricesCumpleData.filter(function (actriz) {
    if (!actriz.nacimiento) return false;
    var partes = actriz.nacimiento.split("-");
    if (partes.length < 3) return false;
    return partes[1] === hoy.month && partes[2] === hoy.day;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  var DURACION_AVISO_MS = 15000; // se cierra sola a los 15s si no la cierran antes

  var cumpleañeras = obtenerActricesDeCumple();
  if (!cumpleañeras.length) return;

  // Para no repetir el aviso cada vez que entran al home el mismo día.
  var hoyTH = getFechaHoyThailand();
  var claveHoy =
    "cumpleAvisoIndex_" +
    hoyTH.year + "-" + hoyTH.month + "-" + hoyTH.day + "_" +
    cumpleañeras
      .map(function (a) { return a.slug; })
      .sort()
      .join(",");

  if (localStorage.getItem(claveHoy)) return;
  localStorage.setItem(claveHoy, "1");

  var contenedor = document.getElementById("aviso-cumple-index");
  if (!contenedor) return;

  cumpleañeras.forEach(function (actriz) {
    var card = document.createElement("div");
    card.className = "aviso-cumple-card";
    card.innerHTML =
      '<button class="aviso-cumple-cerrar" aria-label="Cerrar">✕</button>' +
      '<img class="aviso-cumple-foto" src="' + actriz.foto + '" alt="' + actriz.nombre + '">' +
      '<div class="aviso-cumple-texto">' +
      '<p class="aviso-cumple-nombre">' + actriz.nombre + '</p>' +
      '<p class="aviso-cumple-msj">🎉 ¡Hoy es su cumpleaños!</p>' +
      (actriz.instagram
        ? '<a class="aviso-cumple-link" href="' + actriz.instagram + '" target="_blank" rel="noopener">📸 Saludala</a>'
        : "") +
      "</div>";

    function cerrarCard() {
      card.remove();
    }
    card.querySelector(".aviso-cumple-cerrar").addEventListener("click", cerrarCard);

    contenedor.appendChild(card);
    setTimeout(cerrarCard, DURACION_AVISO_MS);
  });
});
