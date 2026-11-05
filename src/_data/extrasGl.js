// Extras: la lista se edita desde el panel (Extras).
// Los videos marcados como "fijo" (📌) siempre van primero; el resto conserva el orden del panel.
module.exports = async () => {
  const items = await require("../../lib/videos").cargar("extras");
  return [...items].sort((a, b) => (b.fijo ? 1 : 0) - (a.fijo ? 1 : 0));
};
