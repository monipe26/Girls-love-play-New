// Paso 1 del login: manda a la persona a GitHub para que autorice.
// Variables necesarias en Cloudflare: GITHUB_CLIENT_ID
export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) {
    return new Response("Falta configurar GITHUB_CLIENT_ID en Cloudflare.", { status: 500 });
  }
  const url = new URL(request.url);
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/api/callback`,
    scope: "repo,user",
    state,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      // El "state" evita que alguien ajeno complete el login
      "Set-Cookie": `oauth_state=${state}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=600`,
    },
  });
}
