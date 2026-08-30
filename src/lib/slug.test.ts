import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, SLUG_PATTERN } from "./slug";

/**
 * El slug forma parte de la URL publica de cada proyecto y ademas tiene que
 * pasar el CHECK `projects_slug_format` de la base de datos. Si `slugify`
 * devuelve algo que no cumple el patron, el fallo no aparece al escribir el
 * titulo sino al guardar, con un error de Postgres que no explica nada.
 *
 * Por eso la comprobacion que mas importa aqui no es la de casos bonitos,
 * sino la invariante: todo lo que salga de `slugify` y no sea cadena vacia
 * tiene que pasar `isValidSlug`.
 */
describe("slugify", () => {
  it("quita los acentos en lugar de romper la palabra", () => {
    expect(slugify("Reforma Nórdica")).toBe("reforma-nordica");
    expect(slugify("Ampliación")).toBe("ampliacion");
  });

  it("conserva la eñe como n, que es lo esperable en una URL", () => {
    expect(slugify("Diseño de Interiores")).toBe("diseno-de-interiores");
  });

  it("colapsa separadores repetidos en un solo guion", () => {
    expect(slugify("Casa   Horizonte")).toBe("casa-horizonte");
    expect(slugify("Casa --- Horizonte")).toBe("casa-horizonte");
    expect(slugify("Casa / Horizonte")).toBe("casa-horizonte");
  });

  it("no deja guiones sueltos en los extremos", () => {
    expect(slugify("  Casa Patio  ")).toBe("casa-patio");
    expect(slugify("¡Casa Patio!")).toBe("casa-patio");
    expect(slugify("--Casa--")).toBe("casa");
  });

  it("devuelve cadena vacia cuando no queda nada utilizable", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
    expect(slugify("¿?¡!")).toBe("");
    expect(slugify("→ ★ ←")).toBe("");
  });

  it("es idempotente: volver a pasar un slug no lo cambia", () => {
    const once = slugify("Rehabilitación de Fachadas — Centro Histórico");
    expect(slugify(once)).toBe(once);
  });

  it("recorta a 96 caracteres", () => {
    expect(slugify("a".repeat(200))).toHaveLength(96);
  });

  /**
   * Regresion. Esto estaba roto: el recorte a 96 se hacia DESPUES de limpiar
   * los guiones de los extremos, asi que un titulo largo cuyo corte cayera
   * sobre un guion daba un slug terminado en guion, invalido para el CHECK
   * de la tabla. El sintoma era un error de Postgres al guardar.
   */
  it("no termina en guion aunque el recorte caiga sobre un separador", () => {
    // 95 letras, espacio, y mas texto: el guion cae justo en la posicion 95,
    // que es el ultimo caracter que sobrevive al recorte.
    const titulo = `${"a".repeat(95)} bcdef`;
    const slug = slugify(titulo);
    expect(slug.endsWith("-")).toBe(false);
    expect(SLUG_PATTERN.test(slug)).toBe(true);
  });

  it("todo lo que produce, si no es vacio, es un slug valido", () => {
    const titulos = [
      "Casa Horizonte",
      "Reforma Nórdica",
      "Espacio Urbano 2026",
      "Rehabilitación de Fachadas — Centro Histórico de Zapopan, Jalisco",
      "  ¡¡¡ Proyecto!!!  ",
      "Ñandú & Cía.",
      "a".repeat(120),
      `${"palabra-".repeat(20)}final`,
    ];

    for (const titulo of titulos) {
      const slug = slugify(titulo);
      if (slug === "") continue;
      // `slugify` no garantiza la longitud minima de 2 que pide el CHECK
      // —"A." da "a"—, asi que la invariante que se comprueba aqui es la de
      // formato. La longitud la valida quien guarda, con `isValidSlug`.
      expect(
        SLUG_PATTERN.test(slug),
        `titulo: ${titulo} → slug: ${slug}`,
      ).toBe(true);
    }
  });
});

describe("isValidSlug", () => {
  it("acepta los slugs que cumplen el CHECK de la tabla", () => {
    expect(isValidSlug("casa-horizonte")).toBe(true);
    expect(isValidSlug("proyecto2026")).toBe(true);
    expect(isValidSlug("ab")).toBe(true);
  });

  it("rechaza lo que Postgres rechazaria", () => {
    expect(isValidSlug("a")).toBe(false); // menos de 2
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("Casa-Horizonte")).toBe(false); // mayusculas
    expect(isValidSlug("casa horizonte")).toBe(false); // espacio
    expect(isValidSlug("casa--horizonte")).toBe(false); // guion doble
    expect(isValidSlug("-casa")).toBe(false);
    expect(isValidSlug("casa-")).toBe(false);
    expect(isValidSlug("diseño")).toBe(false); // no ascii
    expect(isValidSlug("a".repeat(97))).toBe(false);
  });
});
