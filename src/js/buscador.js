// Buscador de Girls Love Play.
// Usa /search-index.json (se genera solo en cada build con todo el contenido:
// series, noticias, Mundo GL, actrices, OST, extras, etc.). Sirve para:
//   1) la página /buscar/ (el buscador de la lupa del menú de arriba),
//   2) el buscador de dentro de Series (/catalogo/ y /series-gl/), que solo
//      busca entre las series de esa sección.
(function () {
  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function escapar(texto) {
    return String(texto || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var indicePromesa = null;
  function cargarIndice() {
    if (!indicePromesa) {
      indicePromesa = fetch("/search-index.json").then(function (r) {
        if (!r.ok) throw new Error("No se pudo cargar el índice");
        return r.json();
      });
    }
    return indicePromesa;
  }

  // Todas las palabras escritas tienen que aparecer (sin importar tildes ni
  // mayúsculas). Los que la tienen en el título van primero.
  function buscar(indice, consulta, tipos) {
    var palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
    if (!palabras.length) return [];
    var frase = palabras.join(" ");
    var resultados = [];
    indice.forEach(function (item) {
      if (tipos && tipos.indexOf(item.k) === -1) return;
      var titulo = normalizar(item.t);
      var resto = normalizar((item.x || "") + " " + (item.k || ""));
      var puntos = 0;
      for (var i = 0; i < palabras.length; i++) {
        if (titulo.indexOf(palabras[i]) !== -1) puntos += 3;
        else if (resto.indexOf(palabras[i]) !== -1) puntos += 1;
        else return;
      }
      if (titulo.indexOf(frase) !== -1) puntos += 10;
      if (titulo.indexOf(frase) === 0) puntos += 5;
      resultados.push({ item: item, puntos: puntos });
    });
    resultados.sort(function (a, b) { return b.puntos - a.puntos; });
    return resultados.map(function (r) { return r.item; });
  }

  // ---------- 1) Página /buscar/ ----------
  var pagina = document.querySelector("[data-buscador-principal]");
  if (pagina) {
    var input = pagina.querySelector("input[name='q']");
    var estado = pagina.querySelector("[data-buscar-estado]");
    var lista = pagina.querySelector("[data-buscar-resultados]");
    var consultaUrl = new URLSearchParams(location.search).get("q") || "";
    input.value = consultaUrl;

    var pintar = function (consulta) {
      if (!consulta.trim()) {
        estado.textContent = "Escribí algo para buscar series, noticias, actrices y más.";
        lista.innerHTML = "";
        return;
      }
      estado.textContent = "Buscando…";
      cargarIndice().then(function (indice) {
        var encontrados = buscar(indice, consulta).slice(0, 60);
        if (!encontrados.length) {
          estado.textContent = "No encontramos resultados para “" + consulta + "”. Probá con otra palabra.";
          lista.innerHTML = "";
          return;
        }
        estado.textContent = encontrados.length + (encontrados.length === 1 ? " resultado" : " resultados") + " para “" + consulta + "”";
        lista.innerHTML = encontrados.map(function (r) {
          var img = r.i
            ? '<img src="' + escapar(r.i) + '" alt="" width="90" height="70" loading="lazy">'
            : '<span class="buscar-sin-img" aria-hidden="true">▶</span>';
          var texto = r.x ? '<span class="buscar-texto">' + escapar(String(r.x).slice(0, 140)) + "</span>" : "";
          return '<li><a href="' + escapar(r.u) + '">' + img +
            '<span class="buscar-info"><span class="badge badge-rosa">' + escapar(r.k) + "</span>" +
            '<span class="buscar-titulo">' + escapar(r.t) + "</span>" + texto + "</span></a></li>";
        }).join("");
      }).catch(function () {
        estado.textContent = "No se pudo cargar el buscador. Probá recargar la página.";
      });
    };

    pintar(consultaUrl);
  }

  // ---------- 2) Buscador de dentro de Series ----------
  var buscadorSeries = document.querySelector("[data-buscador-series]");
  if (buscadorSeries) {
    var tipo = buscadorSeries.getAttribute("data-tipo"); // "Catálogo" o "Series"
    var campo = buscadorSeries.querySelector("input");
    var cajaResultados = document.querySelector("[data-resultados-series]");
    var listado = document.querySelector("[data-lista-series]");
    var mensaje = buscadorSeries.querySelector("[data-series-estado]");
    var esSeriesTv = tipo === "Series";

    buscadorSeries.addEventListener("submit", function (e) { e.preventDefault(); });

    var mostrarTodo = function () {
      cajaResultados.hidden = true;
      cajaResultados.innerHTML = "";
      listado.hidden = false;
      mensaje.textContent = "";
    };

    campo.addEventListener("input", function () {
      var consulta = campo.value;
      if (!consulta.trim()) { mostrarTodo(); return; }
      cargarIndice().then(function (indice) {
        // Se ignora si mientras tanto el usuario borró o cambió el texto
        if (campo.value !== consulta) return;
        var encontrados = buscar(indice, consulta, [tipo]);
        listado.hidden = true;
        cajaResultados.hidden = false;
        if (!encontrados.length) {
          mensaje.textContent = "No hay series que coincidan con “" + consulta + "”.";
          cajaResultados.innerHTML = "";
          return;
        }
        mensaje.textContent = encontrados.length + (encontrados.length === 1 ? " serie encontrada" : " series encontradas");
        cajaResultados.innerHTML =
          '<div class="grid-tarjetas' + (esSeriesTv ? " grid-series-tv" : "") + '">' +
          encontrados.map(function (r) {
            return '<a href="' + escapar(r.u) + '" class="tarjeta-serie">' +
              '<img src="' + escapar(r.i) + '" alt="Portada de ' + escapar(r.t) + '" width="300" height="450" loading="lazy">' +
              '<span class="tarjeta-titulo">' + escapar(r.t) + (r.a ? " (" + escapar(r.a) + ")" : "") + "</span></a>";
          }).join("") + "</div>";
      }).catch(function () {
        mensaje.textContent = "No se pudo cargar el buscador. Probá recargar la página.";
      });
    });
  }
})();
