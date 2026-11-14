// Desplegable "Productoras" de Extras: buscador, cierre al hacer clic afuera y con Escape.
(function () {
  var cont = document.querySelector("[data-productoras]");
  if (!cont) return;
  var input = cont.querySelector(".productoras-buscar");
  var items = Array.prototype.slice.call(cont.querySelectorAll(".productoras-item"));
  var vacio = cont.querySelector(".productoras-vacio");

  function norm(t) {
    return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }
  function filtrar() {
    var q = norm(input.value).trim();
    var visibles = 0;
    items.forEach(function (li) {
      var ok = !q || norm(li.getAttribute("data-nombre")).indexOf(q) !== -1;
      li.hidden = !ok;
      if (ok) visibles++;
    });
    vacio.hidden = visibles > 0;
  }

  input.addEventListener("input", filtrar);
  cont.addEventListener("toggle", function () {
    if (!cont.open) return;
    input.value = "";
    filtrar();
    // En el celular no se enfoca solo, para que no salte el teclado.
    if (!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) input.focus();
  });
  document.addEventListener("click", function (e) {
    if (cont.open && !cont.contains(e.target)) cont.open = false;
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && cont.open) {
      cont.open = false;
      var resumen = cont.querySelector("summary");
      if (resumen) resumen.focus();
    }
  });
})();
