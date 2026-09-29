// Datos calculados de la página de cada actriz.
module.exports = {
  eleventyComputed: {
    title: (d) => d.actriz.nombre + (d.actriz.apodo ? " (" + d.actriz.apodo + ")" : "") + " - Actriz GL",
    seoTitle: () => "",
    description: (d) => {
      const a = d.actriz;
      const bio = String(a.biografia || "").trim();
      if (bio.length >= 80) return bio.length > 155 ? bio.slice(0, 154).trim() + "…" : bio;
      const partes = [a.nombre + (a.apodo ? ", conocida como " + a.apodo + "," : "") + " es una actriz" + (a.nacionalidad ? " de nacionalidad " + String(a.nacionalidad).toLowerCase() : "") + " del género GL."];
      if (a.series && a.series.length) partes.push("Series: " + a.series.map((s) => s.titulo).slice(0, 3).join(", ") + ".");
      const t = partes.join(" ");
      return t.length > 155 ? t.slice(0, 154).trim() + "…" : t;
    },
    imagen: (d) => d.actriz.foto,
    noindex: (d) => !!d.actriz.noindexFinal,
    seccionNombre: () => "Actrices GL",
    seccionUrl: () => "/actrices/",
  },
};
