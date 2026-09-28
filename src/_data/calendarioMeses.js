// Arma el calendario mensual (semanas de lunes a domingo) a partir de
// calendario.json. Para agregar un estreno alcanza con sumar una línea en
// calendario.json: { "fecha": "2026-11-05", "titulo": "...", "tipo": "Serie",
// "portada": "/assets/images/series/xxx.jpg" }  (portada y "url" son opcionales).
// Se generan los meses desde el primer estreno hasta el último, sin huecos.
// El mes que abre en /calendario/ es el del día del build (o el más cercano
// que tenga estrenos); los demás quedan en /calendario/AAAA-MM/.
const eventos = require("./calendario.json");

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const dos = (n) => String(n).padStart(2, "0");
const fechaTexto = (d) => `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
const claveMes = (anio, mes) => `${anio}-${dos(mes + 1)}`;

module.exports = function () {
  const hoy = new Date();
  const indiceHoy = hoy.getUTCFullYear() * 12 + hoy.getUTCMonth();

  const porFecha = {};
  const indices = [];
  eventos.forEach((e) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha || "")) return;
    (porFecha[e.fecha] = porFecha[e.fecha] || []).push(e);
    indices.push(Number(e.fecha.slice(0, 4)) * 12 + Number(e.fecha.slice(5, 7)) - 1);
  });

  const desde = indices.length ? Math.min(...indices) : indiceHoy;
  const hasta = indices.length ? Math.max(...indices) : indiceHoy;
  const indiceDefault = Math.min(Math.max(indiceHoy, desde), hasta);

  const meses = [];
  for (let i = desde; i <= hasta; i++) {
    const anio = Math.floor(i / 12);
    const mes = i % 12;
    const primero = new Date(Date.UTC(anio, mes, 1));
    const diasDelMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    const offset = (primero.getUTCDay() + 6) % 7; // lunes = 0
    const celdas = Math.ceil((offset + diasDelMes) / 7) * 7;

    let total = 0;
    const semanas = [];
    for (let c = 0; c < celdas; c++) {
      const d = new Date(Date.UTC(anio, mes, 1 - offset + c));
      const otroMes = d.getUTCMonth() !== mes;
      const fecha = fechaTexto(d);
      const lista = otroMes ? [] : porFecha[fecha] || [];
      total += lista.length;
      if (c % 7 === 0) semanas.push([]);
      semanas[semanas.length - 1].push({
        fecha,
        dia: d.getUTCDate(),
        diaSemana: DIAS[c % 7],
        otroMes,
        eventos: lista,
      });
    }

    const clave = claveMes(anio, mes);
    meses.push({
      clave,
      indice: i,
      nombre: `${MESES[mes]} ${anio}`,
      semanas,
      total,
      predeterminado: i === indiceDefault,
      href: i === indiceDefault ? "/calendario/" : `/calendario/${clave}/`,
    });
  }

  meses.forEach((m, k) => {
    m.anterior = meses[k - 1] || null;
    m.siguiente = meses[k + 1] || null;
  });
  // Solo se guardan los datos que hacen falta de los vecinos (evita objetos circulares)
  meses.forEach((m) => {
    m.anterior = m.anterior && { nombre: m.anterior.nombre, href: m.anterior.href };
    m.siguiente = m.siguiente && { nombre: m.siguiente.nombre, href: m.siguiente.href };
  });
  return meses;
};
