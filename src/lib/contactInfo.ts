import { siteConfig } from "@/config/site";
import type { SiteSettings } from "@/types/content";

export interface ResolvedContact {
  phoneDisplay: string;
  phoneHref: string;
  whatsappNumber: string;
  email: string;
  emailHref: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  addressLine: string | null;
  cityLine: string | null;
  /** True cuando la ubicacion sigue siendo un marcador sin confirmar. */
  locationPending: boolean;
  openingHours: string[] | null;
}

/** Normaliza a E.164 asumiendo Mexico cuando no viene lada internacional. */
function toE164(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (input.trim().startsWith("+")) return `+${digits}`;
  return digits.length === 10 ? `+52${digits}` : `+${digits}`;
}

/**
 * Combina la configuracion del codigo con lo que el despacho haya editado en
 * el panel. Lo del panel manda; `config/site` es el respaldo.
 *
 * Existe para que ningun componente tenga que decidir por su cuenta de donde
 * sale un telefono, que es como acaban divergiendo el header y el footer.
 */
export function resolveContact(settings: SiteSettings): ResolvedContact {
  const overrides = settings.contact;

  const phoneRaw = overrides.phone?.trim() || siteConfig.contact.phoneNational;
  const phoneE164 = overrides.phone
    ? toE164(overrides.phone)
    : siteConfig.contact.phoneE164;

  const email = overrides.email?.trim() || siteConfig.contact.email;

  const city = overrides.city?.trim() || siteConfig.location.city;
  const state = overrides.state?.trim() || siteConfig.location.state;
  const cityLine = [city, state].filter(Boolean).join(", ") || null;

  // Un marcador sin sustituir no debe presentarse como una direccion real.
  const locationPending =
    !siteConfig.location.verified &&
    !overrides.city &&
    !overrides.addressLine;

  return {
    phoneDisplay: phoneRaw,
    phoneHref: `tel:${phoneE164}`,
    whatsappNumber: phoneE164.replace(/\D/g, ""),
    email,
    emailHref: `mailto:${email}`,
    facebookUrl: overrides.facebookUrl ?? siteConfig.social.facebook.url,
    instagramUrl: overrides.instagramUrl ?? siteConfig.social.instagram.url,
    addressLine: overrides.addressLine?.trim() || null,
    cityLine,
    locationPending,
    openingHours: overrides.openingHours,
  };
}
