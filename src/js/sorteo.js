// Sorteo GL (/minijuegos/): al tocar el botón, las portadas de las series del
// Catálogo van pasando cada vez más lento hasta que queda una, con el sello
// "¡Elegida!" y un botón para ir a verla. Es el mismo juego de la página vieja;
// la diferencia es que la lista de series ya viene armada en el HTML
// (#sorteo-datos, generada con el Catálogo) en vez de pedirse con fetch.
(function () {
  const caja = document.getElementById("ticket");
  if (!caja) return;

  let series = [];
  try {
    series = JSON.parse(document.getElementById("sorteo-datos").textContent) || [];
  } catch (e) {
    series = [];
  }

  const coverImg = document.getElementById("coverImg");
  const coverTitle = document.getElementById("coverTitle");
  const coverBox = document.getElementById("coverBox");
  const genreTag = document.getElementById("genreTag");
  const tagline = document.getElementById("tagline");
  const stamp = document.getElementById("stamp");
  const ticketNo = document.getElementById("ticketNo");
  const btn = document.getElementById("drawBtn");
  const verSerieLink = document.getElementById("verSerieLink");

  const numeroTicket = () => String(Math.floor(Math.random() * 900000) + 100000);
  const alAzar = () => series[Math.floor(Math.random() * series.length)];
  ticketNo.textContent = numeroTicket();

  const mostrar = (serie) => {
    if (serie.img) {
      coverImg.src = serie.img;
      coverImg.alt = "Portada de " + serie.titulo;
      coverImg.hidden = false;
      coverTitle.hidden = true;
    } else {
      coverImg.hidden = true;
      coverTitle.hidden = false;
      coverTitle.textContent = serie.titulo;
    }
    genreTag.textContent = serie.genero || "GL";
  };

  let precargadas = false;
  const precargarPortadas = () => {
    if (precargadas) return;
    precargadas = true;
    series.forEach((s) => { if (s.img) new Image().src = s.img; });
  };

  if (!series.length) {
    tagline.textContent = "Todavía no hay series cargadas para sortear.";
    btn.disabled = true;
    return;
  }

  btn.addEventListener("click", () => {
    precargarPortadas();
    btn.disabled = true;
    coverBox.classList.remove("cover-empty");
    stamp.style.transform = "rotate(-18deg) scale(0)";
    verSerieLink.hidden = true;
    tagline.textContent = "Sorteando...";
    ticketNo.textContent = numeroTicket();

    let vueltas = 0;
    const maxVueltas = 18;
    const elegida = alAzar();

    const paso = () => {
      mostrar(alAzar());
      vueltas++;
      if (vueltas >= maxVueltas) {
        mostrar(elegida);
        tagline.textContent = "¡" + elegida.titulo + "!";
        stamp.style.transform = "rotate(-18deg) scale(1)";
        verSerieLink.href = elegida.url;
        verSerieLink.hidden = false;
        btn.disabled = false;
        btn.textContent = "🎟️ Sortear de nuevo";
        return;
      }
      setTimeout(paso, 50 + vueltas * vueltas * 1.6);
    };
    setTimeout(paso, 50);
  });
})();
