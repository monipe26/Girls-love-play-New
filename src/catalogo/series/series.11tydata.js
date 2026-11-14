// Datos comunes de TODAS las fichas del Catálogo (src/catalogo/series/*.md).
// Cada ficha se edita desde el panel (Catálogo). Acá se arman los datos automáticos.

function idYoutube(valor) {
  if (!valor) return "";
  const v = String(valor).trim();
  const m = v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{11}$/.test(v) ? v : "";
}

// Una ficha está "completa" cuando tiene sinopsis, país, episodios y reparto.
// Mientras esté incompleta NO se muestra en Google (noindex) ni va al sitemap.
function estaCompleta(d) {
  return !!(d.sinopsis && d.pais && d.episodios && Array.isArray(d.reparto) && d.reparto.length);
}

// Reparto listo para mostrar. Acepta que el nombre se escriba con link al estilo
// [Lee Soo Ha](https://mydramalist.com/...) (Juyeon): separa nombre, link y apodo.
function repartoFicha(d) {
  return (Array.isArray(d.reparto) ? d.reparto : []).map((r) => {
    let actriz = String(r.actriz || "").trim();
    let enlace = String(r.enlace || "").trim();
    let apodo = r.apodo ? String(r.apodo).trim() : "";
    const m = actriz.match(/^\[(.+?)\]\((https?:\/\/[^)\s]+)\)\s*(?:\(([^)]+)\))?$/);
    if (m) {
      actriz = m[1].trim();
      if (!enlace) enlace = m[2];
      if (m[3] && !apodo) apodo = m[3].trim();
    }
    if (!/^https?:\/\//i.test(enlace)) enlace = "";
    return { actriz, apodo, personaje: r.personaje || "", enlace };
  });
}

module.exports = {
  layout: "catalogo-ficha.njk",
  ogTipo: "serie",
  permalink: "/catalogo/{{ slug }}/",
  eleventyComputed: {
    title: (d) => d.titulo,
    imagen: (d) => d.portada,
    anio: (d) => {
      const m = String(d.fechaEmision || "").match(/\d{4}/);
      return m ? m[0] : "";
    },
    completa: (d) => estaCompleta(d),
    repartoFicha: (d) => repartoFicha(d),
    noindex: (d) => d.noindex === true || !estaCompleta(d),
    description: (d) => {
      if (d.seoDescription) return d.seoDescription;
      if (d.sinopsis) {
        const t = String(d.sinopsis).trim();
        return t.length > 155 ? t.slice(0, 155).trim() + "…" : t;
      }
      return "Ficha de " + d.titulo + ": datos, reparto y tráiler de esta serie GL.";
    },
    trailerId: (d) => idYoutube(d.trailer),
  },
};
