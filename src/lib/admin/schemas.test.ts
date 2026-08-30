import { describe, expect, it } from "vitest";
import {
  blockSchema,
  blocksSchema,
  projectSchema,
  serviceSchema,
  settingsSchema,
} from "./schemas";

/**
 * Estos esquemas son la ultima linea antes de escribir en la base de datos.
 * Corren dentro de las Server Actions, y una Server Action se puede invocar
 * directamente sin pasar por el formulario: lo que valide el navegador no
 * cuenta.
 *
 * Lo que mas importa comprobar no es que acepten un caso valido, sino que
 * rechacen lo que no debe entrar — sobre todo los destinos de enlace, que son
 * el unico punto del panel donde alguien podria intentar colar `javascript:`.
 */

function proyectoValido() {
  return {
    slug: "casa-horizonte",
    title: { es: "Casa Horizonte", en: "Horizon House" },
    summary: { es: "", en: "" },
    description: { es: "", en: "" },
    category: "residential" as const,
    location: { es: "", en: "" },
    year: null,
    client: null,
    area: null,
    status: "draft" as const,
    featured: false,
    isConcept: true,
    coverImage: null,
    gallery: [],
    tags: [],
    seo: { title: { es: "", en: "" }, description: { es: "", en: "" }, ogImage: null },
    position: 0,
  };
}

describe("projectSchema", () => {
  it("acepta un proyecto minimo bien formado", () => {
    expect(projectSchema.safeParse(proyectoValido()).success).toBe(true);
  });

  it("exige el titulo en español", () => {
    const sinEspanol = {
      ...proyectoValido(),
      title: { es: "   ", en: "Only English" },
    };
    const result = projectSchema.safeParse(sinEspanol);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("español");
    }
  });

  it("rechaza los slugs que la base de datos tampoco aceptaria", () => {
    const malos = [
      "Casa-Horizonte", // mayusculas
      "casa horizonte", // espacio
      "casa--horizonte", // guion doble
      "-casa", // empieza por guion
      "casa-", // termina en guion
      "a", // demasiado corto
      "diseño", // fuera de ascii
      "a".repeat(97), // demasiado largo
    ];
    for (const slug of malos) {
      const result = projectSchema.safeParse({ ...proyectoValido(), slug });
      expect(result.success, `deberia rechazar: ${slug}`).toBe(false);
    }
  });

  it("rechaza una categoria o un estado que no existen", () => {
    expect(
      projectSchema.safeParse({ ...proyectoValido(), category: "inventada" })
        .success,
    ).toBe(false);
    expect(
      projectSchema.safeParse({ ...proyectoValido(), status: "publicado" })
        .success,
    ).toBe(false);
  });

  it("pone un techo a la galeria y a las etiquetas", () => {
    const imagen = {
      id: "x",
      url: "/x.jpg",
      alt: { es: "", en: "" },
      position: 0,
      width: null,
      height: null,
    };
    expect(
      projectSchema.safeParse({
        ...proyectoValido(),
        gallery: Array.from({ length: 41 }, () => imagen),
      }).success,
    ).toBe(false);
    expect(
      projectSchema.safeParse({
        ...proyectoValido(),
        tags: Array.from({ length: 21 }, (_, i) => `t${i}`),
      }).success,
    ).toBe(false);
  });

  it("no deja pasar un id que no sea uuid", () => {
    expect(
      projectSchema.safeParse({ ...proyectoValido(), id: "123" }).success,
    ).toBe(false);
  });
});

describe("serviceSchema", () => {
  const servicioValido = {
    slug: "remodelaciones",
    title: { es: "Remodelaciones", en: "Remodeling" },
    description: { es: "", en: "" },
    icon: "hammer",
    position: 0,
    active: true,
  };

  it("acepta un servicio bien formado", () => {
    expect(serviceSchema.safeParse(servicioValido).success).toBe(true);
  });

  it("exige icono y titulo en español", () => {
    expect(
      serviceSchema.safeParse({ ...servicioValido, icon: "" }).success,
    ).toBe(false);
    expect(
      serviceSchema.safeParse({ ...servicioValido, title: { es: "", en: "x" } })
        .success,
    ).toBe(false);
  });
});

/**
 * El destino de los botones del hero es el unico campo libre del panel que
 * acaba en un `href`. El esquema solo admite anclas (`#`) y rutas internas
 * (`/`), que es lo que impide dejar ahi un `javascript:` o mandar al visitante
 * a un dominio ajeno.
 */
describe("settingsSchema — destinos de los botones", () => {
  function conHref(href: string) {
    return settingsSchema.shape.hero.shape.primaryCta.safeParse({
      label: { es: "Ver", en: "See" },
      href,
    });
  }

  it("acepta anclas y rutas internas", () => {
    expect(conHref("#contacto").success).toBe(true);
    expect(conHref("/proyectos").success).toBe(true);
    expect(conHref("/proyectos/casa-horizonte").success).toBe(true);
  });

  it("rechaza javascript:, data: y cualquier URL externa", () => {
    const peligrosos = [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "https://sitio-ajeno.example",
      "//sitio-ajeno.example", // relativa al protocolo: el navegador la hace externa
      "/\\sitio-ajeno.example", // algunos navegadores la normalizan a //
      "vbscript:msgbox(1)",
      " javascript:alert(1)",
      "mailto:alguien@ejemplo.com",
    ];
    for (const href of peligrosos) {
      expect(conHref(href).success, `deberia rechazar: ${href}`).toBe(false);
    }
  });
});

describe("blockSchema", () => {
  const bloqueValido = {
    id: "hero-1",
    type: "hero" as const,
    position: 0,
    enabled: true,
    data: {},
  };

  it("acepta un bloque del catalogo", () => {
    expect(blockSchema.safeParse(bloqueValido).success).toBe(true);
  });

  it("rechaza un tipo de bloque que no existe", () => {
    expect(
      blockSchema.safeParse({ ...bloqueValido, type: "htmlCrudo" }).success,
    ).toBe(false);
  });

  it("exige que `data` sea un objeto y no una cadena con marcado", () => {
    expect(
      blockSchema.safeParse({ ...bloqueValido, data: "<script>alert(1)</script>" })
        .success,
    ).toBe(false);
    expect(blockSchema.safeParse({ ...bloqueValido, data: null }).success).toBe(
      false,
    );
  });

  it("limita cuantos bloques puede tener la portada", () => {
    const muchos = Array.from({ length: 61 }, (_, i) => ({
      ...bloqueValido,
      id: `b${i}`,
    }));
    expect(blocksSchema.safeParse(muchos).success).toBe(false);
    expect(blocksSchema.safeParse(muchos.slice(0, 60)).success).toBe(true);
  });
});
