// Marca en el calendario el día de hoy (según la fecha del visitante, no la
// del build) para que se destaque aunque la página sea estática.
(function () {
  var d = new Date();
  var mm = String(d.getMonth() + 1).padStart(2, "0");
  var dd = String(d.getDate()).padStart(2, "0");
  var hoy = d.getFullYear() + "-" + mm + "-" + dd;
  var celda = document.querySelector('.cal-dia[data-fecha="' + hoy + '"]');
  if (celda && !celda.classList.contains("cal-dia--otro")) celda.classList.add("cal-dia--hoy");
})();
