import { describe, expect, it, vi } from "vitest";
import { normalizarSiteUrl } from "./site";

/**
 * `NEXT_PUBLIC_SITE_URL` lo escribe una persona en el panel de la plataforma
 * de despliegue, no un programa. De ahi salen valores que `new URL()` rechaza,
 * y como el resultado alimenta el `metadataBase` del layout —que corre dentro
 * de `generateMetadata`— una excepcion aqui no rompe una pagina: aborta el
 * build entero, y ademas con el mensaje enmascarado que Next deja en
 * produccion, donde solo se ve un `digest`.
 *
 * Por eso lo que se prueba es sobre todo que NO lance nunca.
 */
describe("normalizarSiteUrl", () => {
  it("acepta una URL bien escrita y se queda con el origen", () => {
    expect(normalizarSiteUrl("https://agm.mx")).toBe("https://agm.mx");
    expect(normalizarSiteUrl("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });

  it("quita la barra final, que duplicaria las barras del canonical", () => {
    expect(normalizarSiteUrl("https://agm.mx/")).toBe("https://agm.mx");
    expect(normalizarSiteUrl("https://agm.mx///")).toBe("https://agm.mx");
  });

  it("descarta la ruta: el canonical se construye pegando la del sitio", () => {
    expect(normalizarSiteUrl("https://agm.mx/es/inicio")).toBe("https://agm.mx");
    expect(normalizarSiteUrl("https://agm.mx?utm=1")).toBe("https://agm.mx");
  });

  it("supone https cuando falta el protocolo", () => {
    // Es la falta mas comun: en el panel se pega el dominio a secas.
    expect(normalizarSiteUrl("agm.mx")).toBe("https://agm.mx");
    expect(normalizarSiteUrl("agm-abc123.vercel.app")).toBe(
      "https://agm-abc123.vercel.app",
    );
  });

  it("tolera espacios alrededor", () => {
    expect(normalizarSiteUrl("  https://agm.mx  ")).toBe("https://agm.mx");
    expect(normalizarSiteUrl("   ")).toBe("http://localhost:3000");
  });

  it("cae al respaldo si no hay valor", () => {
    expect(normalizarSiteUrl(undefined)).toBe("http://localhost:3000");
    expect(normalizarSiteUrl("")).toBe("http://localhost:3000");
  });

  it("no lanza nunca, ni con basura", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const basura = [
      "http://",
      "https://",
      "://falta-todo",
      "http://espacio en medio",
      "\n\t",
      "https://[malformado",
      ":",
      "%%%",
    ];

    for (const valor of basura) {
      expect(() => normalizarSiteUrl(valor), valor).not.toThrow();
      // Lo que devuelva tiene que servir para `new URL()`, porque eso es
      // exactamente lo que hace el layout con el resultado.
      expect(() => new URL(normalizarSiteUrl(valor)), valor).not.toThrow();
    }

    warn.mockRestore();
  });
});
