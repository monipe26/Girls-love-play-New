module.exports = {
  nombre: "Girls Love Play",
  url: "https://girlsloveplay.com",
  descripcion: "Series, noticias y todo sobre el mundo Girls Love (GL).",
  email: "contacto@girlsloveplay.com",
  // Logo del sitio (también sirve de imagen por defecto cuando una página no tiene una propia)
  logo: "/assets/logo/logo.png",
  imagenDefecto: "/assets/logo/logo.png",
  twitter: "@girlslove_play",
  // Redes oficiales (se usan en los datos estructurados de la organización)
  redes: [
    "https://www.instagram.com/girlslove.play",
    "https://www.tiktok.com/@girlslove.play",
    "https://www.facebook.com/girlsloveplayoficial/",
    "https://x.com/girlslove_play",
    "https://t.me/girlsloveplay",
    "https://ko-fi.com/girlsloveplay"
  ],
  // Serie que se muestra en "Serie destacada" del sidebar (slug). Si está vacío o no existe, se usa la más nueva con sinopsis.
  serieDestacada: "",
  anioActual: new Date().getFullYear()
};
