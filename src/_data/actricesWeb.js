// Páginas propias de cada actriz (/actrices/slug/). Se generan desde la misma lista del panel.
// REGLA ANTI-CONTENIDO-VACÍO: la página solo se indexa (y entra al sitemap) si la actriz tiene
// una biografía propia de 80+ caracteres. Si no, la página existe (se puede compartir el enlace)
// pero va con noindex, igual que los videos y ships sin texto.
const lista = require("./cms/actrices.json").items || [];
module.exports = function () {
  const usados = new Set();
  return lista
    .filter((a) => a && a.nombre)
    .map((a) => {
      let slug = String(a.slug || a.nombre).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const base = slug; let n = 2;
      while (usados.has(slug)) slug = base + "-" + n++;
      usados.add(slug);
      return { ...a, slug, noindexFinal: !!a.noindex || String(a.biografia || "").trim().length < 80 };
    });
};
