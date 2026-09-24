const track = document.querySelector(".carrusel-track");
if (track) {
  const slides = track.querySelectorAll(".carrusel-slide");
  let actual = 0;

  function mostrar(indice) {
    actual = (indice + slides.length) % slides.length;
    track.style.transform = `translateX(-${actual * 100}%)`;
  }

  document.querySelector(".carrusel-btn.next")?.addEventListener("click", () => mostrar(actual + 1));
  document.querySelector(".carrusel-btn.prev")?.addEventListener("click", () => mostrar(actual - 1));

  // Soporte táctil (swipe)
  let inicioX = 0;
  track.addEventListener("touchstart", (e) => { inicioX = e.touches[0].clientX; });
  track.addEventListener("touchend", (e) => {
    const diferencia = e.changedTouches[0].clientX - inicioX;
    if (diferencia > 50) mostrar(actual - 1);
    if (diferencia < -50) mostrar(actual + 1);
  });

  // Auto-avance cada 6 segundos
  setInterval(() => mostrar(actual + 1), 6000);
}
