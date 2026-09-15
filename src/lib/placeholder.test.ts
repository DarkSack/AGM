import { describe, expect, it } from "vitest";
import { isPlaceholder, publicText } from "./placeholder";

describe("placeholder", () => {
  it("detecta los marcadores del contenido por defecto", () => {
    expect(isPlaceholder("[AÑO]")).toBe(true);
    expect(isPlaceholder("[CIUDAD], [ESTADO]")).toBe(true);
    expect(isPlaceholder("[Título profesional] · [Cédula / colegiación]")).toBe(true);
  });

  it("deja pasar el texto real", () => {
    expect(isPlaceholder("2024")).toBe(false);
    expect(publicText("  Zapopan, Jalisco ")).toBe("Zapopan, Jalisco");
  });

  it("descarta lo vacio y lo pendiente", () => {
    expect(publicText("")).toBeNull();
    expect(publicText("   ")).toBeNull();
    expect(publicText(null)).toBeNull();
    expect(publicText("[AÑO]")).toBeNull();
  });
});
