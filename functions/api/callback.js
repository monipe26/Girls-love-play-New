// Paso 2 del login: GitHub vuelve acá con un código; lo cambiamos por
// un token y se lo entregamos al panel (Decap CMS).
// Variables necesarias en Cloudflare: GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookie = request.headers.get("Cookie") || "";
  const guardado = (cookie.match(/(?:^|;\s*)oauth_state=([^;]+)/) || [])[1];

  if (!code || !state || !guardado || state !== guardado) {
    return respuesta("error", { message: "Login inválido o vencido. Volvé a intentar." });
  }

  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`,
    }),
  });
  const datos = await r.json();

  if (!datos.access_token) {
    return respuesta("error", { message: datos.error_description || "GitHub no entregó el token." });
  }
  return respuesta("success", { token: datos.access_token, provider: "github" });
}

// Devuelve la mini-página que le pasa el resultado al panel y se cierra.
function respuesta(estado, contenido) {
  const mensaje = `authorization:github:${estado}:${JSON.stringify(contenido)}`;
  const html = `<!doctype html><html><body><script>
(function () {
  var mensaje = ${JSON.stringify(mensaje)};
  function recibir(e) {
    if (e.origin !== window.location.origin) return;
    window.opener.postMessage(mensaje, e.origin);
    window.removeEventListener("message", recibir, false);
  }
  window.addEventListener("message", recibir, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Set-Cookie": "oauth_state=; HttpOnly; Secure; Path=/; Max-Age=0",
    },
  });
}
