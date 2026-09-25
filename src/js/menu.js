// Menú móvil
const botonMenu = document.querySelector(".menu-toggle");
const menu = document.querySelector("#menu-principal");

if (botonMenu && menu) {
  botonMenu.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    botonMenu.setAttribute("aria-expanded", abierto);
  });
}

// Submenús con flechita (Series, Actrices): colapsados por defecto, se
// abren al tocar/clickear la flechita, sin navegar. Funciona igual en
// móvil (acordeón) y en escritorio (además del hover, por si el dispositivo
// no tiene hover real, como notebooks táctiles).
function cerrarSubmenus(exceptoEsteItem) {
  document.querySelectorAll(".tiene-submenu.abierto").forEach((item) => {
    if (item === exceptoEsteItem) return;
    item.classList.remove("abierto");
    const boton = item.querySelector(".submenu-toggle");
    if (boton) boton.setAttribute("aria-expanded", "false");
  });
}

document.querySelectorAll(".submenu-toggle").forEach((boton) => {
  boton.addEventListener("click", (evento) => {
    evento.preventDefault();
    const item = boton.closest(".tiene-submenu");
    if (!item) return;
    const abierto = item.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", abierto);
    cerrarSubmenus(abierto ? item : null);
  });
});

// Clickear fuera de un submenú abierto lo cierra (relevante sobre todo en
// escritorio, donde el hover ya no aplica una vez que se abrió con click).
document.addEventListener("click", (evento) => {
  if (!evento.target.closest(".tiene-submenu")) cerrarSubmenus(null);
});

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

// Buscador desplegable
const botonBuscar = document.querySelector(".btn-buscar");
const formBuscar = document.querySelector("#form-buscar");
if (botonBuscar && formBuscar) {
  botonBuscar.addEventListener("click", () => {
    const abierto = formBuscar.hasAttribute("hidden");
    if (abierto) {
      formBuscar.removeAttribute("hidden");
      formBuscar.querySelector("input").focus();
    } else {
      formBuscar.setAttribute("hidden", "");
    }
    botonBuscar.setAttribute("aria-expanded", String(abierto));
  });
}
