module.exports = function (eleventyConfig) {
  // Copiar archivos estáticos tal cual, sin procesarlos
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/manifest.webmanifest");
  eleventyConfig.addPassthroughCopy("src/sw.js");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Colección de Series GL, ordenada por título
  eleventyConfig.addCollection("series", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/series/*.njk");
  });

  // Colección de Noticias GL, más nueva primero
  eleventyConfig.addCollection("noticias", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/noticias/*.njk").sort((a, b) => b.date - a.date);
  });

  // Colección de Mundo GL, más nueva primero
  eleventyConfig.addCollection("mundoGl", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/mundo-gl/*.njk").sort((a, b) => b.date - a.date);
  });

  // Colección para el ticker de arriba de todo: mezcla Noticias + Mundo GL,
  // más nueva primero, para que el ticker siempre muestre lo último
  // publicado en vez de un texto fijo escrito a mano.
  eleventyConfig.addCollection("ticker", function (collectionApi) {
    const noticias = collectionApi.getFilteredByGlob("src/noticias/*.njk");
    const mundoGl = collectionApi.getFilteredByGlob("src/mundo-gl/*.njk");
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
