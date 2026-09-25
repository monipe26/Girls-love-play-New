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
