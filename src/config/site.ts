/**
 * Punto unico de configuracion del sitio.
 *
 * Todo lo que el despacho puede querer cambiar sin tocar el resto del codigo
 * vive aqui o en variables de entorno. Los valores marcados con el prefijo
 * `[...]` o el comentario `VERIFICAR` son marcadores de posicion pendientes de
 * confirmar con el cliente: no se publican como datos reales en Schema.org.
 */

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

/**
 * Estrecha un `string` a `Locale`.
 *
 * Los parametros de ruta llegan como `string`, asi que sin esta guarda cada
 * pagina tendria que castear el idioma. Ademas es la validacion real: un
 * `/fr/...` inventado no pasa de aqui.
 */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Codigo de pais para construir el enlace de WhatsApp. Mexico = 52. */
const WHATSAPP_COUNTRY_CODE = "52";

/** Telefono tal y como aparece en la papeleria de AGM, sin lada internacional. */
const PHONE_NATIONAL = "3314526836";

/** Solo digitos, para los enlaces `tel:` y `wa.me`. */
const phoneDigits = `${WHATSAPP_COUNTRY_CODE}${PHONE_NATIONAL}`;

function formatPhone(national: string): string {
  // 33 1452 6836 -> agrupacion habitual en Mexico para lada de 2 digitos.
  const m = /^(\d{2})(\d{4})(\d{4})$/.exec(national);
  return m ? `${m[1]} ${m[2]} ${m[3]}` : national;
}

export const siteConfig = {
  /** Nombre legal / comercial completo. */
  name: "AGM Diseño y Proyección",
  /** Version corta para el logo y espacios reducidos. */
  shortName: "AGM",
  /** Bajada del logotipo. */
  tagline: "Diseño y Proyección",

  contact: {
    phoneNational: PHONE_NATIONAL,
    phoneDisplay: formatPhone(PHONE_NATIONAL),
    /** Formato E.164 para `tel:` y datos estructurados. */
    phoneE164: `+${phoneDigits}`,
    email: "agmdisenoyproyeccion@gmail.com",
    whatsapp: {
      number: phoneDigits,
      /** Mensaje corto que se precarga en WhatsApp. */
      prefilledMessage: {
        es: "Hola, me gustaría solicitar información sobre un proyecto.",
        en: "Hello, I would like information about a project.",
      },
    },
  },

  social: {
    facebook: {
      handle: "AGM Diseño y Proyección",
      url: "https://www.facebook.com/profile.php?id=61579444957462" as
        | string
        | null,
    },
    instagram: {
      handle: null as string | null,
      url: null as string | null,
    },
  },

  /**
   * Direccion confirmada por el cliente. Con `verified` en true se emite en
   * el JSON-LD y la UI deja de mostrar el marcador.
   */
  location: {
    verified: true,
    street: "Avenida Acueducto 829-B",
    neighborhood: "Col. Santa Margarita",
    postalCode: "45140",
    city: "Zapopan",
    state: "Jalisco",
    country: "México",
    countryCode: "MX",
    /** Zona de servicio declarada. Se usa en Schema.org `areaServed`. */
    areaServed: "Zapopan, Jalisco",
    /**
     * Coordenadas: siguen sin confirmar. No se deducen de la direccion —
     * un `geo` aproximado en datos estructurados manda a la gente al sitio
     * equivocado. Rellenar solo con el punto exacto que de el cliente.
     */
    geo: null as { lat: number; lng: number } | null,
    /** Horario de atencion. null = no se declara en Schema.org. */
    openingHours: null as string[] | null,
  },

  /**
   * Credito del desarrollo web en el footer. Poner `null` para ocultarlo.
   */
  credit: {
    label: "Diseño y desarrollo web",
    name: "DarkSack",
    url: "https://github.com/DarkSack",
  } as { label: string; name: string; url: string | null } | null,
} as const;

/** URL canonica del sitio. Se configura al contratar el dominio real. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** GA4. Sin valor (o con el placeholder) el script no se inyecta. */
export const gaMeasurementId = (() => {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!id || id === "G-XXXXXXXXXX") return null;
  return id;
})();

/** Codigo de verificacion de Google Search Console. */
export const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || null;

export function whatsappUrl(locale: Locale): string {
  const text = siteConfig.contact.whatsapp.prefilledMessage[locale];
  return `https://wa.me/${siteConfig.contact.whatsapp.number}?text=${encodeURIComponent(text)}`;
}

export const telHref = `tel:${siteConfig.contact.phoneE164}`;
export const mailtoHref = `mailto:${siteConfig.contact.email}`;
