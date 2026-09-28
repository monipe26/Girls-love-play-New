// Optimización automática de imágenes, al generar el sitio.
// Las fotos ORIGINALES quedan intactas en GitHub; la versión liviana se escribe
// solo en la carpeta publicada (_site), con la MISMA dirección. Así no hay que
// achicar ni comprimir nada a mano antes de subir fotos desde el panel.
//  - Achica solo si la foto es más grande que el máximo de su carpeta (nunca agranda).
//  - Mantiene la proporción (no estira ni deforma) y respeta la rotación del celular.
//  - Calidad 82: buen equilibrio entre peso y nitidez.
//  - Solo reemplaza la imagen si la nueva pesa menos.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const MAXIMOS = [
  ["images/actrices", 700],
  ["images/series", 700],
  ["images/calendario", 500],
  ["images/publicidad", 1200],
  ["images/noticias", 1600],
  ["images/mundo-gl", 1600],
];
const MAXIMO_POR_DEFECTO = 1600;
const CALIDAD = 82;
const EXTENSIONES = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function recorrer(dir, salida = []) {
  if (!fs.existsSync(dir)) return salida;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(ruta, salida);
    else if (EXTENSIONES.has(path.extname(e.name).toLowerCase())) salida.push(ruta);
  }
  return salida;
}

async function optimizarUna(archivo, base) {
  const rel = path.relative(base, archivo).split(path.sep).join("/");
  if (rel.startsWith("icons/")) return null; // íconos de la app: no tocar
  const ancho = (MAXIMOS.find(([carpeta]) => rel.startsWith(carpeta + "/")) || [])[1] || MAXIMO_POR_DEFECTO;
  const ext = path.extname(archivo).toLowerCase();
  const original = fs.readFileSync(archivo);
  let img = sharp(original, { failOn: "none" }).rotate();
  const meta = await sharp(original, { failOn: "none" }).metadata();
  if (meta.width && meta.width > ancho) img = img.resize({ width: ancho, withoutEnlargement: true, fit: "inside" });
  if (ext === ".png") img = img.png({ compressionLevel: 9, effort: 7 });
  else if (ext === ".webp") img = img.webp({ quality: CALIDAD });
  else img = img.jpeg({ quality: CALIDAD, mozjpeg: true, progressive: true });
  const nuevo = await img.toBuffer();
  if (nuevo.length < original.length * 0.95) return { rel, antes: original.length, despues: nuevo.length, buffer: nuevo };
  return null;
}

module.exports = async function optimizarImagenes(carpetaSalida) {
  const base = path.join(carpetaSalida, "assets");
  const archivos = recorrer(base);
  let ahorro = 0, tocadas = 0, fallidas = 0;
  const cola = archivos.slice();
  const trabajadores = Array.from({ length: 4 }, async () => {
    while (cola.length) {
      const a = cola.shift();
      try {
        const r = await optimizarUna(a, base);
        if (r) { fs.writeFileSync(a, r.buffer); ahorro += r.antes - r.despues; tocadas++; }
      } catch (e) { fallidas++; console.warn("[imágenes] no se pudo optimizar " + a + ": " + e.message); }
    }
  });
  await Promise.all(trabajadores);
  console.log(`[imágenes] ${archivos.length} revisadas, ${tocadas} optimizadas, ${(ahorro / 1048576).toFixed(1)} MB menos${fallidas ? ", " + fallidas + " sin cambios por error" : ""}`);
};
