// Extras agrupados por empresa (desplegable de /extra/ y páginas /extra/empresa/<empresa>/).
// Las empresas se editan desde el panel: Extras > Empresas.
const { agrupar } = require("../../lib/empresasGrupos");

module.exports = async () => agrupar(await require("./extrasGl.js")(), "/extra");
