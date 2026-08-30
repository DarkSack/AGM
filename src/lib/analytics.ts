/**
 * Capa fina sobre GA4.
 *
 * Reglas:
 *   * Nombres de evento fijos y en snake_case, declarados en un unico sitio,
 *     para que los informes no se llenen de variantes.
 *   * Nunca se envia informacion personal identificable: ni nombre, ni correo,
 *     ni telefono, ni el texto del mensaje. Solo la categoria de la accion.
 *   * Si GA no esta configurado, `track` no hace nada.
 */

export const ANALYTICS_EVENTS = {
  whatsappClick: "whatsapp_click",
  phoneClick: "phone_click",
  emailClick: "email_click",
  facebookClick: "facebook_click",
  quoteCtaClick: "quote_cta_click",
  projectsCtaClick: "projects_cta_click",
  projectView: "project_view",
  contactFormSubmit: "contact_form_submit",
  contactFormError: "contact_form_error",
  languageChange: "language_change",
  themeChange: "theme_change",
  navClick: "nav_click",
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Solo valores no personales: origen del click, seccion, idioma, slug. */
export interface AnalyticsParams {
  location?: string;
  section?: string;
  locale?: string;
  slug?: string;
  value?: string;
}

type GtagArgs =
  | [command: "event", eventName: string, params?: AnalyticsParams]
  | [command: "config", targetId: string, params?: Record<string, unknown>]
  | [command: "js", date: Date];

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Envia un evento por el camino que este activo.
 *
 * Con GA4 directo existe `window.gtag`. Con Tag Manager no existe: ahi lo que
 * hay es `window.dataLayer`, y los eventos se empujan con la clave `event`,
 * que es sobre la que se configuran los activadores del contenedor.
 *
 * Si no hay ninguno de los dos, no hace nada. Nunca lanza: un fallo de
 * medicion no puede tumbar una interaccion del usuario.
 */
export function track(event: AnalyticsEvent, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", event, params);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event, ...params });
  }
}
