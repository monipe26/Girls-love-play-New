// Ayudante común de los videos de YouTube (Extras, OST, Comunidad, Próximamente).
// - Lee la lista que se edita desde el panel (src/_data/cms/*.json).
// - Si un video no tiene título (o canal), se lo pregunta a YouTube (oEmbed,
//   sin API key). Si YouTube no responde, usa un texto genérico y NO rompe el sitio.
// - Se asegura de que cada video tenga un slug válido y único dentro de su sección.
const fs = require("fs");
const path = require("path");

const SECCIONES = {
  extras:       { json: "extras.json",       base: "extra",        nombre: "Extras",       volver: "/extra/",        prefijo: "extra", generico: "Video extra GL" },
  ost:          { json: "ost.json",          base: "ost",          nombre: "OST",          volver: "/ost/",          prefijo: "ost",   generico: "OST GL" },
  comunidad:    { json: "comunidad.json",    base: "comunidad",    nombre: "Comunidad",    volver: "/comunidad/",    prefijo: "video", generico: "Video de la comunidad GL" },
  proximamente: { json: "proximamente.json", base: "proximamente", nombre: "Próximamente", volver: "/proximamente/", prefijo: "video", generico: "Próximamente en GL" },
};

const cacheYoutube = new Map();
function datosYoutube(id) {
  if (!cacheYoutube.has(id)) {
    cacheYoutube.set(id, (async () => {
      try {
        const r = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`);
        if (!r.ok) throw new Error("YouTube respondió " + r.status);
        const d = await r.json();
        return { titulo: d.title, canal: d.author_name };
      } catch (e) {
        console.warn(`[videos] No se pudo obtener info de YouTube para ${id}: ${e.message}`);
        return null;
      }
    })());
  }
  return cacheYoutube.get(id);
}

function slugify(t) {
  return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const cacheSecciones = new Map();
function cargar(clave) {
  if (!cacheSecciones.has(clave)) {
    cacheSecciones.set(clave, (async () => {
      const cfg = SECCIONES[clave];
      const archivo = path.join(__dirname, "..", "src", "_data", "cms", cfg.json);
      const items = (JSON.parse(fs.readFileSync(archivo, "utf8")).items || []).filter((i) => i && i.youtubeId);
      const completos = await Promise.all(items.map(async (it) => {
        const yt = it.titulo && it.canal ? null : await datosYoutube(it.youtubeId);
        return {
          ...it,
          base: cfg.base,
          titulo: it.titulo || (yt && yt.titulo) || cfg.generico,
          canal: it.canal || (yt && yt.canal) || "Girls Love Play",
          // La página del video solo se indexa si tiene texto propio (mín. 80 caracteres) y no está marcada noindex
          noindexFinal: !!it.noindex || String(it.descripcion || it.sinopsis || "").trim().length < 80,
        };
      }));
      const usados = new Set();
      completos.forEach((v) => {
        let base = slugify(v.slug) || slugify(cfg.prefijo + "-" + v.youtubeId) || cfg.prefijo;
        let slug = base, n = 2;
        while (usados.has(slug)) slug = base + "-" + n++;
        if (slug !== base) console.warn(`[videos] Slug repetido en ${cfg.nombre}: "${base}" pasó a "${slug}". Cambialo en el panel.`);
        usados.add(slug);
        v.slug = slug;
      });
      return completos;
    })());
  }
  return cacheSecciones.get(clave);
}

async function todosConSeccion() {
  const salida = [];
  for (const clave of Object.keys(SECCIONES)) {
    const cfg = SECCIONES[clave];
    (await cargar(clave)).forEach((v) => salida.push({ ...v, clave, base: cfg.base, seccion: cfg.nombre, volver: cfg.volver }));
  }
  return salida;
}

module.exports = { SECCIONES, cargar, todosConSeccion, slugify };
