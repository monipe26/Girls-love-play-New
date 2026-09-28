const fs = require("fs");
// Cuenta las palabras del texto de un artículo (sin el front matter ni el formato).
module.exports = function contarPalabras(data) {
  try {
    const crudo = fs.readFileSync(data.page.inputPath, "utf8").replace(/^---[\s\S]*?\n---/, "");
    const texto = crudo.replace(/<[^>]*>/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/[#*_>\[\]()`-]/g, " ");
    return texto.trim().split(/\s+/).filter(Boolean).length;
  } catch (e) { return 0; }
};
