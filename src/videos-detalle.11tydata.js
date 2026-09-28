// Datos calculados de la página de cada video (título, descripción, imagen, noindex).
module.exports = {
  eleventyComputed: {
    title: (d) => d.v.titulo,
    seoTitle: (d) => d.v.seoTitle || "",
    description: (d) => {
      if (d.v.seoDescription) return d.v.seoDescription;
      const t = String(d.v.descripcion || d.v.sinopsis || "").trim();
      if (t) return t.length > 155 ? t.slice(0, 154).trim() + "…" : t;
      return d.v.titulo + " — " + d.v.seccion + " de Girls Love Play. Mirá el video y descubrí más contenido GL.";
    },
    imagen: (d) => d.v.ogImage || "https://i.ytimg.com/vi/" + d.v.youtubeId + "/hqdefault.jpg",
    noindex: (d) => !!d.v.noindexFinal,
    seccionNombre: (d) => d.v.seccion,
    seccionUrl: (d) => d.v.volver,
  },
};
