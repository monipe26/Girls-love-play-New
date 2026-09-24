document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('ticker-lista');
  if (!lista) return;

  const ticker = lista.closest('.ticker');
  const prevBtn = ticker.querySelector('.ticker-prev');
  const nextBtn = ticker.querySelector('.ticker-next');

  // Ancho de UNA sola tanda de noticias (antes de duplicar nada).
  const original = Array.from(lista.children);
  const anchoSet = lista.scrollWidth;

  // Vamos agregando copias hasta tener contenido de sobra: así el navegador
  // siempre tiene margen real para scrollear un ciclo completo, sin importar
  // qué tan angosto sea el texto o qué tan ancha la pantalla.
  let seguridad = 0;
  while (lista.scrollWidth < anchoSet + lista.clientWidth + 100 && seguridad < 15) {
    original.forEach((li) => {
      const clon = li.cloneNode(true);
      clon.setAttribute('aria-hidden', 'true');
      clon.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
      lista.appendChild(clon);
    });
    seguridad++;
  }

  const VELOCIDAD = 0.4; // píxeles por frame
  let pausado = false;
  let temporizadorPausa = null;

  function animar() {
    if (!pausado && anchoSet > 0) {
      lista.scrollLeft += VELOCIDAD;
      if (lista.scrollLeft >= anchoSet) {
        lista.scrollLeft -= anchoSet;
      }
    }
    requestAnimationFrame(animar);
  }
  requestAnimationFrame(animar);

  function pausarUnMomento() {
    pausado = true;
    clearTimeout(temporizadorPausa);
    temporizadorPausa = setTimeout(() => { pausado = false; }, 3000);
  }

  ticker.addEventListener('mouseenter', () => { pausado = true; });
  ticker.addEventListener('mouseleave', () => { pausado = false; });
  ticker.addEventListener('focusin', () => { pausado = true; });
  ticker.addEventListener('focusout', () => { pausado = false; });

  prevBtn?.addEventListener('click', () => {
    lista.scrollLeft -= 200;
    if (lista.scrollLeft < 0) lista.scrollLeft += anchoSet;
    pausarUnMomento();
  });
  nextBtn?.addEventListener('click', () => {
    lista.scrollLeft += 200;
    if (lista.scrollLeft >= anchoSet) lista.scrollLeft -= anchoSet;
    pausarUnMomento();
  });
});
