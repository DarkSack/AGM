import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/content/settings";
import { LOCALES } from "@/config/site";
import { mapSettings } from "./mappers";

/**
 * `mapSettings` recibe la columna `jsonb` de `site_settings`, que para
 * TypeScript es `unknown` y en la practica es lo que sea que haya quedado
 * guardado ahi: un panel de una version anterior, una migracion a medias, o
 * directamente basura.
 *
 * Su contrato es no lanzar nunca y devolver siempre una forma completa,
 * porque de ella cuelga el renderizado de toda la portada. Eso es lo que se
 * comprueba aqui: no tanto que traduzca bien un caso valido, sino que ninguna
 * entrada rara consiga tumbar la pagina.
 */
describe("mapSettings — entradas invalidas", () => {
  const basura: unknown[] = [
    null,
    undefined,
    0,
    42,
    "",
    "una cadena",
    true,
    [],
    [1, 2, 3],
    {},
    { hero: null },
    { hero: "no soy un objeto" },
    { hero: { title: 42 } },
    { method: "no soy un array" },
    { method: [null, 3, "x"] },
    { values: [{}] },
    { seo: { keywords: "no soy un array" } },
    { contact: { openingHours: "no soy un array" } },
    { about: { body: [null, 1, {}] } },
  ];

  it("nunca lanza, sea lo que sea lo que venga de la base de datos", () => {
    for (const entrada of basura) {
      expect(() => mapSettings(entrada), String(entrada)).not.toThrow();
    }
  });

  it("siempre devuelve la forma completa con textos en los dos idiomas", () => {
    for (const entrada of basura) {
      const s = mapSettings(entrada);
      for (const locale of LOCALES) {
        expect(typeof s.hero.title[locale]).toBe("string");
        expect(typeof s.seo.title[locale]).toBe("string");
        expect(typeof s.about.intro[locale]).toBe("string");
      }
      expect(Array.isArray(s.method)).toBe(true);
      expect(Array.isArray(s.values)).toBe(true);
      expect(Array.isArray(s.about.body)).toBe(true);
    }
  });

  it("cae al contenido por defecto cuando no hay nada aprovechable", () => {
    expect(mapSettings(null)).toEqual(defaultSettings);
    expect(mapSettings("cualquier cosa")).toEqual(defaultSettings);
    expect(mapSettings(mapSettings({}))).toEqual(mapSettings({}));
  });
});

describe("mapSettings — lo que si viene bien", () => {
  it("conserva los textos guardados", () => {
    const s = mapSettings({
      hero: { title: { es: "Hola", en: "Hello" } },
    });
    expect(s.hero.title.es).toBe("Hola");
    expect(s.hero.title.en).toBe("Hello");
  });

  it("rellena el idioma que falte en lugar de dejarlo indefinido", () => {
    const s = mapSettings({ hero: { title: { es: "Solo español" } } });
    expect(s.hero.title.es).toBe("Solo español");
    expect(typeof s.hero.title.en).toBe("string");
  });

  it("ordena metodo y valores por posicion, no por como vinieran", () => {
    const s = mapSettings({
      method: [
        { id: "c", title: { es: "C" }, position: 2 },
        { id: "a", title: { es: "A" }, position: 0 },
        { id: "b", title: { es: "B" }, position: 1 },
      ],
    });
    expect(s.method.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("descarta los elementos que no son objetos sin tirar el resto", () => {
    const s = mapSettings({
      method: [null, { id: "bueno", title: { es: "Bueno" }, position: 0 }, 7],
    });
    expect(s.method).toHaveLength(1);
    expect(s.method[0]?.id).toBe("bueno");
  });

  it("solo publica la imagen del hero si de verdad tiene URL", () => {
    expect(mapSettings({ hero: { image: {} } }).hero.image).toBeNull();
    expect(mapSettings({ hero: { image: { alt: { es: "x" } } } }).hero.image).toBeNull();
    expect(
      mapSettings({ hero: { image: { url: "/foto.jpg" } } }).hero.image?.url,
    ).toBe("/foto.jpg");
  });

  it("deja los datos de contacto vacios en null, no en cadena vacia", () => {
    const s = mapSettings({ contact: {} });
    expect(s.contact.phone).toBeNull();
    expect(s.contact.email).toBeNull();
    expect(s.contact.addressLine).toBeNull();
    // `resolveContact` distingue null de cadena vacia para decidir si cae al
    // respaldo de config; devolver "" romperia ese respaldo.
    expect(s.contact.openingHours).toBeNull();
  });

  it("es estable: mapear dos veces da lo mismo", () => {
    const una = mapSettings({
      hero: { title: { es: "Hola" } },
      method: [{ id: "a", title: { es: "A" }, position: 0 }],
    });
    expect(mapSettings(una)).toEqual(una);
  });
});
