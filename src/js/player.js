// En celular, cuando el video entra en pantalla completa (al tocar el
// cuadradito de pantalla completa DENTRO del propio reproductor de
// YouTube, como ya lo hacías en la versión vieja) forzamos la rotación
// a horizontal (landscape). No hace falta que nosotros abramos la
// pantalla completa por código: el botón de YouTube ya la abre solo,
// nosotros sólo escuchamos ese cambio y giramos.
// Nota: la API de rotación (screen.orientation.lock) sólo la soportan
// navegadores basados en Chromium (Android); en iOS Safari no existe
// esa API todavía, así que ahí la pantalla completa funciona pero el
// usuario tiene que girar el teléfono con la mano.
function alEntrarOSalirDePantallaCompleta() {
  if (document.fullscreenElement) {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch(() => {});
    }
  } else if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
}
document.addEventListener("fullscreenchange", alEntrarOSalirDePantallaCompleta);
document.addEventListener("webkitfullscreenchange", alEntrarOSalirDePantallaCompleta);

// Tarjetas de video (OST / Extra GL / Comunidad): si la página tiene un
// reproductor principal arriba (home u otras), el video se carga ahí y se
// hace scroll suave hasta él. Si no existe (poco probable hoy), se
// reproduce dentro de la propia tarjeta, como antes.
const reproductorPrincipalSeccion = document.querySelector(".reproductor-principal");
const reproductorPrincipalWrapper = reproductorPrincipalSeccion
  ? reproductorPrincipalSeccion.querySelector(".video-wrapper")
  : null;
const reproductorPrincipalTitulo = reproductorPrincipalSeccion
  ? reproductorPrincipalSeccion.querySelector(".reproductor-titulo")
  : null;

// ===== Avance aleatorio al terminar el video (OST / Extra GL / Comunidad) =====
// Cuando el video que está sonando en el reproductor principal termina, se
// elige otro al azar de entre los que ya están cargados en la grilla de esa
// misma sección y se reproduce solo, sin cortar, hasta que el usuario entra
// a otra página. Usa la API de YouTube (YT.Player) para poder "escuchar"
// cuándo termina un video.
let ytApiListo = false;
let ytApiPendientes = [];
function alEstarListaLaApiDeYoutube(callback) {
  if (ytApiListo) {
    callback();
  } else {
    ytApiPendientes.push(callback);
  }
}
window.onYouTubeIframeAPIReady = function () {
  ytApiListo = true;
  ytApiPendientes.forEach((callback) => callback());
  ytApiPendientes = [];
};

let reproductorYtActivo = null;

function obtenerListaVideosDeLaGrilla() {
  return Array.from(document.querySelectorAll(".tarjeta-video")).map((tarjeta) => {
    const tituloEl = tarjeta.querySelector(".tarjeta-video-titulo");
    return {
      id: tarjeta.dataset.youtubeId,
      titulo: tituloEl ? tituloEl.textContent : "Video",
    };
  });
}

function elegirVideoAlAzar(lista, idActual) {
  if (!lista.length) return null;
  if (lista.length === 1) return lista[0];
  let intentos = 0;
  let elegido;
  do {
    elegido = lista[Math.floor(Math.random() * lista.length)];
    intentos++;
  } while (elegido.id === idActual && intentos < 10);
  return elegido;
}

function alTerminarElVideo(idQueTermino) {
  const siguiente = elegirVideoAlAzar(obtenerListaVideosDeLaGrilla(), idQueTermino);
  if (!siguiente || !reproductorYtActivo) return;
  reproductorYtActivo.loadVideoById(siguiente.id);
  if (reproductorPrincipalTitulo) {
    reproductorPrincipalTitulo.textContent = `Reproduciendo ahora: ${siguiente.titulo}`;
  }
}

// Carga un video en el reproductor principal. Si la sección tiene grilla de
// videos (OST / Extra GL / Comunidad), queda conectado a la API de YouTube
// para poder avanzar solo al azar cuando termine. Si no hay grilla, se
// mantiene el comportamiento simple de siempre.
function cargarVideoPrincipal(id, titulo, conAutoplay) {
  if (!reproductorPrincipalWrapper) return;

  const hayGrilla = document.querySelectorAll(".tarjeta-video").length > 1;
  const autoplayParam = conAutoplay ? "&autoplay=1" : "";

  if (!hayGrilla) {
    reproductorPrincipalWrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?rel=0${autoplayParam}" title="${titulo}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    return;
  }

  reproductorPrincipalWrapper.innerHTML = `<iframe id="reproductor-yt-iframe" src="https://www.youtube.com/embed/${id}?enablejsapi=1&playsinline=1${autoplayParam}" title="${titulo}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>`;

  if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  }

  alEstarListaLaApiDeYoutube(() => {
    const iframe = document.getElementById("reproductor-yt-iframe");
    if (!iframe) return;
    reproductorYtActivo = new YT.Player(iframe, {
      events: {
        onStateChange: function (evento) {
          if (evento.data === YT.PlayerState.ENDED) {
            alTerminarElVideo(id);
          }
        },
      },
    });
  });
}

