// Extras agrupados por empresa (botones de filtro de /extra/ y páginas /extra/empresa/<empresa>/).
// La empresa de cada video se decide en lib/videos.js (ver ahí cómo). Los botones y las
// empresas se editan desde el panel: Extras > Empresas.
const { slugify, NOMBRE_OTROS } = require("../../lib/videos");

const POR_PAGINA = 8; // igual que /extra/

module.exports = async () => {
  const items = await require("./extrasGl.js")();

  const grupos = new Map();
  items.forEach((v) => {
    const nombre = v.empresa || NOMBRE_OTROS;
    if (!grupos.has(nombre)) grupos.set(nombre, []);
    grupos.get(nombre).push(v);
  });

  // Más videos primero; "Otros" siempre al final.
  const lista = [...grupos].map(([nombre, videos]) => ({ nombre, videos }));
  lista.sort((a, b) => {
    if (a.nombre === NOMBRE_OTROS) return 1;
    if (b.nombre === NOMBRE_OTROS) return -1;
    return b.videos.length - a.videos.length || a.nombre.localeCompare(b.nombre);
  });

  // Dirección de cada empresa: única y solo con letras/números/guiones.
  const usados = new Set(["todos"]);
  lista.forEach((e, i) => {
    let base = slugify(e.nombre), slug, n = 2;
    if (!/[a-z]/.test(base)) base = "canal-" + (i + 1); // nombres sin letras latinas (ej. tailandés)
    slug = base;
    while (usados.has(slug)) slug = base + "-" + n++;
    usados.add(slug);
    e.slug = slug;
  });

  const filtros = [{ nombre: "Todos", slug: "todos", url: "/extra/", total: items.length }].concat(
    lista.map((e) => ({ nombre: e.nombre, slug: e.slug, url: "/extra/empresa/" + e.slug + "/", total: e.videos.length }))
  );

  const paginas = [];
  lista.forEach((e) => {
    const total = Math.max(1, Math.ceil(e.videos.length / POR_PAGINA));
    const urls = Array.from({ length: total }, (_, k) => "/extra/empresa/" + e.slug + "/" + (k ? k + 1 + "/" : ""));
    for (let k = 0; k < total; k++) {
      paginas.push({
        empresa: e.nombre,
        slug: e.slug,
        videos: e.videos,
        items: e.videos.slice(k * POR_PAGINA, (k + 1) * POR_PAGINA),
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
};
