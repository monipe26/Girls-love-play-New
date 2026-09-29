// Ships GL (/ships/): las 41 tarjetas ya vienen en el HTML (no se borra nada, solo se
// muestran/ocultan), así el contenido está completo para cualquier buscador aunque
// falle el JS. Acá se agregan, igual que en la página vieja:
//   - buscador (ship, actrices o series),
//   - filtro por estado (Todos / Vigentes / Finalizados),
//   - filtro por letra (A-Z, solo las letras que existen),
//   - paginación de a 12,
//   - ficha en ventana (modal) al tocar una tarjeta.
(function () {
  const grilla = document.querySelector("[data-grid-ships]");
  if (!grilla) return;

  const POR_PAGINA = 12;
  const tarjetas = Array.from(grilla.querySelectorAll(".tarjeta-ship"));
  const contEstado = document.querySelector("[data-filtros-estado]");
  const contLetras = document.querySelector("[data-filtros-letra]");
  const inputBuscar = document.getElementById("buscar-ships");
  const navPaginas = document.querySelector("[data-paginacion-ships]");
  const textoEstado = document.querySelector("[data-ships-estado]");

  let estadoActivo = "todos";
  let letraActiva = "todas";
  let pagina = 1;

  const normalizar = (t) =>
    (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // ----- Botonera de letras (solo las que existen) -----
  const crearLetra = (texto, valor, activo) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "letra-pill" + (activo ? " activo" : "");
    b.textContent = texto;
    b.dataset.letra = valor;
    contLetras.appendChild(b);
  };
  if (contLetras) {
    const letras = Array.from(new Set(tarjetas.map((t) => t.dataset.letra))).sort();
    crearLetra("Todas", "todas", true);
    letras.forEach((l) => crearLetra(l, l, false));
  }

  // ----- Aplicar filtros + paginar -----
  const filtradas = () => {
    const q = normalizar(inputBuscar ? inputBuscar.value.trim() : "");
    return tarjetas.filter((t) => {
      const pasaEstado = estadoActivo === "todos" || t.dataset.estado === estadoActivo;
      const pasaLetra = letraActiva === "todas" || t.dataset.letra === letraActiva;
      const pasaTexto = !q || normalizar(t.dataset.busqueda).includes(q);
      return pasaEstado && pasaLetra && pasaTexto;
    });
  };

  const dibujarPaginas = (total) => {
    navPaginas.innerHTML = "";
    if (total <= 1) { navPaginas.hidden = true; return; }
    navPaginas.hidden = false;
    const boton = (texto, destino, activo) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = texto;
      if (activo) { b.className = "activo"; b.setAttribute("aria-current", "page"); }
      b.addEventListener("click", () => {
        pagina = destino;
        render();
        grilla.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      navPaginas.appendChild(b);
    };
    if (pagina > 1) boton("‹ Anterior", pagina - 1, false);
    for (let i = 1; i <= total; i++) boton(String(i), i, i === pagina);
    if (pagina < total) boton("Siguiente ›", pagina + 1, false);
  };

  const render = () => {
    const lista = filtradas();
    const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (pagina > totalPaginas) pagina = totalPaginas;
    const desde = (pagina - 1) * POR_PAGINA;
    const visibles = new Set(lista.slice(desde, desde + POR_PAGINA));
    tarjetas.forEach((t) => { t.hidden = !visibles.has(t); });
    dibujarPaginas(totalPaginas);
    if (textoEstado) {
      textoEstado.textContent = lista.length
        ? ""
        : "No encontramos ningún ship con ese filtro. Probá con otra búsqueda.";
    }
  };

  if (contEstado) {
    contEstado.addEventListener("click", (e) => {
      const b = e.target.closest("[data-estado]");
      if (!b) return;
      estadoActivo = b.dataset.estado;
      contEstado.querySelectorAll(".filtro-btn").forEach((x) => x.classList.toggle("activo", x === b));
      pagina = 1;
      render();
    });
  }
  if (contLetras) {
    contLetras.addEventListener("click", (e) => {
      const b = e.target.closest(".letra-pill");
      if (!b) return;
      letraActiva = b.dataset.letra;
      contLetras.querySelectorAll(".letra-pill").forEach((x) => x.classList.toggle("activo", x === b));
      // Celular: el botón desplegable muestra la letra elegida y se cierra solo
      const caja = contLetras.closest(".letras-desplegable");
      if (caja) {
        const rotulo = caja.querySelector(".letras-toggle strong");
        if (rotulo) rotulo.textContent = b.textContent.trim();
        caja.classList.remove("abierto");
        const disparador = caja.querySelector(".letras-toggle");
        if (disparador) disparador.setAttribute("aria-expanded", "false");
      }
      pagina = 1;
      render();
    });
  }
  if (inputBuscar) {
    inputBuscar.addEventListener("input", () => { pagina = 1; render(); });
  }
  render();

  // ----- Ficha en ventana (modal) -----
  const modal = document.getElementById("modal-ship");
  if (!modal) return;
  const contenido = modal.querySelector(".modal-actriz-contenido");
  const caja = modal.querySelector(".modal-actriz-caja");
  let disparador = null;

  const abrir = (tarjeta) => {
    const plantilla = document.getElementById(tarjeta.dataset.abrirShip);
    if (!plantilla) return;
    contenido.innerHTML = "";
    contenido.appendChild(plantilla.content.cloneNode(true));
    disparador = tarjeta;
    modal.hidden = false;
    document.body.classList.add("modal-actriz-abierto");
    caja.focus();
  };
  const cerrar = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-actriz-abierto");
    contenido.innerHTML = "";
    if (disparador) { disparador.focus(); disparador = null; }
  };

  tarjetas.forEach((t) => t.addEventListener("click", () => abrir(t)));
  modal.querySelectorAll("[data-cerrar-ship]").forEach((el) => el.addEventListener("click", cerrar));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) cerrar();
  });
})();
