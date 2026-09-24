document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('ticker-lista');
  if (!lista) return;

  const ticker = lista.closest('.ticker');
  const prevBtn = ticker.querySelector('.ticker-prev');
  const nextBtn = ticker.querySelector('.ticker-next');

  // Duplicamos los items una vez para poder hacer un loop continuo sin salto brusco.
  const originales = Array.from(lista.children);
  originales.forEach((li) => {
    const clon = li.cloneNode(true);
    clon.setAttribute('aria-hidden', 'true');
    clon.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
    lista.appendChild(clon);
  });

  const VELOCIDAD = 0.4; // píxeles por frame
  let mitad = lista.scrollWidth / 2;
  let pausado = false;
  let temporizadorPausa = null;

  function medir() {
    mitad = lista.scrollWidth / 2;
  }
  window.addEventListener('resize', medir);

  function animar() {
    if (!pausado && mitad > 0) {
      lista.scrollLeft += VELOCIDAD;
      if (lista.scrollLeft >= mitad) {
        lista.scrollLeft -= mitad;
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
    if (lista.scrollLeft < 0) lista.scrollLeft += mitad;
    pausarUnMomento();
  });
  nextBtn?.addEventListener('click', () => {
    lista.scrollLeft += 200;
    if (lista.scrollLeft >= mitad) lista.scrollLeft -= mitad;
    pausarUnMomento();
  });
});