// Al entrar a la página (ej. /ost/, /extra/, /comunidad/), el primer video
// ya viene armado del lado del servidor. Si hay grilla, lo "re-conectamos"
// a la API de YouTube (sin forzar autoplay: el usuario no pidió reproducir
// nada todavía) para que el avance aleatorio funcione también con este
// primer video.
if (reproductorPrincipalWrapper && document.querySelectorAll(".tarjeta-video").length > 1) {
  const iframeInicial = reproductorPrincipalWrapper.querySelector("iframe");
  if (iframeInicial) {
    const coincidencia = iframeInicial.src.match(/embed\/([^?&]+)/);
    const idInicial = coincidencia ? coincidencia[1] : null;
    if (idInicial) {
      cargarVideoPrincipal(idInicial, iframeInicial.title || "Video", false);
    }
  }
}

document.querySelectorAll(".tarjeta-video").forEach((tarjeta) => {
  tarjeta.addEventListener("click", () => {
    const id = tarjeta.dataset.youtubeId;
    const tituloEl = tarjeta.querySelector(".tarjeta-video-titulo");
    const titulo = tituloEl ? tituloEl.textContent : "Video";

    if (reproductorPrincipalWrapper) {
      cargarVideoPrincipal(id, titulo, true);
      if (reproductorPrincipalTitulo) reproductorPrincipalTitulo.textContent = `Reproduciendo ahora: ${titulo}`;
      reproductorPrincipalSeccion.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "video-wrapper";
    wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" title="${titulo}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    tarjeta.replaceWith(wrapper);
  });
});

// Videos de la Comunidad en el home (4 miniaturas): al hacer clic, cada una
// se reproduce en el lugar, sin afectar a las demás ni salir de la página.
document.querySelectorAll(".comunidad-video").forEach((boton) => {
  boton.addEventListener("click", () => {
    const id = boton.dataset.youtubeId;
    const tituloEl = boton.parentElement.querySelector(".comunidad-video-titulo");
    const titulo = tituloEl ? tituloEl.textContent : "Video";

    const wrapper = document.createElement("div");
    wrapper.className = "video-wrapper comunidad-video-wrapper";
    wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" title="${titulo}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    boton.replaceWith(wrapper);
  });
});

// Nota: la tarjeta destacada (ej. "Blank: The Series" en el home) ya no se
// reproduce acá adentro — ahora es un link directo a /series-tv/, así que
// no necesita JS.

// Página "Series TV": reproductor principal arriba + grilla de covers abajo.
// Clic en un cover carga ese video arriba (sin recargar la página) y los
// botones "Episodio anterior" / "Episodio siguiente" recorren la grilla.
const reproductorSeriesTv = document.querySelector("[data-reproductor-series-tv]");
if (reproductorSeriesTv) {
  const wrapper = reproductorSeriesTv.querySelector(".video-wrapper");
  const tituloEl = reproductorSeriesTv.querySelector(".reproductor-titulo");
  const sinopsisEl = reproductorSeriesTv.querySelector(".reproductor-sinopsis");
  const tarjetas = Array.from(document.querySelectorAll(".tarjeta-serie-tv"));
  const nav = document.querySelector("[data-nav-series-tv]");

  let actualizarNavSeriesTv = () => {};

  const cargarSerieTv = (tarjeta) => {
    const id = tarjeta.dataset.youtubeId;
    const titulo = tarjeta.dataset.titulo;
    const sinopsis = tarjeta.dataset.sinopsis;

    wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" title="${titulo}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    if (tituloEl) tituloEl.textContent = `Reproduciendo ahora: ${titulo}`;
    if (sinopsisEl) sinopsisEl.textContent = sinopsis || "";

    tarjetas.forEach((t) => t.classList.remove("activo"));
    tarjeta.classList.add("activo");
    actualizarNavSeriesTv();
    reproductorSeriesTv.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  tarjetas.forEach((tarjeta) => {
    tarjeta.addEventListener("click", () => cargarSerieTv(tarjeta));
  });

  if (nav) {
    const btnPrev = nav.querySelector('[data-nav="prev"]');
    const btnNext = nav.querySelector('[data-nav="next"]');

    actualizarNavSeriesTv = () => {
      const indiceActivo = tarjetas.findIndex((t) => t.classList.contains("activo"));
      if (btnPrev) btnPrev.disabled = indiceActivo <= 0;
      if (btnNext) btnNext.disabled = indiceActivo === -1 || indiceActivo >= tarjetas.length - 1;
    };

    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        const indiceActivo = tarjetas.findIndex((t) => t.classList.contains("activo"));
        if (indiceActivo > 0) cargarSerieTv(tarjetas[indiceActivo - 1]);
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        const indiceActivo = tarjetas.findIndex((t) => t.classList.contains("activo"));
        if (indiceActivo !== -1 && indiceActivo < tarjetas.length - 1) cargarSerieTv(tarjetas[indiceActivo + 1]);
      });
    }

    actualizarNavSeriesTv();
  }
}

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
