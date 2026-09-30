const track = document.querySelector(".carrusel-track");
if (track) {
  const originales = Array.from(track.querySelectorAll(".carrusel-slide"));
  const total = originales.length;

  if (total > 1) {
    // Loop continuo: se agrega una copia del primer banner al final.
    // Cuando el carrusel llega a esa copia, vuelve en silencio al primero verdadero
    // (sin animación), así siempre avanza hacia la izquierda, uno detrás del otro.
    const copia = originales[0].cloneNode(true);
    copia.setAttribute("aria-hidden", "true");
    copia.querySelectorAll("a, button").forEach((el) => el.setAttribute("tabindex", "-1"));
    track.appendChild(copia);

    let posicion = 0;      // 0..total (total = la copia del primero)
    let animando = false;
    const DURACION = 400;  // igual que el transition del CSS (0.4s)

    function mover(pos, conAnimacion) {
      track.style.transition = conAnimacion ? `transform ${DURACION}ms ease` : "none";
      track.style.transform = `translateX(-${pos * 100}%)`;
      posicion = pos;
    }

    function siguiente() {
      if (animando) return;
      animando = true;
      mover(posicion + 1, true);
      setTimeout(() => {
        // Si llegó a la copia, salta (sin animación) al primero verdadero
        if (posicion === total) mover(0, false);
        animando = false;
      }, DURACION + 30);
    }

    function anterior() {
      if (animando) return;
      animando = true;
      if (posicion === 0) {
        // Desde el primero: se ubica en silencio en la copia y retrocede al último
        mover(total, false);
        void track.offsetWidth; // fuerza al navegador a aplicar la posición antes de animar
      }
      mover(posicion - 1, true);
      setTimeout(() => { animando = false; }, DURACION + 30);
    }

    document.querySelector(".carrusel-btn.next")?.addEventListener("click", () => { siguiente(); reiniciarAuto(); });
    document.querySelector(".carrusel-btn.prev")?.addEventListener("click", () => { anterior(); reiniciarAuto(); });

    // Soporte táctil (swipe)
    let inicioX = 0;
    track.addEventListener("touchstart", (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", (e) => {
      const diferencia = e.changedTouches[0].clientX - inicioX;
      if (diferencia > 50) { anterior(); reiniciarAuto(); }
      if (diferencia < -50) { siguiente(); reiniciarAuto(); }
    });

    // Auto-avance cada 6 segundos
    let timer = setInterval(siguiente, 6000);
    function reiniciarAuto() {
      clearInterval(timer);
      timer = setInterval(siguiente, 6000);
    }
  }
}
