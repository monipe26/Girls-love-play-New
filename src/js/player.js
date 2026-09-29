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
// Sinopsis debajo del reproductor (hoy solo la tiene /proximamente/). Si el
// video elegido no tiene sinopsis cargada, se deja vacía en vez de mostrar la
// del video anterior.
const reproductorPrincipalSinopsis = reproductorPrincipalSeccion
  ? reproductorPrincipalSeccion.querySelector("[data-reproductor-sinopsis]")
  : null;
function mostrarSinopsisPrincipal(texto) {
  if (reproductorPrincipalSinopsis) reproductorPrincipalSinopsis.textContent = texto || "";
}

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

// ===== Progreso de reproducción (sin cuenta ni contraseña) =====
// Se guarda en ESTE navegador (localStorage): en qué serie, qué parte y en qué
// minuto quedó cada persona. No viaja a ningún servidor. Si el navegador bloquea
// el almacenamiento (modo privado, etc.) simplemente no recuerda, sin romper nada.
const CLAVE_PROGRESO = "gl-progreso";
function leerTodoProgreso() {
  try { return JSON.parse(localStorage.getItem(CLAVE_PROGRESO)) || {}; } catch (e) { return {}; }
}
function leerProgreso(clave) { return leerTodoProgreso()[clave] || null; }
function escribirTodoProgreso(todo) {
  try {
    const claves = Object.keys(todo).sort((a, b) => todo[b].ts - todo[a].ts).slice(0, 30);
    const recortado = {};
    claves.forEach((k) => { recortado[k] = todo[k]; });
    localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(recortado));
  } catch (e) { /* sin almacenamiento: no pasa nada */ }
}
function guardarProgreso(clave, datos) {
  const todo = leerTodoProgreso();
  todo[clave] = Object.assign({}, datos, { ts: Date.now() });
  escribirTodoProgreso(todo);
}
function borrarProgreso(clave) {
  const todo = leerTodoProgreso();
  if (todo[clave]) { delete todo[clave]; escribirTodoProgreso(todo); }
}
function textoTiempo(seg) {
  seg = Math.max(0, Math.floor(seg || 0));
  const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), r = seg % 60;
  const rr = String(r).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${rr}` : `${m}:${rr}`;
}
// Cartelito "Seguí donde lo dejaste" debajo del video.
function mostrarAvisoContinuar(despuesDe, etiqueta, alContinuar, alEmpezar) {
  if (!despuesDe || !despuesDe.parentNode) return;
  const aviso = document.createElement("div");
  aviso.className = "aviso-continuar";
  aviso.innerHTML =
    '<span class="aviso-continuar-texto">▶ Seguí donde lo dejaste: <strong></strong></span>' +
    '<span class="aviso-continuar-botones">' +
    '<button type="button" class="btn-primario aviso-continuar-si">Continuar</button>' +
    '<button type="button" class="aviso-continuar-no">Empezar de cero</button></span>';
  aviso.querySelector("strong").textContent = etiqueta;
  aviso.querySelector(".aviso-continuar-si").addEventListener("click", () => { aviso.remove(); alContinuar(); });
  aviso.querySelector(".aviso-continuar-no").addEventListener("click", () => { aviso.remove(); alEmpezar(); });
  despuesDe.parentNode.insertBefore(aviso, despuesDe.nextSibling);
}
// Al terminar el ÚLTIMO episodio: el video queda quieto y pausado (no salta a otra cosa).
function dejarPausado(reproductor) {
  try {
    reproductor.seekTo(0, true);
    reproductor.pauseVideo();
    setTimeout(() => { try { reproductor.pauseVideo(); } catch (e) {} }, 400);
  } catch (e) { /* si la API no responde, no se toca nada */ }
}

let reproductorYtActivo = null;

function obtenerListaVideosDeLaGrilla() {
  return Array.from(document.querySelectorAll(".tarjeta-video")).map((tarjeta) => {
    const tituloEl = tarjeta.querySelector(".tarjeta-video-titulo");
    return {
      id: tarjeta.dataset.youtubeId,
      titulo: tituloEl ? tituloEl.textContent : "Video",
      sinopsis: tarjeta.dataset.sinopsis || "",
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
  mostrarSinopsisPrincipal(siguiente.sinopsis);
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
      mostrarSinopsisPrincipal(tarjeta.dataset.sinopsis);
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
// reproduce acá adentro — ahora es un link directo a /series-gl/, así que
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
  // Solo la página propia de cada serie (/series-gl/nombre/) recuerda el avance.
  const esPaginaSerie = reproductorSeriesTv.hasAttribute("data-autoplay");
  const claveSerie = esPaginaSerie ? location.pathname : null;
  let temporizador = null;
  let sinGuardarHasta = 0;

  const leerSerie = (tarjeta) => ({
    tarjeta,
    titulo: tarjeta.dataset.titulo || "",
    sinopsis: tarjeta.dataset.sinopsis || "",
    playlist: tarjeta.dataset.playlist || "",
    videos: (tarjeta.dataset.videos || "").split(",").map((v) => v.trim()).filter(Boolean),
  });

  const srcDe = (serie, parte, conAutoplay, inicioSeg) => {
    const comunes = `enablejsapi=1&playsinline=1&rel=0${conAutoplay ? "&autoplay=1" : ""}${inicioSeg ? "&start=" + Math.floor(inicioSeg) : ""}`;
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

  const crearIframe = (serie, parte, conAutoplay, inicioSeg) => {
    const iframe = document.createElement("iframe");
    iframe.id = "reproductor-series-tv-iframe";
    iframe.src = srcDe(serie, parte, conAutoplay, inicioSeg);
    iframe.title = serie.titulo;
    iframe.setAttribute("allow", "autoplay; fullscreen");
    iframe.setAttribute("allowfullscreen", "");
    wrapper.innerHTML = "";
    wrapper.appendChild(iframe);
    return iframe;
  };

  const guardarAvance = () => {
    if (!claveSerie || !serieActual || !ytSeries || typeof ytSeries.getCurrentTime !== "function") return;
    if (Date.now() < sinGuardarHasta) return;
    try {
      const t = ytSeries.getCurrentTime();
      if (!(t >= 3)) return;
      let indice = parteActual;
      if (serieActual.playlist) {
        const info = infoPlaylist();
        if (!info) return;
        indice = info.indice;
      }
      guardarProgreso(claveSerie, { i: indice, t: Math.floor(t), titulo: serieActual.titulo });
    } catch (e) { /* nada */ }
  };

  const detenerAlFinal = () => {
    sinGuardarHasta = Date.now() + 2500;
    if (claveSerie) borrarProgreso(claveSerie);
    dejarPausado(ytSeries);
    actualizarNav();
  };

  if (claveSerie) {
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") guardarAvance(); });
    window.addEventListener("pagehide", guardarAvance);
  }

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
            clearInterval(temporizador);
            temporizador = null;
            if (evento.data === YT.PlayerState.PLAYING) {
              temporizador = setInterval(guardarAvance, 5000);
            } else if (evento.data === YT.PlayerState.PAUSED) {
              guardarAvance();
            }
            if (evento.data === YT.PlayerState.ENDED) {
              // Quedan partes: arranca la siguiente sola
              if (!serieActual.playlist && parteActual < serieActual.videos.length - 1) {
                cargarParte(parteActual + 1);
                return;
              }
              // Era el último episodio: se queda pausado, no salta a otra serie
              const info = serieActual.playlist ? infoPlaylist() : null;
              if (!serieActual.playlist || (info && info.indice >= info.total - 1)) {
                detenerAlFinal();
                return;
              }
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
    if (claveSerie) guardarProgreso(claveSerie, { i: indice, t: 0, titulo: serieActual.titulo });
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

  // ----- Sinopsis y botón DENTRO del mismo cover -----
  // Reposo: el cover muestra solo la imagen.
  // PC: al pasar el mouse por el cover aparece la sinopsis y, debajo, el botón
  //     "Ver serie" (el hover lo maneja el CSS).
  // Celular (no hay hover): el primer toque en el cover abre esa misma capa.
  // Ese primer clic/toque NO abre el reproductor ni mueve la página: se puede leer
  // tranquilo. Recién al tocar "Ver serie" el botón cambia de color (aviso visual)
  // y ahí sí se sube al reproductor y se reproduce. No se abre nada debajo de la tarjeta.
  const hayHover = () => window.matchMedia("(hover: hover)").matches;

  const resetearTarjeta = (tarjeta) => {
    tarjeta.classList.remove("abierta", "elegida");
  };
  const cerrarTodas = (excepto) => {
    tarjetas.forEach((t) => { if (t !== excepto) resetearTarjeta(t); });
  };
  const abrirTarjeta = (tarjeta) => {
    cerrarTodas(tarjeta);
    tarjeta.classList.add("abierta");
  };

  tarjetas.forEach((tarjeta) => {
    tarjeta.addEventListener("click", (evento) => {
      // "Ver serie" es un enlace a la página propia de la serie: el navegador
      // lo abre solo, acá no hay que hacer nada.
      if (evento.target.closest(".tarjeta-serie-tv-btn")) return;
      // Toque en el resto del cover: abre / cierra la capa de sinopsis (sin reproducir)
      if (tarjeta.classList.contains("abierta")) resetearTarjeta(tarjeta);
      else abrirTarjeta(tarjeta);
    });

    tarjeta.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") { resetearTarjeta(tarjeta); return; }
      if ((evento.key === "Enter" || evento.key === " ") && evento.target === tarjeta) {
        evento.preventDefault();
        if (tarjeta.classList.contains("abierta")) resetearTarjeta(tarjeta);
        else abrirTarjeta(tarjeta);
      }
    });

    // Con mouse, al sacar el cursor la tarjeta vuelve a mostrar solo la imagen
    tarjeta.addEventListener("mouseleave", () => {
      if (hayHover() && !tarjeta.classList.contains("elegida")) resetearTarjeta(tarjeta);
    });
  });

  // Tocar fuera de las tarjetas cierra la que esté abierta
  document.addEventListener("click", (evento) => {
    if (!evento.target.closest(".tarjeta-serie-tv")) cerrarTodas();
  });

  // Venir desde el buscador de Series (/series-gl/#serie-nombre): se abre esa serie
  const abrirDesdeHash = () => {
    const coincidencia = location.hash.match(/^#serie-(.+)$/);
    if (!coincidencia) return;
    const tarjeta = document.getElementById("serie-" + coincidencia[1]);
    if (!tarjeta || !tarjetas.includes(tarjeta)) return;
    abrirTarjeta(tarjeta);
    tarjeta.scrollIntoView({ behavior: "smooth", block: "center" });
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
    // En la página propia de una serie (data-autoplay) el video arranca solo.
    const conAutoplayInicial = esPaginaSerie;
    // ¿Quedó a medio ver en este navegador? Entonces no arranca solo: ofrece continuar.
    let guardado = esPaginaSerie ? leerProgreso(claveSerie) : null;
    if (guardado && !inicial.playlist && guardado.i >= inicial.videos.length) guardado = null;
    const hayProgreso = !!guardado && (guardado.t >= 5 || guardado.i > 0);

    if (inicial.playlist || inicial.videos.length > 1 || esPaginaSerie) {
      cargarSerie(tarjetaInicial, conAutoplayInicial && !hayProgreso, false);
    } else {
      serieActual = inicial;
      parteActual = 0;
      actualizarNav();
    }

    if (hayProgreso) {
      let etiqueta = textoTiempo(guardado.t);
      if (inicial.playlist) etiqueta = `Video ${guardado.i + 1} · ${etiqueta}`;
      else if (inicial.videos.length > 1) etiqueta = `Parte ${guardado.i + 1} de ${inicial.videos.length} · ${etiqueta}`;

      const continuarDesde = () => {
        if (serieActual.playlist) {
          if (ytSeries && typeof ytSeries.loadPlaylist === "function") {
            try {
              ytSeries.loadPlaylist({ list: serieActual.playlist, listType: "playlist", index: guardado.i, startSeconds: guardado.t });
              actualizarNav();
              return;
            } catch (e) { /* sigue abajo */ }
          }
          generacion++;
          ytSeries = null;
          conectarApi(crearIframe(serieActual, 0, true));
          return;
        }
        const indice = Math.min(guardado.i, serieActual.videos.length - 1);
        parteActual = indice;
        if (ytSeries && typeof ytSeries.loadVideoById === "function") {
          try {
            ytSeries.loadVideoById({ videoId: serieActual.videos[indice], startSeconds: guardado.t });
            actualizarNav();
            return;
          } catch (e) { /* sigue abajo */ }
        }
        generacion++;
        ytSeries = null;
        conectarApi(crearIframe(serieActual, indice, true, guardado.t));
        actualizarNav();
      };
      const empezarDeCero = () => {
        borrarProgreso(claveSerie);
        try { if (ytSeries && ytSeries.playVideo) ytSeries.playVideo(); } catch (e) { /* nada */ }
      };
      mostrarAvisoContinuar(wrapper, etiqueta, continuarDesde, empezarDeCero);
    }

    // Página de la lista de series: tira "Seguir viendo" con lo que quedó a medias
    if (!esPaginaSerie) {
      const todo = leerTodoProgreso();
      const recientes = Object.keys(todo)
        .filter((k) => k.charAt(0) === "/" && todo[k].titulo)
        .sort((a, b) => todo[b].ts - todo[a].ts)
        .slice(0, 6);
      const formulario = document.querySelector("[data-buscador-series]");
      if (recientes.length && formulario) {
        const tira = document.createElement("details");
        tira.className = "seguir-viendo";
        const resumen = document.createElement("summary");
        resumen.textContent = `▶ Seguir viendo (${recientes.length})`;
        const lista = document.createElement("ul");
        recientes.forEach((k) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = k;
          a.textContent = `${todo[k].titulo} · ${textoTiempo(todo[k].t)}`;
          li.appendChild(a);
          lista.appendChild(li);
        });
        tira.appendChild(resumen);
        tira.appendChild(lista);
        formulario.parentNode.insertBefore(tira, formulario);
      }
    }
  }
  abrirDesdeHash();
  window.addEventListener("hashchange", abrirDesdeHash);
}

// Ficha de una serie con varias partes (/catalogo/nombre-de-la-serie/): un solo
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
  const claveFicha = location.pathname;
  let temporizadorFicha = null;
  let sinGuardarFichaHasta = 0;

  const guardarFicha = () => {
    if (!ytFicha || typeof ytFicha.getCurrentTime !== "function") return;
    if (Date.now() < sinGuardarFichaHasta) return;
    try {
      const t = ytFicha.getCurrentTime();
      if (!(t >= 3)) return;
      guardarProgreso(claveFicha, { i: parte, t: Math.floor(t), titulo: tituloSerie });
    } catch (e) { /* nada */ }
  };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") guardarFicha(); });
  window.addEventListener("pagehide", guardarFicha);

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
            clearInterval(temporizadorFicha);
            temporizadorFicha = null;
            if (evento.data === YT.PlayerState.PLAYING) temporizadorFicha = setInterval(guardarFicha, 5000);
            else if (evento.data === YT.PlayerState.PAUSED) guardarFicha();
            if (evento.data === YT.PlayerState.ENDED) {
              if (parte < ids.length - 1) {
                irAParte(parte + 1);
              } else {
                // Último episodio: queda pausado y se borra el avance guardado
                sinGuardarFichaHasta = Date.now() + 2500;
                borrarProgreso(claveFicha);
                dejarPausado(ytFicha);
              }
            }
          },
        },
      });
    });
  };

  const irAParte = (indice, inicioSeg) => {
    if (indice < 0 || indice >= ids.length) return;
    parte = indice;
    guardarProgreso(claveFicha, { i: indice, t: Math.floor(inicioSeg || 0), titulo: tituloSerie });
    if (ytFicha && typeof ytFicha.loadVideoById === "function") {
      try {
        ytFicha.loadVideoById(inicioSeg ? { videoId: ids[indice], startSeconds: inicioSeg } : ids[indice]);
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
    iframe.src = `https://www.youtube.com/embed/${ids[indice]}?enablejsapi=1&playsinline=1&rel=0&autoplay=1${inicioSeg ? "&start=" + Math.floor(inicioSeg) : ""}`;
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

  // ¿Quedó a medio ver en este navegador? Ofrece continuar desde ahí.
  const guardadoFicha = leerProgreso(claveFicha);
  if (guardadoFicha && guardadoFicha.i < ids.length && (guardadoFicha.t >= 5 || guardadoFicha.i > 0)) {
    mostrarAvisoContinuar(
      wrapper,
      `Parte ${guardadoFicha.i + 1} de ${ids.length} · ${textoTiempo(guardadoFicha.t)}`,
      () => irAParte(guardadoFicha.i, guardadoFicha.t),
      () => { borrarProgreso(claveFicha); }
    );
  }
}

