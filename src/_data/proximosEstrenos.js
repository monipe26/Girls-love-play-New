// Los próximos 4 estrenos para el widget "Calendario de estrenos" del home
// (barra lateral). Sale de calendario.json: los que todavía no pasaron, y si
// no queda ninguno, los 4 más recientes. Se actualiza en cada build.
const eventos = require("./calendario.json");
const MESES_CORTOS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

module.exports = function () {
  const hoy = new Date().toISOString().slice(0, 10);
  const validos = eventos
    .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.fecha || ""))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  const proximos = validos.filter((e) => e.fecha >= hoy);
  const elegidos = proximos.length ? proximos.slice(0, 4) : validos.slice(-4);
  return elegidos.map((e) => ({
    dia: Number(e.fecha.slice(8, 10)),
    mes: MESES_CORTOS[Number(e.fecha.slice(5, 7)) - 1],
    titulo: e.titulo,
    tipo: e.tipo || "Serie",
  }));
};
