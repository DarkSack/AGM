import { describe, expect, it } from "vitest";
import { removedStoragePaths, storagePathFromUrl } from "./storage";

const base = "https://xyz.supabase.co/storage/v1/object/public/media";

describe("storagePathFromUrl", () => {
  it("extrae la ruta dentro del bucket", () => {
    expect(storagePathFromUrl(`${base}/casa-patio/123-abc.jpg`)).toBe(
      "casa-patio/123-abc.jpg",
    );
  });

  it("decodifica caracteres escapados", () => {
    expect(storagePathFromUrl(`${base}/carpeta/foto%20uno.jpg`)).toBe(
      "carpeta/foto uno.jpg",
    );
  });

  it("ignora lo que no es del bucket", () => {
    expect(storagePathFromUrl("/images/projects/casa-patio.svg")).toBeNull();
    expect(storagePathFromUrl("https://ejemplo.com/foto.jpg")).toBeNull();
    expect(
      storagePathFromUrl("https://xyz.supabase.co/storage/v1/object/public/otro/a.jpg"),
    ).toBeNull();
  });
});

describe("removedStoragePaths", () => {
  it("devuelve solo lo que ya no esta referenciado", () => {
    const a = `${base}/p/a.jpg`;
    const b = `${base}/p/b.jpg`;
    const c = `${base}/p/c.jpg`;
    expect(removedStoragePaths([a, b, c], [c, a])).toEqual(["p/b.jpg"]);
  });

  it("nunca borra marcadores locales", () => {
    expect(removedStoragePaths(["/images/projects/x.svg"], [])).toEqual([]);
  });
});
