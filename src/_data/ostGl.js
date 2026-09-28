// OST: la lista se edita desde el panel (OST). Cada video: ID de YouTube + slug.
// El título y el canal salen solos de YouTube si no se completan.
module.exports = () => require("../../lib/videos").cargar("ost");
