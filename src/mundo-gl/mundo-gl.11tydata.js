const contarPalabras = require("../../contar-palabras.js");
module.exports = { eleventyComputed: { palabras: (data) => contarPalabras(data) } };
