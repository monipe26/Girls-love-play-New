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

// Ficha técnica de cada actriz: se abre en un modal al clickear su tarjeta.
// El contenido de cada ficha vive en un <template> al lado de la tarjeta
// (ver tarjeta-actriz.njk), así que acá solo lo clonamos adentro del modal.
(function () {
  const modal = document.querySelector("#modal-actriz");
  if (!modal) return;

  const contenido = modal.querySelector(".modal-actriz-contenido");
  const caja = modal.querySelector(".modal-actriz-caja");
  let disparador = null;

  function abrirFicha(tarjeta) {
    const plantilla = document.querySelector("#" + tarjeta.dataset.abrirFicha);
    if (!plantilla) return;

    contenido.innerHTML = "";
    contenido.appendChild(plantilla.content.cloneNode(true));

    disparador = tarjeta;
    modal.hidden = false;
    document.body.classList.add("modal-actriz-abierto");
    caja.focus();
  }

  function cerrarFicha() {
    modal.hidden = true;
    document.body.classList.remove("modal-actriz-abierto");
    contenido.innerHTML = "";
    if (disparador) {
      disparador.focus();
      disparador = null;
    }
  }

  document.querySelectorAll(".tarjeta-actriz").forEach(function (tarjeta) {
    tarjeta.addEventListener("click", function () {
      abrirFicha(tarjeta);
    });
  });

  modal.querySelectorAll("[data-cerrar-ficha]").forEach(function (el) {
    el.addEventListener("click", cerrarFicha);
  });

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && !modal.hidden) cerrarFicha();
  });
})();
