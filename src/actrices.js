// Filtro alfabético de Actrices GL: no borra tarjetas del HTML, solo
// oculta/muestra con CSS, así el contenido sigue completo para un crawler.
(function () {
  const filtro = document.querySelector("[data-filtro-actrices]");
  const tarjetas = document.querySelectorAll(".tarjeta-actriz");
  if (!filtro || !tarjetas.length) return;

  filtro.addEventListener("click", function (evento) {
    const boton = evento.target.closest(".letra-pill");
    if (!boton) return;

    filtro.querySelectorAll(".letra-pill").forEach(function (b) {
      b.classList.remove("activo");
    });
    boton.classList.add("activo");

    const letra = boton.dataset.letra;
    tarjetas.forEach(function (tarjeta) {
      const coincide = letra === "todas" || tarjeta.dataset.letra === letra;
      tarjeta.style.display = coincide ? "" : "none";
    });
  });
})();
