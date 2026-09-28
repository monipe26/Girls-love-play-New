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

// Página "Series": reproductor principal arriba + grilla de covers abajo.
// Cada serie puede ser:
//   - un solo video (data-videos con un id),
//   - un video con VARIAS PARTES (data-videos="id1,id2,id3..."): se navegan con
//     "Episodio anterior / siguiente" (sin fila de botones, hay series con 20
//     partes) y al terminar una parte arranca la siguiente sola,
//   - una PLAYLIST de YouTube (data-playlist="PL..."): YouTube la va pasando solo.
// Los botones "Episodio anterior / siguiente" recorren primero las partes (o los
// videos de la playlist) de la serie que se está viendo y, cuando no quedan más,
// pasan a la serie anterior / siguiente de la grilla.
const reproductorSeriesTv = document.querySelector("[data-reproductor-series-tv]");
if (reproductorSeriesTv) {
  const wrapper = reproductorSeriesTv.querySelector(".video-wrapper");
  const tituloEl = reproductorSeriesTv.querySelector(".reproductor-titulo");
  const sinopsisEl = reproductorSeriesTv.querySelector(".reproductor-sinopsis");
  const tarjetas = Array.from(document.querySelectorAll(".tarjeta-serie-tv"));
  const nav = document.querySelector("[data-nav-series-tv]");
  const btnPrev = nav ? nav.querySelector('[data-nav="prev"]') : null;
  const btnNext = nav ? nav.querySelector('[data-nav="next"]') : null;

  let serieActual = null; // { tarjeta, titulo, sinopsis, playlist, videos[] }
  let parteActual = 0;
  let ytSeries = null; // reproductor de la API de YouTube conectado al iframe actual
  let generacion = 0; // para ignorar avisos de un reproductor viejo

  const leerSerie = (tarjeta) => ({
    tarjeta,
    titulo: tarjeta.dataset.titulo || "",
    sinopsis: tarjeta.dataset.sinopsis || "",
    playlist: tarjeta.dataset.playlist || "",
    videos: (tarjeta.dataset.videos || "").split(",").map((v) => v.trim()).filter(Boolean),
  });

  const srcDe = (serie, parte, conAutoplay) => {
    const comunes = `enablejsapi=1&playsinline=1&rel=0${conAutoplay ? "&autoplay=1" : ""}`;
    if (serie.playlist) {
      return `https://www.youtube.com/embed/videoseries?list=${serie.playlist}&${comunes}`;
    }
    return `https://www.youtube.com/embed/${serie.videos[parte]}?${comunes}`;
  };

  // Info de la playlist (posición y cantidad) — solo disponible cuando la API ya está lista
  const infoPlaylist = () => {
    try {
      if (!ytSeries || typeof ytSeries.getPlaylist !== "function") return null;
      const lista = ytSeries.getPlaylist();
      const indice = ytSeries.getPlaylistIndex();
      if (!lista || !lista.length || indice < 0) return null;
      return { indice, total: lista.length };
    } catch (e) {
      return null;
    }
  };

  const puedeRetroceder = () => {
    if (!serieActual) return false;
    if (serieActual.playlist) {
      const info = infoPlaylist();
      return !!info && info.indice > 0;
    }
    return parteActual > 0;
  };
  const puedeAvanzar = () => {
    if (!serieActual) return false;
    if (serieActual.playlist) {
      const info = infoPlaylist();
      return !!info && info.indice < info.total - 1;
    }
    return parteActual < serieActual.videos.length - 1;
  };

  const actualizarTitulo = () => {
    if (!tituloEl || !serieActual) return;
    let extra = "";
    if (serieActual.playlist) {
      const info = infoPlaylist();
      if (info && info.total > 1) extra = ` · Video ${info.indice + 1} de ${info.total}`;
    } else if (serieActual.videos.length > 1) {
      extra = ` · Parte ${parteActual + 1} de ${serieActual.videos.length}`;
    }
    tituloEl.textContent = `Reproduciendo ahora: ${serieActual.titulo}${extra}`;
  };

  const actualizarNav = () => {
    if (!serieActual) return;
    const indice = tarjetas.indexOf(serieActual.tarjeta);
    if (btnPrev) btnPrev.disabled = !(puedeRetroceder() || indice > 0);
    if (btnNext) btnNext.disabled = !(puedeAvanzar() || (indice !== -1 && indice < tarjetas.length - 1));
    actualizarTitulo();
  };

  const crearIframe = (serie, parte, conAutoplay) => {
    const iframe = document.createElement("iframe");
    iframe.id = "reproductor-series-tv-iframe";
    iframe.src = srcDe(serie, parte, conAutoplay);
    iframe.title = serie.titulo;
    iframe.setAttribute("allow", "autoplay; fullscreen");
    iframe.setAttribute("allowfullscreen", "");
    wrapper.innerHTML = "";
    wrapper.appendChild(iframe);
    return iframe;
  };

  // Conecta el iframe a la API de YouTube (para saber cuándo termina una parte
  // y para mover la playlist con nuestros botones). Si la API no carga, el
  // video se reproduce igual y solo los botones quedan navegando entre series.
  const conectarApi = (iframe) => {
    const miGeneracion = generacion;
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
    alEstarListaLaApiDeYoutube(() => {
      if (miGeneracion !== generacion) return;
      ytSeries = new YT.Player(iframe, {
        events: {
          onReady: () => { if (miGeneracion === generacion) actualizarNav(); },
          onStateChange: (evento) => {
            if (miGeneracion !== generacion) return;
            if (
              evento.data === YT.PlayerState.ENDED &&
              !serieActual.playlist &&
              parteActual < serieActual.videos.length - 1
            ) {
              cargarParte(parteActual + 1);
              return;
            }
            actualizarNav();
          },
        },
      });
    });
  };

  const cargarParte = (indice) => {
    if (!serieActual || serieActual.playlist) return;
    if (indice < 0 || indice >= serieActual.videos.length) return;
    parteActual = indice;
    // Si la API ya está lista se cambia el video sin recargar el iframe (esto
    // además permite que el autoplay entre partes no sea bloqueado por el navegador)
    if (ytSeries && typeof ytSeries.loadVideoById === "function") {
      try {
        ytSeries.loadVideoById(serieActual.videos[indice]);
      } catch (e) {
        generacion++;
        conectarApi(crearIframe(serieActual, indice, true));
      }
    } else {
      generacion++;
      ytSeries = null;
      conectarApi(crearIframe(serieActual, indice, true));
    }
    actualizarNav();
  };

  const cargarSerie = (tarjeta, conAutoplay, conScroll) => {
    const serie = leerSerie(tarjeta);
    if (!serie.playlist && !serie.videos.length) return;

    generacion++;
    serieActual = serie;
    parteActual = 0;
    ytSeries = null;

    const iframe = crearIframe(serie, 0, conAutoplay);
    conectarApi(iframe);

    if (sinopsisEl) sinopsisEl.textContent = serie.sinopsis;
    tarjetas.forEach((t) => t.classList.remove("activo"));
    tarjeta.classList.add("activo");
    actualizarNav();
    // Solo se sube al reproductor cuando se pide explícitamente (botón "Ver ahora"
    // o clic en escritorio). Los botones anterior/siguiente ya están pegados al
    // reproductor, así que ahí no hace falta mover la página.
    if (conScroll) reproductorSeriesTv.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ----- Celular / pantallas táctiles -----
  // Antes, tocar un cover te llevaba solo hasta el reproductor (arriba de todo) y
  // empezaba a reproducir, y así no se podía leer la sinopsis. Ahora, en celular,
  // tocar un cover solo muestra un cuadro con el título y la sinopsis justo
  // debajo de esa fila de covers, SIN mover la página. Ahí mismo hay un botón
  // "▶ Ver ahora" que recién ahí sube al reproductor y reproduce.
  // En PC (con mouse) todo sigue como antes: un clic reproduce arriba.
  const modoSeleccion = window.matchMedia("(max-width: 899px), (hover: none)");
  let panelInfo = null;

  const obtenerPanelInfo = () => {
    if (panelInfo) return panelInfo;
    panelInfo = document.createElement("div");
    panelInfo.className = "serie-info-panel";
    panelInfo.setAttribute("role", "region");
    panelInfo.setAttribute("aria-live", "polite");
    panelInfo.hidden = true;
    panelInfo.innerHTML =
      '<p class="serie-info-titulo"></p>' +
      '<p class="serie-info-sinopsis"></p>' +
      '<button type="button" class="btn-primario serie-info-ver">▶ Ver ahora</button>';
    panelInfo.querySelector(".serie-info-ver").addEventListener("click", () => {
      if (panelInfo._tarjeta) cargarSerie(panelInfo._tarjeta, true, true);
    });
    return panelInfo;
  };

  const ocultarInfo = () => {
    if (panelInfo) panelInfo.hidden = true;
    tarjetas.forEach((t) => t.classList.remove("seleccionada"));
  };

  const mostrarInfo = (tarjeta) => {
    const panel = obtenerPanelInfo();
    // Tocar de nuevo el mismo cover cierra el cuadro
    if (!panel.hidden && panel._tarjeta === tarjeta) {
      ocultarInfo();
      return;
    }
    tarjetas.forEach((t) => t.classList.remove("seleccionada"));
    tarjeta.classList.add("seleccionada");
    panel._tarjeta = tarjeta;
    panel.querySelector(".serie-info-titulo").textContent = tarjeta.dataset.titulo || "";
    panel.querySelector(".serie-info-sinopsis").textContent = tarjeta.dataset.sinopsis || "";

    // El cuadro se pone al final de la fila del cover tocado (ocupa todo el ancho)
    const grilla = tarjeta.parentElement;
    const columnas = Math.max(1, getComputedStyle(grilla).gridTemplateColumns.split(" ").length);
    const indice = tarjetas.indexOf(tarjeta);
    const ultimoDeLaFila = Math.min((Math.floor(indice / columnas) + 1) * columnas - 1, tarjetas.length - 1);
    tarjetas[ultimoDeLaFila].after(panel);
    panel.hidden = false;
  };

  tarjetas.forEach((tarjeta) => {
    tarjeta.addEventListener("click", () => {
      if (modoSeleccion.matches) mostrarInfo(tarjeta);
      else cargarSerie(tarjeta, true, true);
    });
  });

  // Venir desde el buscador de Series (/series-tv/#serie-nombre): se marca esa serie
  const abrirDesdeHash = () => {
    const coincidencia = location.hash.match(/^#serie-(.+)$/);
    if (!coincidencia) return;
    const tarjeta = document.getElementById("serie-" + coincidencia[1]);
    if (!tarjeta || !tarjetas.includes(tarjeta)) return;
    if (modoSeleccion.matches) {
      mostrarInfo(tarjeta);
    } else {
      cargarSerie(tarjeta, false, true);
    }
  };

  const irASerieVecina = (delta) => {
    const indice = tarjetas.indexOf(serieActual.tarjeta);
    const vecina = tarjetas[indice + delta];
    if (vecina) cargarSerie(vecina, true, false);
  };

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (puedeRetroceder()) {
        if (serieActual.playlist) ytSeries.previousVideo();
        else cargarParte(parteActual - 1);
      } else {
        irASerieVecina(-1);
      }
    });
  }
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (puedeAvanzar()) {
        if (serieActual.playlist) ytSeries.nextVideo();
        else cargarParte(parteActual + 1);
      } else {
        irASerieVecina(1);
      }
    });
  }

  // Estado inicial: la primera serie ya viene armada desde el servidor. Si es de
  // un solo video se deja tal cual; si tiene partes o es playlist se re-arma para
  // conectarla a la API (para las partes / playlist), sin autoplay.
  const tarjetaInicial = tarjetas.find((t) => t.classList.contains("activo")) || tarjetas[0];
  if (tarjetaInicial) {
    const inicial = leerSerie(tarjetaInicial);
    if (inicial.playlist || inicial.videos.length > 1) {
      cargarSerie(tarjetaInicial, false, false);
    } else {
      serieActual = inicial;
      parteActual = 0;
      actualizarNav();
    }
  }
  abrirDesdeHash();
  window.addEventListener("hashchange", abrirDesdeHash);
}

