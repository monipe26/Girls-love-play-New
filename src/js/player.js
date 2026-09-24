// Tarjetas de video (OST / Comunidad): cargan el iframe recién al hacer clic
document.querySelectorAll(".tarjeta-video").forEach((tarjeta) => {
  tarjeta.addEventListener("click", () => {
    const id = tarjeta.dataset.youtubeId;
    const wrapper = document.createElement("div");
    wrapper.className = "video-wrapper";
    wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" title="Video" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    tarjeta.replaceWith(wrapper);
  });
});

// Fichas de serie con varias partes: cambia el video activo sin recargar la página
const reproductorPartes = document.querySelector("[data-reproductor-partes]");
if (reproductorPartes) {
  const botones = document.querySelectorAll(".btn-parte");
  botones.forEach((boton) => {
    boton.addEventListener("click", () => {
      const id = boton.dataset.youtubeId;
      reproductorPartes.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" title="Episodio" allowfullscreen></iframe>`;
      botones.forEach((b) => b.classList.remove("activo"));
      boton.classList.add("activo");
    });
  });
}
