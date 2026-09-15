import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/content/settings";
import { privacySections, privacyText } from "./privacy";

const withBody = (es: string, en: string) => ({
  ...defaultSettings,
  privacy: { body: { es, en } },
});

describe("privacyText", () => {
  it("es null mientras el despacho no haya escrito el aviso", () => {
    expect(privacyText(defaultSettings, "es")).toBeNull();
    expect(privacyText(withBody("   ", ""), "en")).toBeNull();
  });

  it("usa el espanol si falta la traduccion", () => {
    expect(privacyText(withBody("Aviso", ""), "en")).toBe("Aviso");
    expect(privacyText(withBody("Aviso", "Notice"), "en")).toBe("Notice");
  });
});

describe("privacySections", () => {
  it("separa los apartados por lineas en blanco", () => {
    expect(privacySections("Uno\nsigue uno\n\n  \nDos\n\n")).toEqual([
      "Uno\nsigue uno",
      "Dos",
    ]);
  });
});
