// Agrupa videos por empresa/productora para los botones de filtro (Extras y Próximamente).
// La empresa de cada video se decide en lib/videos.js (asignarEmpresas).
// base = "/extra" o "/proximamente". Devuelve:
//   filtros: lista para el desplegable (Todas + una por empresa)
//   paginas: una entrada por cada página /<base>/empresa/<empresa>/[n/]
const { slugify, NOMBRE_OTROS } = require("./videos");

function agrupar(items, base, porPagina = 8) {
  const grupos = new Map();
  items.forEach((v) => {
    const nombre = v.empresa || NOMBRE_OTROS;
    if (!grupos.has(nombre)) grupos.set(nombre, []);
    grupos.get(nombre).push(v);
  });

  // De la A a la Z (más fácil de encontrar en el desplegable); "Otros" siempre al final.
  const lista = [...grupos].map(([nombre, videos]) => ({ nombre, videos }));
  lista.sort((a, b) => {
    if (a.nombre === NOMBRE_OTROS) return 1;
    if (b.nombre === NOMBRE_OTROS) return -1;
    return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
  });

  // Dirección de cada empresa: única y solo con letras/números/guiones.
  const usados = new Set(["todos"]);
  lista.forEach((e, i) => {
    let base2 = slugify(e.nombre), slug, n = 2;
    if (!/[a-z]/.test(base2)) base2 = "canal-" + (i + 1); // nombres sin letras latinas (ej. tailandés)
    slug = base2;
    while (usados.has(slug)) slug = base2 + "-" + n++;
    usados.add(slug);
    e.slug = slug;
  });

  const filtros = [{ nombre: "Todos", slug: "todos", url: base + "/", total: items.length }].concat(
    lista.map((e) => ({ nombre: e.nombre, slug: e.slug, url: base + "/empresa/" + e.slug + "/", total: e.videos.length }))
  );

  const paginas = [];
  lista.forEach((e) => {
    const total = Math.max(1, Math.ceil(e.videos.length / porPagina));
    const urls = Array.from({ length: total }, (_, k) => base + "/empresa/" + e.slug + "/" + (k ? k + 1 + "/" : ""));
    for (let k = 0; k < total; k++) {
      paginas.push({
        empresa: e.nombre,
        slug: e.slug,
        videos: e.videos,
        items: e.videos.slice(k * porPagina, (k + 1) * porPagina),
        numero: k + 1,
        total,
        url: urls[k],
        urls,
        anterior: k > 0 ? urls[k - 1] : "",
        siguiente: k < total - 1 ? urls[k + 1] : "",
      });
    }
  });

  return { filtros, paginas };
}

module.exports = { agrupar };
