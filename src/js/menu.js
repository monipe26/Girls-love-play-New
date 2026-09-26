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

// Modo oscuro: alterna data-tema="oscuro" en <html> (los colores de ese
// modo están definidos en variables.css) y recuerda la elección del
// usuario en localStorage para la próxima visita.
const btnModoOscuro = document.querySelector("#btn-modo-oscuro");
if (btnModoOscuro) {
  const raiz = document.documentElement;

  const aplicarTema = (tema) => {
    if (tema === "oscuro") {
      raiz.setAttribute("data-tema", "oscuro");
      btnModoOscuro.setAttribute("aria-pressed", "true");
      btnModoOscuro.setAttribute("aria-label", "Cambiar a modo claro");
    } else {
      raiz.removeAttribute("data-tema");
      btnModoOscuro.setAttribute("aria-pressed", "false");
      btnModoOscuro.setAttribute("aria-label", "Cambiar a modo oscuro");
    }
  };

  try {
    const temaGuardado = localStorage.getItem("gl-tema");
    if (temaGuardado) aplicarTema(temaGuardado);
  } catch (error) {
    // Si el navegador bloquea localStorage (modo privado, etc.) seguimos
    // en modo claro por defecto, sin romper nada.
  }

  btnModoOscuro.addEventListener("click", () => {
    const nuevoTema = raiz.getAttribute("data-tema") === "oscuro" ? "claro" : "oscuro";
    aplicarTema(nuevoTema);
    try {
      localStorage.setItem("gl-tema", nuevoTema);
    } catch (error) {
      // Sigue funcionando el toggle, solo no recuerda la preferencia.
    }
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
