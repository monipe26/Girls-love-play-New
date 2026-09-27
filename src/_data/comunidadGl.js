// Comunidad GL: acá solo hace falta poner el ID de YouTube de cada video
// (lo que viene después de "v=" en la URL). Al generar el sitio, este
// archivo le pregunta a YouTube el título y el canal de cada uno
// automáticamente (oEmbed, sin necesidad de API key). Están puestos del
// más nuevo (arriba) al más viejo (abajo): comunidadGl[0] es el que se
// usa como "Reproduciendo ahora" en /comunidad/.
//
// Para agregar un video nuevo: sumar su ID arriba de todo en esta lista.
// Para sacar uno: borrar su línea. Nada más.
const ids = [
  "NHEIMwddsNk",
  "ynu0IgMnvP4",
  "S1RJIUquQNw",
  "07lA6tgjWdY",
  "Ks-a0A8IeZQ",
  "Q3EdOV87E14",
  "vtyUawHCbEc",
  "c5Z4TtrIXcI",
  "rmjhUfGblsg",
  "Oys-JKFDi6I",
  "FY_UColcMDc",
  "IOFprq5UfwM",
  "JnyrUiMeHqo",
  "0GALf9zof5E",
  "ZZfk7QDx_kU",
  "NBA7TbOdxR8",
  "nkwwTjPt2Lc",
  "MEu9JBMic3w",
  "_cXUI8Jtjn4",
  "STVqrStyr6I",
  "rqHYlB51-oo",
];

// Le pregunta a YouTube (oEmbed, público, sin API key) el título y el
// nombre del canal de un video a partir de su ID. Si por lo que sea no
// se puede (video borrado/privado, sin internet en el momento del build),
// no rompe el sitio: usa un texto genérico para ese video en particular.
async function obtenerDatosVideo(youtubeId) {
  try {
    const respuesta = await fetch(
      `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${youtubeId}`
    );
    if (!respuesta.ok) throw new Error("YouTube respondió " + respuesta.status);
    const datos = await respuesta.json();
    return { titulo: datos.title, canal: datos.author_name, youtubeId };
  } catch (error) {
    console.warn(`[comunidadGl] No se pudo obtener info de YouTube para ${youtubeId}:`, error.message);
    return { titulo: "Video de la comunidad GL", canal: "Girls Love Play", youtubeId };
  }
}

module.exports = async function () {
  return Promise.all(ids.map(obtenerDatosVideo));
};
