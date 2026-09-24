// Al usar la paginación (que recarga la página con la URL siguiente),
// esto asegura que la vista aterrice arriba de la sección y no quede
// a mitad de página cuando el contenido nuevo carga.
if (window.location.hash === "" && document.referrer.includes(window.location.origin)) {
  const seccion = document.querySelector(".seccion");
  if (seccion) seccion.scrollIntoView({ behavior: "instant", block: "start" });
}
