import { describe, expect, it } from "vitest";
import { MAX_IMAGE_EDGE, fitWithin, shouldKeepOriginal } from "./imageResize";

describe("fitWithin", () => {
  it("reduce por el lado mayor manteniendo la proporcion", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: MAX_IMAGE_EDGE, height: 1800 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 1800, height: MAX_IMAGE_EDGE });
  });

  it("nunca amplia una imagen pequena", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe("shouldKeepOriginal", () => {
  it("respeta AVIF, que el navegador no puede recodificar", () => {
    expect(shouldKeepOriginal("image/avif", 9_000_000, 6000, 4000)).toBe(true);
  });

  it("sube tal cual lo que ya es pequeno y ligero", () => {
    expect(shouldKeepOriginal("image/jpeg", 200_000, 1600, 1200)).toBe(true);
  });

  it("recomprime lo grande o lo pesado", () => {
    expect(shouldKeepOriginal("image/jpeg", 200_000, 4000, 3000)).toBe(false);
    expect(shouldKeepOriginal("image/png", 3_000_000, 1600, 1200)).toBe(false);
  });
});
