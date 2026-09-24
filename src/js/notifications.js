// Este archivo se completará en la Fase 10 del proyecto (Notificaciones push).
// Para funcionar de verdad necesita, además de este código:
//   - un servicio de push (por ejemplo un endpoint serverless en Cloudflare Workers)
//   - claves VAPID públicas/privadas
//   - un lugar donde guardar las suscripciones de cada usuario
//   - conectar el flujo de publicación (Decap CMS -> GitHub -> build) con el envío del push
//
// Por ahora dejamos preparada solo la función que pide permiso al usuario,
// sin activarla todavía en ninguna página.

async function pedirPermisoNotificaciones() {
  if (!("Notification" in window)) return "no-soportado";
  if (Notification.permission === "granted") return "concedido";

  const resultado = await Notification.requestPermission();
  return resultado; // "granted" | "denied" | "default"
}

// Se exporta para usarla más adelante desde un botón "Activar notificaciones"
window.pedirPermisoNotificaciones = pedirPermisoNotificaciones;
