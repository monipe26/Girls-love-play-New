// Tarjetas de video (OST / Comunidad): si la página tiene un reproductor
// principal arriba (home), el video se carga ahí y se hace scroll suave
// hasta él. Si no existe (páginas /ost/ o /comunidad/ sin reproductor
// principal), se reproduce dentro de la propia tarjeta, como antes.
const reproductorPrincipalSeccion = document.querySelector(".reproductor-principal");
const reproductorPrincipalWrapper = reproductorPrincipalSeccion
  ? reproductorPrincipalSeccion.querySelector(".video-wrapper")
  : null;
const reproductorPrincipalTitulo = reproductorPrincipalSeccion
  ? reproductorPrincipalSeccion.querySelector(".reproductor-titulo")
  : null;

document.querySelectorAll(".tarjeta-video").forEach((tarjeta) => {
  tarjeta.addEventListener("click", () => {
    const id = tarjeta.dataset.youtubeId;
    const tituloEl = tarjeta.querySelector(".tarjeta-video-titulo");
    const titulo = tituloEl ? tituloEl.textContent : "Video";

    if (reproductorPrincipalWrapper) {
      reproductorPrincipalWrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" title="${titulo}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
      if (reproductorPrincipalTitulo) reproductorPrincipalTitulo.textContent = titulo;
      reproductorPrincipalSeccion.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "video-wrapper";
    wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" title="${titulo}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    tarjeta.replaceWith(wrapper);
  });
});

// Fichas de serie con varias partes/episodios: cambia el video activo sin recargar la página
const reproductorPartes = document.querySelector("[data-reproductor-partes]");
if (reproductorPartes) {
  const botones = Array.from(document.querySelectorAll(".btn-parte"));

  const cargarParte = (boton) => {
    const id = boton.dataset.youtubeId;
    reproductorPartes.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" title="${boton.textContent.trim()}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    botones.forEach((b) => b.classList.remove("activo"));
    boton.classList.add("activo");
    actualizarNav();
    boton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  botones.forEach((boton) => {
    boton.addEventListener("click", () => cargarParte(boton));
  });

  // Navegación "Episodio anterior" / "Episodio siguiente"
  const nav = document.querySelector("[data-nav-episodios]");
  let actualizarNav = () => {};

  if (nav) {
    const btnPrev = nav.querySelector('[data-nav="prev"]');
    const btnNext = nav.querySelector('[data-nav="next"]');

    actualizarNav = () => {
      const indiceActivo = botones.findIndex((b) => b.classList.contains("activo"));
      if (btnPrev) btnPrev.disabled = indiceActivo <= 0;
      if (btnNext) btnNext.disabled = indiceActivo === -1 || indiceActivo >= botones.length - 1;
    };

    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        const indiceActivo = botones.findIndex((b) => b.classList.contains("activo"));
        if (indiceActivo > 0) cargarParte(botones[indiceActivo - 1]);
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        const indiceActivo = botones.findIndex((b) => b.classList.contains("activo"));
        if (indiceActivo !== -1 && indiceActivo < botones.length - 1) cargarParte(botones[indiceActivo + 1]);
      });
    }

    actualizarNav();
  }
}
