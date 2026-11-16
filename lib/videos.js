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

// ---------- Extras por empresa ----------
// Cada video de Extras se asigna a una "empresa" (botón de filtro en /extra/):
//  1) Si en el panel se eligió una Empresa en el video, se usa esa.
//  2) Si no, se mira el canal de YouTube y se busca en la lista de Empresas del panel
//     (Extras > Empresas): si el nombre del canal CONTIENE alguna de las palabras de
//     una empresa, va a esa empresa.
//  3) Si no coincide con ninguna, la empresa es el nombre del canal. Los canales con
//     pocos videos (menos que "mínimo") se juntan en "Otros".
const EMPRESAS_JSON = path.join(__dirname, "..", "src", "_data", "cms", "extrasEmpresas.json");
const NOMBRE_OTROS = "Otros";

function normalizar(t) {
  return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function leerEmpresas() {
  try {
    const d = JSON.parse(fs.readFileSync(EMPRESAS_JSON, "utf8"));
    const empresas = (d.empresas || [])
      .filter((e) => e && String(e.nombre || "").trim())
      .map((e) => ({
        nombre: String(e.nombre).trim(),
        palabras: (e.canales || []).map(normalizar).filter(Boolean),
      }));
    const minimo = Number.isFinite(Number(d.minimo)) && Number(d.minimo) > 0 ? Number(d.minimo) : 3;
    return { empresas, minimo };
  } catch (e) {
    return { empresas: [], minimo: 3 };
  }
}

function asignarEmpresas(videos) {
  const { empresas, minimo } = leerEmpresas();
  const fijas = new Set(empresas.map((e) => e.nombre));
  videos.forEach((v) => {
    const manual = String(v.empresa || "").trim();
    if (manual) { v.empresa = manual; v.empresaFija = true; return; }
    const canal = normalizar(v.canal);
    const hallada = canal && empresas.find((e) => e.palabras.some((p) => canal.includes(p)));
    if (hallada) { v.empresa = hallada.nombre; v.empresaFija = true; return; }
    v.empresa = String(v.canal || "").trim() || NOMBRE_OTROS;
    v.empresaFija = false;
  });
  const cuenta = new Map();
  videos.forEach((v) => cuenta.set(v.empresa, (cuenta.get(v.empresa) || 0) + 1));
  videos.forEach((v) => {
    if (!v.empresaFija && !fijas.has(v.empresa) && cuenta.get(v.empresa) < minimo) v.empresa = NOMBRE_OTROS;
  });
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
          canal: it.canal || (yt && yt.canal) || "",
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
      if (clave === "extras" || clave === "proximamente") asignarEmpresas(completos);
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

module.exports = { SECCIONES, cargar, todosConSeccion, slugify, NOMBRE_OTROS };
