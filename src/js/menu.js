// Menú móvil
const botonMenu = document.querySelector(".menu-toggle");
const menu = document.querySelector("#menu-principal");

if (botonMenu && menu) {
  botonMenu.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    botonMenu.setAttribute("aria-expanded", abierto);
  });
}

// Botón "volver arriba"
const btnArriba = document.querySelector("#btn-arriba");
if (btnArriba) {
  window.addEventListener("scroll", () => {
    btnArriba.classList.toggle("visible", window.scrollY > 400);
  });
  btnArriba.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Sinopsis expandible en fichas de serie
const btnLeerMas = document.querySelector("[data-toggle-sinopsis]");
if (btnLeerMas) {
  btnLeerMas.addEventListener("click", () => {
    const sinopsis = document.querySelector("[data-expandible]");
    const expandida = sinopsis.classList.toggle("expandida");
    btnLeerMas.textContent = expandida ? "Leer menos" : "Leer más";
  });
}
