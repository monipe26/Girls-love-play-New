// Próximamente agrupado por empresa (desplegable de /proximamente/ y páginas /proximamente/empresa/<empresa>/).
// Usa la misma lista de empresas que Extras (panel: Extras > Empresas).
const { agrupar } = require("../../lib/empresasGrupos");

module.exports = async () => agrupar(await require("./proximosGl.js")(), "/proximamente");
