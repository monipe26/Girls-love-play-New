// Ships GL: la lista se edita desde el panel (Ships). Solo se muestran los ships
// cuya foto existe en src/assets/images/ships/ (así nunca queda una tarjeta con la imagen rota).
const fs = require("fs");
const path = require("path");
const lista = require("./cms/ships.json").items || [];
const carpeta = path.join(__dirname, "..", "assets", "images", "ships");
module.exports = function () {
  const usados = new Set();
  return lista
    .filter((ship) => {
      const ok = ship.img && fs.existsSync(path.join(carpeta, decodeURIComponent(path.basename(ship.img))));
      if (!ok) console.warn(`[ships] "${ship.ship}" no se muestra: falta la foto ${ship.img}`);
      return ok;
    })
    .map((ship) => {
      let slug = String(ship.slug || ship.ship).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const base = slug; let n = 2;
      while (usados.has(slug)) slug = base + "-" + n++;
      usados.add(slug);
      return { ...ship, slug, noindexFinal: !!ship.noindex || String(ship.descripcion || "").trim().length < 80 };
    });
};
