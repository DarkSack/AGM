import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/content/settings";
import { siteConfig } from "@/config/site";
import type { SiteSettings } from "@/types/content";
import { resolveContact } from "./contactInfo";

/**
 * `resolveContact` decide de donde sale cada dato de contacto: lo que el
 * despacho haya escrito en el panel manda, y `config/site` es el respaldo.
 *
 * Se prueba porque es la unica pieza que sabe esa regla. Si se equivoca, el
 * header y el footer empiezan a decir cosas distintas, o —peor— se publica en
 * los datos estructurados una direccion que no existe.
 */
function settingsCon(contact: Partial<SiteSettings["contact"]>): SiteSettings {
  return {
    ...defaultSettings,
    contact: { ...defaultSettings.contact, ...contact },
  };
}

const sinNadaEnElPanel = settingsCon({
  phone: null,
  email: null,
  city: null,
  state: null,
  addressLine: null,
  facebookUrl: null,
  instagramUrl: null,
  openingHours: null,
});

describe("resolveContact — respaldo desde la configuracion", () => {
  it("usa telefono y correo de config cuando el panel esta vacio", () => {
    const contact = resolveContact(sinNadaEnElPanel);
    expect(contact.email).toBe(siteConfig.contact.email);
    expect(contact.phoneHref).toBe(`tel:${siteConfig.contact.phoneE164}`);
    expect(contact.phoneDisplay).toBe(siteConfig.contact.phoneDisplay);
    expect(contact.whatsappNumber).toBe(siteConfig.contact.whatsapp.number);
  });

  /**
   * Regresion. El texto del telefono salia de `siteConfig` y el enlace del
   * panel: al cambiar el numero en el panel se mostraba uno y se marcaba otro.
   */
  it("el texto, el enlace y WhatsApp salen del mismo numero", () => {
    const contact = resolveContact(settingsCon({ phone: "33 9876 5432" }));
    expect(contact.phoneDisplay).toBe("33 9876 5432");
    expect(contact.phoneHref).toBe("tel:+523398765432");
    expect(contact.whatsappNumber).toBe("523398765432");
  });

  /**
   * Regresion. Antes `addressLine` solo miraba lo editado en el panel, asi
   * que con el panel vacio la direccion de `config/site` no se mostraba
   * nunca, por muy verificada que estuviera.
   */
  it("compone la direccion desde config cuando el panel esta vacio", () => {
    const contact = resolveContact(sinNadaEnElPanel);
    expect(contact.addressLine).toContain(siteConfig.location.street);
    expect(contact.addressLine).toContain(siteConfig.location.neighborhood);
    expect(contact.addressLine).toContain(siteConfig.location.postalCode);
  });

  it("separa el codigo postal de la calle para Schema.org", () => {
    const contact = resolveContact(sinNadaEnElPanel);
    // `streetAddress` y `postalCode` son propiedades distintas: repetir el
    // C.P. en ambas confunde a los validadores de datos estructurados.
    expect(contact.streetAddress).not.toContain(siteConfig.location.postalCode);
    expect(contact.postalCode).toBe(siteConfig.location.postalCode);
  });

  it("arma la linea de ciudad con ciudad y estado", () => {
    const contact = resolveContact(sinNadaEnElPanel);
    expect(contact.cityLine).toBe(
      `${siteConfig.location.city}, ${siteConfig.location.state}`,
    );
  });
});

describe("resolveContact — lo del panel manda", () => {
  it("prefiere el correo y el telefono editados", () => {
    const contact = resolveContact(
      settingsCon({ email: "otro@ejemplo.com", phone: "3312345678" }),
    );
    expect(contact.email).toBe("otro@ejemplo.com");
    expect(contact.phoneDisplay).toBe("3312345678");
  });

  it("prefiere la direccion editada sobre la de config", () => {
    const contact = resolveContact(
      settingsCon({ addressLine: "Otra Calle 12, Col. Centro" }),
    );
    expect(contact.addressLine).toBe("Otra Calle 12, Col. Centro");
    expect(contact.streetAddress).toBe("Otra Calle 12, Col. Centro");
  });

  it("ignora los campos que solo traen espacios", () => {
    const contact = resolveContact(
      settingsCon({ email: "   ", addressLine: "   " }),
    );
    expect(contact.email).toBe(siteConfig.contact.email);
    expect(contact.addressLine).toContain(siteConfig.location.street);
  });
});

describe("resolveContact — normalizacion del telefono", () => {
  it("asume Mexico en un numero nacional de 10 digitos", () => {
    const contact = resolveContact(settingsCon({ phone: "3312345678" }));
    expect(contact.phoneHref).toBe("tel:+523312345678");
    expect(contact.whatsappNumber).toBe("523312345678");
  });

  it("respeta la lada internacional cuando viene con +", () => {
    const contact = resolveContact(settingsCon({ phone: "+1 415 555 0123" }));
    expect(contact.phoneHref).toBe("tel:+14155550123");
  });

  it("no se atraganta con parentesis, espacios ni guiones", () => {
    const contact = resolveContact(settingsCon({ phone: "(33) 1234-5678" }));
    expect(contact.phoneHref).toBe("tel:+523312345678");
  });

  it("deja el numero para marcar sin un solo caracter no numerico", () => {
    const contact = resolveContact(settingsCon({ phone: "+52 (33) 1452-6836" }));
    expect(contact.whatsappNumber).toMatch(/^\d+$/);
  });
});

describe("resolveContact — redes sociales", () => {
  it("cae en la URL de config cuando el panel no trae ninguna", () => {
    const contact = resolveContact(sinNadaEnElPanel);
    expect(contact.facebookUrl).toBe(siteConfig.social.facebook.url);
  });

  it("deja Instagram en null mientras no exista la cuenta", () => {
    const contact = resolveContact(sinNadaEnElPanel);
    // Un enlace inventado en `sameAs` es peor que no tener red social.
    expect(contact.instagramUrl).toBeNull();
  });

  it("prefiere la URL editada en el panel", () => {
    const contact = resolveContact(
      settingsCon({ facebookUrl: "https://facebook.com/otra-pagina" }),
    );
    expect(contact.facebookUrl).toBe("https://facebook.com/otra-pagina");
  });
});

describe("resolveContact — la ubicacion sin verificar", () => {
  /**
   * `locationPending` es lo que impide que un marcador sin sustituir acabe
   * publicado como si fuera una direccion real. Con la direccion ya
   * confirmada en `config/site` debe estar siempre en false.
   */
  it("no marca la ubicacion como pendiente con la direccion verificada", () => {
    expect(siteConfig.location.verified).toBe(true);
    expect(resolveContact(sinNadaEnElPanel).locationPending).toBe(false);
  });

  it("las coordenadas, si existen, caen dentro de Jalisco", () => {
    // Un `geo` mal puesto manda a la gente a la puerta equivocada, y eso es
    // peor que no dar coordenadas. Esta comprobacion no valida la direccion,
    // solo detecta un signo cambiado o un lat/lng intercambiado.
    const { geo } = siteConfig.location;
    if (!geo) return;
    expect(geo.lat).toBeGreaterThan(18.5);
    expect(geo.lat).toBeLessThan(23);
    expect(geo.lng).toBeGreaterThan(-105.8);
    expect(geo.lng).toBeLessThan(-101.5);
  });
});