// Ficha de una serie con varias partes (/series/nombre-de-la-serie/): un solo
// reproductor y botones "Episodio anterior / siguiente" (no se lista cada parte,
// hay series con 20 o más). Al terminar una parte arranca la siguiente sola.
const fichaPartes = document.querySelector("[data-ficha-partes]");
if (fichaPartes) {
  const ids = (fichaPartes.dataset.videos || "").split(",").map((v) => v.trim()).filter(Boolean);
  const wrapper = fichaPartes.querySelector(".video-wrapper");
  const etiqueta = fichaPartes.querySelector("[data-ficha-parte-label]");
  const btnPrev = fichaPartes.querySelector('[data-nav="prev"]');
  const btnNext = fichaPartes.querySelector('[data-nav="next"]');
  const tituloSerie = (fichaPartes.querySelector("iframe") || {}).title || "";

  let parte = 0;
  let ytFicha = null;
  let generacionFicha = 0;

  const actualizarFicha = () => {
    if (etiqueta) etiqueta.textContent = `Parte ${parte + 1} de ${ids.length}`;
    if (btnPrev) btnPrev.disabled = parte <= 0;
    if (btnNext) btnNext.disabled = parte >= ids.length - 1;
  };

  const conectarFicha = (iframe) => {
    const miGeneracion = generacionFicha;
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
    alEstarListaLaApiDeYoutube(() => {
      if (miGeneracion !== generacionFicha) return;
      ytFicha = new YT.Player(iframe, {
        events: {
          onStateChange: (evento) => {
            if (miGeneracion !== generacionFicha) return;
            if (evento.data === YT.PlayerState.ENDED && parte < ids.length - 1) irAParte(parte + 1);
          },
        },
      });
    });
  };

  const irAParte = (indice) => {
    if (indice < 0 || indice >= ids.length) return;
    parte = indice;
    if (ytFicha && typeof ytFicha.loadVideoById === "function") {
      try {
        ytFicha.loadVideoById(ids[indice]);
        actualizarFicha();
        return;
      } catch (e) {
        /* si falla, se recrea el iframe más abajo */
      }
    }
    generacionFicha++;
    ytFicha = null;
    const iframe = document.createElement("iframe");
    iframe.id = "ficha-partes-iframe";
    iframe.src = `https://www.youtube.com/embed/${ids[indice]}?enablejsapi=1&playsinline=1&rel=0&autoplay=1`;
    iframe.title = `${tituloSerie} - Parte ${indice + 1}`;
    iframe.setAttribute("allow", "autoplay; fullscreen");
    iframe.setAttribute("allowfullscreen", "");
    wrapper.innerHTML = "";
    wrapper.appendChild(iframe);
    conectarFicha(iframe);
    actualizarFicha();
  };

  if (btnPrev) btnPrev.addEventListener("click", () => irAParte(parte - 1));
  if (btnNext) btnNext.addEventListener("click", () => irAParte(parte + 1));

  const iframeInicial = document.getElementById("ficha-partes-iframe");
  if (iframeInicial) conectarFicha(iframeInicial);
  actualizarFicha();
}
