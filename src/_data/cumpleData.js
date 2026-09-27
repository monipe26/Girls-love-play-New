// Subconjunto liviano de actricesGl.json, solo con lo que necesita el aviso
// de cumpleaños del home (src/index.njk + js/cumpleanos.js). Se separa del
// JSON completo (que trae bio, series, etc.) para no mandar al navegador
// datos de más en una página que ya de por sí tiene bastante contenido.
const actrices = require("./actricesGl.json");

module.exports = actrices
  .filter((a) => a.nacimiento)
  .map((a) => ({
    slug: a.slug,
    nombre: a.nombre,
    foto: a.foto,
    instagram: a.instagram || "",
    nacimiento: a.nacimiento,
  }));
