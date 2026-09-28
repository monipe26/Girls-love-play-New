// Las 27 letras del filtro de Actrices GL (A–Z con la Ñ), cada una con sus
// actrices. Se usa para armar /actrices/letra/a/, /actrices/letra/b/, etc. y
// para dibujar la botonera de letras. Las letras sin actrices también existen
// (muestran un aviso), así se puede tocar cualquier letra del abecedario.
const actrices = require("./cms/actrices.json").items;

const LETRAS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

function inicial(nombre) {
  const primera = String(nombre || "").trim().charAt(0).toUpperCase();
  if (primera === "Ñ") return "Ñ";
  // "Á" -> "A", "É" -> "E", etc.
  return primera.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

module.exports = function () {
  return LETRAS.map((letra) => ({
    letra,
    slug: letra === "Ñ" ? "enie" : letra.toLowerCase(),
    actrices: actrices
      .filter((a) => inicial(a.nombre) === letra)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
  }));
};
