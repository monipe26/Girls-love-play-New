const site = require("./src/_data/site.js");

const optimizarImagenes = require("./optimizar-imagenes.js");

module.exports = function (eleventyConfig) {
  // Al terminar el build, optimiza automáticamente las imágenes publicadas.
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    await optimizarImagenes(dir.output);
  });

  // Copiar archivos estáticos tal cual, sin procesarlos
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/manifest.webmanifest");
  eleventyConfig.addPassthroughCopy("src/sw.js");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy("src/_redirects");

  // El panel (/admin/) se copia tal cual, pero NO es una página del sitio:
  // no debe entrar en colecciones ni en el sitemap.
  eleventyConfig.ignores.add("src/admin/**");

  // Colección de Series GL, ordenada por título
  eleventyConfig.addCollection("series", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/catalogo/*.njk")
      .filter((serie) => !serie.data.oculta);
  });

  // Colección de Noticias GL, más nueva primero
  // Datos para el Sorteo GL (/minijuegos/): una lista liviana con las series del
  // Catálogo. Se arma sola al generar el sitio, así que cuando agregues una serie
  // nueva al catálogo el sorteo la suma automáticamente (igual que hacía el viejo
  // con series.json).
  eleventyConfig.addCollection("sorteoSeries", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/catalogo/series/*.md")
      .filter((serie) => serie.data.slug && serie.data.titulo)
      .map((serie) => ({
        titulo: serie.data.titulo,
        genero: serie.data.genero || "GL",
        img: serie.data.portada || "",
        url: "/catalogo/" + serie.data.slug + "/",
      }));
  });

  // Catálogo (fichas de src/catalogo/series/*.md): la más nueva cargada primero
  eleventyConfig.addCollection("catalogoSeries", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/catalogo/series/*.md")
      .sort((a, b) => new Date(b.data.agregada || 0) - new Date(a.data.agregada || 0));
  });

  eleventyConfig.addCollection("noticias", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/noticias/*.md").sort((a, b) => b.date - a.date);
  });

  // Colección de Mundo GL, más nueva primero
  eleventyConfig.addCollection("mundoGl", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/mundo-gl/*.md").sort((a, b) => b.date - a.date);
  });

  // Colección para el ticker de arriba de todo: mezcla Noticias + Mundo GL,
  // más nueva primero, para que el ticker siempre muestre lo último
  // publicado en vez de un texto fijo escrito a mano.
  eleventyConfig.addCollection("ticker", function (collectionApi) {
    const noticias = collectionApi.getFilteredByGlob("src/noticias/*.md");
    const mundoGl = collectionApi.getFilteredByGlob("src/mundo-gl/*.md");
    return [...noticias, ...mundoGl].sort((a, b) => b.date - a.date);
  });

  // Filtro para recortar una lista a N elementos (limit) - nunjucks no lo trae por defecto
  eleventyConfig.addFilter("limit", function (arreglo, cantidad) {
    if (!arreglo) return [];
    return arreglo.slice(0, cantidad);
  });

  // Filtro para mostrar fechas en formato "23 Septiembre, 2026"
  eleventyConfig.addFilter("readableDate", function (dateObj) {
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const d = new Date(dateObj);
    return `${d.getDate()} ${meses[d.getMonth()]}, ${d.getFullYear()}`;
  });

  // Filtro simple para recortar texto (sinopsis breve, etc.)
  eleventyConfig.addFilter("truncar", function (texto, cantidad) {
    if (!texto) return "";
    if (texto.length <= cantidad) return texto;
    return texto.slice(0, cantidad).trim() + "…";
  });

  // Filtro para sacar las primeras letras (iniciales) de una lista de actrices,
  // sin repetidas y ordenadas alfabéticamente. Usado en el filtro A-Z de Actrices GL.
  eleventyConfig.addFilter("primerasLetras", function (lista) {
    if (!lista) return [];
    const letras = lista
      .map((item) => (item.nombre || "").trim().charAt(0).toUpperCase())
      .filter(Boolean);
    return [...new Set(letras)].sort();
  });

  // Slug de la letra inicial de una actriz (para /actrices/letra/x/): "Ñ" -> "enie",
  // las vocales con tilde pierden la tilde. Mismo criterio que _data/letrasActrices.js
  eleventyConfig.addFilter("letraActrizSlug", function (nombre) {
    const primera = String(nombre || "").trim().charAt(0).toUpperCase();
    if (primera === "Ñ") return "enie";
    return primera.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  });

  // Calcula la edad actual a partir de una fecha de nacimiento (así no queda
  // una edad fija "pegada" en el JSON que se desactualiza con el tiempo).
  // Usa UTC en los dos lados de la resta para que no cambie según el huso
  // horario del servidor donde corre el build.
  eleventyConfig.addFilter("edad", function (fechaNacimiento) {
    if (!fechaNacimiento) return "";
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
    const noCumplioAunEsteAnio =
      hoy.getUTCMonth() < nacimiento.getUTCMonth() ||
      (hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() < nacimiento.getUTCDate());
    if (noCumplioAunEsteAnio) edad--;
    return edad;
  });

  // Muestra una fecha de nacimiento en formato "10 de abril de 1998"
  eleventyConfig.addFilter("fechaLarga", function (fecha) {
    if (!fecha) return "";
    const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const d = new Date(fecha);
    return `${d.getUTCDate()} de ${meses[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  });

  // Calcula minutos de lectura a partir del cuerpo del artículo (cuenta
  // palabras del HTML ya renderizado, sacando las etiquetas). Se usa en
  // los artículos de Noticias y Mundo GL (layout articulo.njk).
  eleventyConfig.addFilter("tiempoLectura", function (html) {
    if (!html) return "1 min de lectura";
    const texto = String(html).replace(/<[^>]*>/g, " ");
    const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
    const minutos = Math.max(1, Math.round(palabras / 200));
    return `${minutos} min de lectura`;
  });


  // ---------- ARTÍCULOS (2B) ----------
  // Ancho y alto reales de una imagen del sitio (para width/height y og:image).
  // Se limita al ancho máximo que deja la optimización automática, con la misma proporción.
  const fs = require("fs");
  const path = require("path");
  const MAX_ANCHO = 1600;
  eleventyConfig.addFilter("imgSize", function (ruta) {
    try {
      if (!ruta || /^https?:/i.test(ruta)) return null;
      const archivo = path.join("src", decodeURI(String(ruta)));
      const b = fs.readFileSync(archivo);
      let w, h;
      if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") { w = b.readUInt32BE(16); h = b.readUInt32BE(20); }
      else if (b[0] === 0xff && b[1] === 0xd8) {
        let i = 2;
        while (i < b.length) {
          if (b[i] !== 0xff) { i++; continue; }
          const m = b[i + 1];
          if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; }
          i += 2 + b.readUInt16BE(i + 2);
        }
      } else if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
        const t = b.toString("ascii", 12, 16);
        if (t === "VP8X") { w = 1 + b.readUIntLE(24, 3); h = 1 + b.readUIntLE(27, 3); }
        else if (t === "VP8 ") { w = b.readUInt16LE(26) & 0x3fff; h = b.readUInt16LE(28) & 0x3fff; }
        else if (t === "VP8L") { const v = b.readUInt32LE(21); w = (v & 0x3fff) + 1; h = ((v >> 14) & 0x3fff) + 1; }
      }
      if (!w || !h) return null;
      if (w > MAX_ANCHO) { h = Math.round((h * MAX_ANCHO) / w); w = MAX_ANCHO; }
      return { w, h };
    } catch (e) { return null; }
  });

  // Noticias relacionadas: primero las elegidas a mano (slugs, hasta 3) y después
  // las últimas de la misma sección hasta completar 3. Nunca incluye la propia nota.
  eleventyConfig.addFilter("relacionadas", function (lista, urlActual, manuales) {
    const otras = (lista || []).filter((n) => n.url !== urlActual);
    const elegidas = [];
    (manuales || []).slice(0, 3).forEach((slug) => {
      const n = otras.find((x) => x.fileSlug === slug || (x.data && x.data.slug === slug));
      if (n && !elegidas.includes(n)) elegidas.push(n);
    });
    for (const n of otras) { if (elegidas.length >= 3) break; if (!elegidas.includes(n)) elegidas.push(n); }
    return elegidas;
  });

  // Otros videos de la misma sección (para "Más videos" en la página de cada video)
  eleventyConfig.addFilter("mismosVideos", function (lista, clave, slug, cantidad) {
    return (lista || []).filter((v) => v.clave === clave && v.slug !== slug).slice(0, cantidad || 4);
  });

  // ---------- SEO ----------
  // Convierte una ruta (/assets/...) en dirección completa (https://girlsloveplay.com/assets/...).
  // Codifica espacios y tildes de los nombres de archivo sin duplicar lo ya codificado.
  eleventyConfig.addFilter("absoluteUrl", function (ruta) {
    if (!ruta) return "";
    const r = String(ruta);
    if (/^https?:\/\//i.test(r)) return r;
    let limpia = r;
    try { limpia = encodeURI(decodeURI(r)); } catch (e) { limpia = r; }
    return site.url + (limpia.startsWith("/") ? "" : "/") + limpia;
  });

  // Fecha en formato ISO completo (2026-05-16T00:00:00.000Z), para datos estructurados
  eleventyConfig.addFilter("isoDate", function (fecha) {
    const d = new Date(fecha);
    return isNaN(d) ? "" : d.toISOString();
  });

  // Fecha corta AAAA-MM-DD, para el sitemap
  eleventyConfig.addFilter("fechaCorta", function (fecha) {
    const d = new Date(fecha);
    return isNaN(d) ? "" : d.toISOString().slice(0, 10);
  });

  // Convierte un objeto a JSON seguro para pegar dentro de <script type="application/ld+json">
  eleventyConfig.addFilter("jsonld", function (obj) {
    return JSON.stringify(obj).replace(/</g, "\\u003c");
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
      output: "_site"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
