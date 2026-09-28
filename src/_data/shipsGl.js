// Ships GL. Los 41 ships (nombres, series, descripción, Instagram) están guardados
// completos en shipsBase.json y no se borra nada. Acá se decide cuáles se muestran:
// solo los que YA tienen su foto en src/assets/images/ships/. Así, a medida que
// vas sumando fotos a esa carpeta (con el nombre que figura en "img" de shipsBase.json),
// cada ship aparece solo en la página, y nunca queda una tarjeta con la imagen rota.
const fs = require("fs");
const path = require("path");

const base = require("./shipsBase.json");
const carpetaImagenes = path.join(__dirname, "..", "assets", "images", "ships");

module.exports = function () {
  return base.filter((ship) => {
    const archivo = decodeURIComponent(path.basename(ship.img));
    return fs.existsSync(path.join(carpetaImagenes, archivo));
  });
};
