// Botones de "Compartir esta nota": copiar link y, en celulares, el menú de compartir del sistema.
// WhatsApp, Facebook, X y Telegram son links normales y no necesitan JavaScript.
document.querySelectorAll("[data-compartir]").forEach((caja) => {
  const url = caja.dataset.url || location.href;
  const titulo = caja.dataset.titulo || document.title;
  const estado = caja.querySelector("[data-compartir-estado]");
  const aviso = (texto) => {
    if (!estado) return;
    estado.textContent = texto;
    setTimeout(() => { estado.textContent = ""; }, 2500);
  };

  // Copiar link
  const btnCopiar = caja.querySelector("[data-compartir-copiar]");
  btnCopiar?.addEventListener("click", async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Navegadores viejos: copia usando un campo de texto temporal
        const campo = document.createElement("textarea");
        campo.value = url;
        campo.setAttribute("readonly", "");
        campo.style.position = "fixed";
        campo.style.opacity = "0";
        document.body.appendChild(campo);
        campo.select();
        const ok = document.execCommand("copy");
        campo.remove();
        if (!ok) throw new Error("no se pudo copiar");
      }
      aviso("✅ ¡Link copiado! Ya lo podés pegar donde quieras.");
    } catch (e) {
      aviso("No se pudo copiar. Mantené apretado el link de la barra del navegador para copiarlo.");
    }
  });

  // "Más opciones": solo aparece si el celular/navegador tiene menú de compartir (Instagram, Mensajes, etc.)
  const btnNativo = caja.querySelector("[data-compartir-nativo]");
  if (btnNativo && navigator.share) {
    btnNativo.hidden = false;
    btnNativo.addEventListener("click", () => {
      navigator.share({ title: titulo, url }).catch(() => {});
    });
  }
});
