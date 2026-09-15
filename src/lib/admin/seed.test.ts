import { describe, expect, it } from "vitest";
import { defaultBlocks } from "@/content/blocks";
import { defaultServices } from "@/content/services";
import { defaultSettings } from "@/content/settings";
import { blocksSchema, serviceSchema, settingsSchema } from "./schemas";

/**
 * `seedDefaultContent` copia a la base de datos el contenido de `src/content`
 * validandolo con los mismos esquemas que el panel. Si alguien cambia un texto
 * por defecto y se sale de un limite, el boton de carga fallaria en produccion;
 * aqui falla antes.
 */
describe("contenido inicial valido para sembrar", () => {
  it("los ajustes por defecto pasan el esquema del panel", () => {
    const parsed = settingsSchema.parse(defaultSettings);
    expect(parsed.privacy.body.es).toBe("");
    expect("updatedAt" in parsed).toBe(false);
  });

  it("cada servicio por defecto pasa el esquema sin id", () => {
    for (const [position, service] of defaultServices.entries()) {
      expect(() =>
        serviceSchema.omit({ id: true }).parse({ ...service, id: undefined, position }),
      ).not.toThrow();
    }
  });

  it("la composicion por defecto pasa el esquema de bloques", () => {
    expect(() => blocksSchema.parse(defaultBlocks)).not.toThrow();
  });

  it("un envio de una version anterior sin privacidad sigue siendo valido", () => {
    const { privacy: _omit, ...legacy } = defaultSettings;
    void _omit;
    expect(settingsSchema.parse(legacy).privacy.body).toEqual({ es: "", en: "" });
  });
});
