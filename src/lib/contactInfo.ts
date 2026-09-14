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
  /** Linea completa para mostrar, con C.P. incluido. */
  addressLine: string | null;
  /**
   * Calle y colonia, sin C.P. Es lo que va en `streetAddress` de Schema.org:
   * el codigo postal tiene su propia propiedad y repetirlo en ambas confunde
   * a los validadores.
   */
  streetAddress: string | null;
  cityLine: string | null;
  postalCode: string | null;
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

  // Lo del panel se muestra tal como se escribio; el respaldo va ya agrupado
  // ("33 1452 6836"). Antes el respaldo eran los 10 digitos pegados, y por eso
  // los componentes acababan leyendo `siteConfig` directamente: el texto salia
  // de la configuracion y el enlace del panel, y podian no coincidir.
  const phoneOverride = overrides.phone?.trim() || null;
  const phoneDisplay = phoneOverride ?? siteConfig.contact.phoneDisplay;
  const phoneE164 = phoneOverride
    ? toE164(phoneOverride)
    : siteConfig.contact.phoneE164;

  const email = overrides.email?.trim() || siteConfig.contact.email;

  // Calle, colonia y C.P. de la configuracion, ya montados en una linea.
  // Solo se usan si la direccion esta verificada: un marcador sin sustituir
  // no puede acabar presentandose como una direccion real.
  const configStreet = siteConfig.location.verified
    ? [siteConfig.location.street, siteConfig.location.neighborhood]
        .filter(Boolean)
        .join(", ")
    : null;

  const configAddressLine =
    configStreet && siteConfig.location.postalCode
      ? `${configStreet}, C.P. ${siteConfig.location.postalCode}`
      : configStreet;

  const city = overrides.city?.trim() || siteConfig.location.city;
  const state = overrides.state?.trim() || siteConfig.location.state;
  const cityLine = [city, state].filter(Boolean).join(", ") || null;

  // Un marcador sin sustituir no debe presentarse como una direccion real.
  const locationPending =
    !siteConfig.location.verified &&
    !overrides.city &&
    !overrides.addressLine;

  return {
    phoneDisplay,
    phoneHref: `tel:${phoneE164}`,
    whatsappNumber: phoneE164.replace(/\D/g, ""),
    email,
    emailHref: `mailto:${email}`,
    facebookUrl: overrides.facebookUrl ?? siteConfig.social.facebook.url,
    instagramUrl: overrides.instagramUrl ?? siteConfig.social.instagram.url,
    addressLine: overrides.addressLine?.trim() || configAddressLine,
    streetAddress: overrides.addressLine?.trim() || configStreet,
    cityLine,
    postalCode: siteConfig.location.verified
      ? siteConfig.location.postalCode
      : null,
    locationPending,
    openingHours: overrides.openingHours,
  };
}
