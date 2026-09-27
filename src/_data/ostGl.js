// OST GL: mismo mecanismo que Comunidad — acá solo va el ID de YouTube de
// cada video. Al generar el sitio, se le pregunta a YouTube el título y el
// canal de cada uno automáticamente. Están del más nuevo (arriba) al más
// viejo (abajo): ostGl[0] es el que se usa como "Reproduciendo ahora" en
// /ost/ y en el cuadrito del sidebar.
//
// Para agregar un video nuevo: sumar su ID arriba de todo en esta lista.
// Para sacar uno: borrar su línea. Nada más.
const ids = [
  "tsT3erJbOGk",
  "L69ERxj9Jsc",
  "NLFp8C87ElQ",
  "AUPbHx7J8iQ",
  "Zl7muC7hZNg",
  "Wver7Ic7iqo",
  "rR-DSlgeXMI",
  "4hhrLFozrGg",
  "TNbvfhxCBtQ",
  "fRiq7IlCO3c",
  "hpbb1xLc-tE",
  "Ra0ZOFiHoEI",
  "jad-V_nyvaY",
  "V0b-54I-1-0",
  "AdqIf57MDv8",
  "D7O-CA32bzI",
  "vyZCwAPMSlo",
  "uYPWFkDaakI",
  "9dxckG0eJ44",
  "U2ayv8Kaln0",
  "i_SF8XZasmU",
  "SAPDFLMMMfQ",
  "TTfF-pAf774",
  "MP4Ciew8Xok",
  "CUA6nuvO_4Y",
  "4d8hxSf67rE",
  "dE4yy4ULCXI",
  "Sxh28YQGSq0",
  "354VXHaqaE4",
  "qWfsiUJtIIw",
  "Kdyph-0nKwc",
  "MeEqOOH-2eE",
  "4hFyFMp9ml4",
  "27klSLsVCR4",
  "xWvhq6bsde8",
  "NTXo8HpAugU",
  "cOvvSf-XhE4",
  "qjuXnqA4KRY",
  "sKg2_PDMUGc",
  "2Xm56pL34ek",
  "mzqW0nn06SA",
  "qrNXPKYGG0s",
  "CKclkO6HHrY",
  "BDpn6St06PI",
  "XMKdChy6zw0",
  "xZTTYmcFFhA",
  "0n9zZ1aOWFk",
  "zqFYE77Atys",
  "4XccBfDMRY0",
  "RHnPq3Z0A8c",
  "t8kp6Cmc5cc",
  "abBL28Pd8lo",
  "2jXDADfnHfY",
  "8SPnMnuqzYE",
  "nCGvg31zNdk",
  "xnOOAzX9nK4",
  "sb9Z79klTv4",
  "LD_xc6k8-LE",
  "La9v6B9sO9o",
  "gdBlUZYXrmQ",
  "1i-MKyKVA5o",
  "2T0klTd-Usg",
  "YU5UQ8n01uI",
  "rJd6iOk83Qk",
  "l_BwV0pudj4",
  "9SSyRcIy588",
  "zlxDTsddL5E",
  "pkMJUwNM1HA",
  "VIe0Mem7OeM",
  "gMk8FeC5nhE",
  "JyEQ7ZX9iwk",
  "YS4fkF86RdI",
  "Ku1uSXFAQgQ",
  "8RI11ofpeks",
  "JAVLBnd4cdg",
  "6c_5xPYxmy4",
  "sqc_BI1rbd0",
  "vNhZ0uFddl4",
  "Jpih2TjgZGM",
  "FD-ZpEg0l5I",
  "fxedUgaP1vQ",
  "YF30_ksQ8qg",
  "2BUT8xRvZZQ",
  "ID_pd9Ni3nk",
  "kHs3CWRe5PA",
  "MM7Yad1P_2A",
  "XVVqVZKVsxw",
  "BG_yN4HCr44",
  "_J8SM9jqjow",
  "saSPFSwHbrk",
  "XxdiiAnTUxo",
  "U1piZH2CNXA",
  "hsvQg5JSDHU",
  "IsKtf2DoCBU",
  "6w8X4Tfcgu0",
  "I_wl4yurk1U",
  "_b3LpCOe1vs",
  "5C_vJyhQuQY",
  "AMzlTbjBLDo",
  "gzfHZqHFxi0",
  "HI8z03beTtI",
  "pgzaWboZUSg",
  "MNEc23m2ons",
  "QcsBxsmMrtA",
  "gdSsAoYOeLw",
  "9ae1xxRggbs",
  "Fu7d92Q3o0o",
  "n1ih3Ptg9Bo",
  "DoTt57nnMg8",
  "xmBeo_FRhvg",
  "8AUbwoXi7RQ",
  "j2SPeBnDNtE",
  "NBw1jF342vw",
  "LAZpP0_w23k",
  "DznDzQd8C_A",
  "wzRI0JYUJFM",
  "U1piZH2CNXA",
  "fWvIbVEf7Yc",
  "BKBA4FqZwEg",
  "lvBRWn8qldg",
];

// Le pregunta a YouTube (oEmbed, público, sin API key) el título y el
// nombre del canal de un video a partir de su ID. Si por lo que sea no
// se puede (video borrado/privado, sin internet en el momento del build),
// no rompe el sitio: usa un texto genérico para ese video en particular.
async function obtenerDatosVideo(youtubeId) {
  try {
    const respuesta = await fetch(
      `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${youtubeId}`
    );
    if (!respuesta.ok) throw new Error("YouTube respondió " + respuesta.status);
    const datos = await respuesta.json();
    return { titulo: datos.title, canal: datos.author_name, youtubeId };
  } catch (error) {
    console.warn(`[ostGl] No se pudo obtener info de YouTube para ${youtubeId}:`, error.message);
    return { titulo: "OST GL", canal: "Girls Love Play", youtubeId };
  }
}

module.exports = async function () {
  return Promise.all(ids.map(obtenerDatosVideo));
};
