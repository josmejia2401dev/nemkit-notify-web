import { ApiEndpointConfig } from "@nemkit/foundation-web";

/**
 * Servidor de casa expuesto por Tailscale Funnel.
 * Mientras esté vacío, la app usa solo Render y el failover queda inactivo.
 */
const HOME_API_ORIGIN = "https://gateway.tail224652.ts.net";

/**
 * Notificaciones aún no está desplegado en Render. Al publicarlo, define aquí
 * su origen (por ejemplo `https://nemkit-notify-api.onrender.com`) y quedará
 * como nodo de respaldo sin tocar el resto de la configuración.
 */
const RENDER_ORIGIN = "https://nemkit-notify-api.onrender.com";

/** Prefijo propio del MS de notificaciones detrás del gateway Tailscale. */
const API_PREFIX = "/api/v1/notify";

const homeEndpoints: ApiEndpointConfig[] = HOME_API_ORIGIN
  ? [
      {
        name: "casa",
        baseUrl: `${HOME_API_ORIGIN}${API_PREFIX}`,
        readyUrl: `${HOME_API_ORIGIN}${API_PREFIX}/ready`,
        priority: 1,
      },
    ]
  : [];

const renderEndpoints: ApiEndpointConfig[] = RENDER_ORIGIN
  ? [
      {
        name: "render",
        baseUrl: `${RENDER_ORIGIN}${API_PREFIX}`,
        readyUrl: `${RENDER_ORIGIN}${API_PREFIX}/ready`,
        // Si hay servidor de casa es el respaldo; si no, es el único nodo.
        priority: homeEndpoints.length ? 2 : 1,
      },
    ]
  : [];

export const environment = {
  production: true,
  apiEndpoints: [...homeEndpoints, ...renderEndpoints],
  /** Corte corto del primario: red local o Tailscale. */
  probeTimeoutMs: 2_500,
  /** Render free duerme; su primer request puede tardar ~90 s. */
  coldStartTimeoutMs: 90_000,
  /** Cada 30 s se revisa el primario (2 probes sanos ⇒ vuelve en ≤ 60 s). */
  primaryRecheckMs: 30_000,
  appName: "Nemkit Notify",
  tokenRefreshThresholdMs: 2 * 60 * 1000,
};
