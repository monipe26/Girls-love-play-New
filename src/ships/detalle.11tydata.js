// Datos calculados de la página de cada ship.
module.exports = {
  eleventyComputed: {
    title: (d) => "Ship " + d.ship.ship + " (" + d.ship.nombres + ")",
    seoTitle: (d) => d.ship.seoTitle || "",
    description: (d) => {
      if (d.ship.seoDescription) return d.ship.seoDescription;
      const t = String(d.ship.descripcion || "").trim();
      return t.length > 155 ? t.slice(0, 154).trim() + "…" : t;
    },
    imagen: (d) => d.ship.ogImage || d.ship.img,
    noindex: (d) => !!d.ship.noindexFinal,
    seccionNombre: () => "Ships GL",
    seccionUrl: () => "/ships/",
  },
};