// Ficha de Catálogo con UN solo video o una PLAYLIST de YouTube: también recuerda
// el minuto y se queda pausada al terminar (el tráiler no se toca).
const fichaSimple = document.querySelector('.ficha-reproductor[aria-label="Ver serie"]:not([data-ficha-partes])');
if (fichaSimple) {
  const iframeSimple = fichaSimple.querySelector("iframe");
  const wrapperSimple = fichaSimple.querySelector(".video-wrapper");
  const srcSimple = iframeSimple ? iframeSimple.getAttribute("src") || "" : "";
  const listaMatch = srcSimple.match(/[?&]list=([^&]+)/);
  const videoMatch = srcSimple.match(/embed\/([^?&]+)/);
  const idLista = listaMatch ? listaMatch[1] : "";
  const idVideo = !idLista && videoMatch ? videoMatch[1] : "";
  if (iframeSimple && srcSimple.indexOf("enablejsapi=1") !== -1 && (idLista || idVideo)) {
    const claveSimple = location.pathname;
    const tituloSimple = iframeSimple.title || "Serie";
    let ytSimple = null;
    let temporizadorSimple = null;
    let sinGuardarSimpleHasta = 0;

    const indiceLista = () => {
      try { return ytSimple.getPlaylistIndex(); } catch (e) { return -1; }
    };
    const guardarSimple = () => {
      if (!ytSimple || typeof ytSimple.getCurrentTime !== "function") return;
      if (Date.now() < sinGuardarSimpleHasta) return;
      try {
        const t = ytSimple.getCurrentTime();
        if (!(t >= 3)) return;
        const i = idLista ? indiceLista() : 0;
        if (i < 0) return;
        guardarProgreso(claveSimple, { i: i, t: Math.floor(t), titulo: tituloSimple });
      } catch (e) { /* nada */ }
    };
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") guardarSimple(); });
    window.addEventListener("pagehide", guardarSimple);

    alEstarListaLaApiDeYoutube(() => {
      ytSimple = new YT.Player(iframeSimple, {
        events: {
          onStateChange: (evento) => {
            clearInterval(temporizadorSimple);
            temporizadorSimple = null;
            if (evento.data === YT.PlayerState.PLAYING) temporizadorSimple = setInterval(guardarSimple, 5000);
            else if (evento.data === YT.PlayerState.PAUSED) guardarSimple();
            if (evento.data === YT.PlayerState.ENDED) {
              let esUltimo = !idLista;
              if (idLista) {
                try { esUltimo = indiceLista() >= ytSimple.getPlaylist().length - 1; } catch (e) { esUltimo = false; }
              }
              if (esUltimo) {
                sinGuardarSimpleHasta = Date.now() + 2500;
                borrarProgreso(claveSimple);
                dejarPausado(ytSimple);
              }
            }
          },
        },
      });
    });
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const scriptApi = document.createElement("script");
      scriptApi.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(scriptApi);
    }

    const guardadoSimple = leerProgreso(claveSimple);
    if (guardadoSimple && (guardadoSimple.t >= 5 || guardadoSimple.i > 0)) {
      const etiquetaSimple = (idLista ? `Video ${guardadoSimple.i + 1} · ` : "") + textoTiempo(guardadoSimple.t);
      mostrarAvisoContinuar(
        wrapperSimple,
        etiquetaSimple,
        () => {
          try {
            if (idLista) ytSimple.loadPlaylist({ list: idLista, listType: "playlist", index: guardadoSimple.i, startSeconds: guardadoSimple.t });
            else ytSimple.loadVideoById({ videoId: idVideo, startSeconds: guardadoSimple.t });
          } catch (e) {
            // La API todavía no estaba lista: se recarga el video con el minuto puesto
            iframeSimple.src = idLista
              ? `https://www.youtube.com/embed/videoseries?list=${idLista}&enablejsapi=1&playsinline=1&autoplay=1`
              : `https://www.youtube.com/embed/${idVideo}?enablejsapi=1&playsinline=1&autoplay=1&start=${guardadoSimple.t}`;
          }
        },
        () => { borrarProgreso(claveSimple); }
      );
    }
  }
}
