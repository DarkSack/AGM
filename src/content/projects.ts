import type { Project, ProjectImage } from "@/types/content";

/**
 * Proyectos de demostracion.
 *
 * IMPORTANTE: ninguno es obra real de AGM. Todos llevan `isConcept: true`, lo
 * que hace que la interfaz muestre la etiqueta "Proyecto conceptual" y que se
 * excluyan del JSON-LD como trabajos ejecutados. Se sustituiran por obra real
 * desde el panel; al crear un proyecto nuevo el valor por defecto es `false`.
 */

const PLACEHOLDER_LOCATION = { es: "[CIUDAD], [ESTADO]", en: "[CITY], [STATE]" };
const PLACEHOLDER_YEAR = "[AÑO]";

function cover(slug: string, alt: { es: string; en: string }): ProjectImage {
  return {
    id: `${slug}-cover`,
    url: `/images/projects/${slug}.svg`,
    alt,
    position: 0,
    width: 1600,
    height: 1200,
  };
}

export const defaultProjects: Project[] = [
  {
    id: "prj-casa-horizonte",
    slug: "casa-horizonte",
    title: { es: "Casa Horizonte", en: "Casa Horizonte" },
    summary: {
      es: "Vivienda de una planta abierta al paisaje mediante un gran vano continuo.",
      en: "Single-storey home opened to the landscape through one continuous span.",
    },
    description: {
      es: "Ejercicio conceptual sobre una vivienda que ordena su programa a lo largo de un eje horizontal. Las zonas de día se agrupan tras un vano continuo que enmarca el paisaje, mientras las de noche se retrasan hacia el fondo del terreno para ganar privacidad. La cubierta plana, ligeramente volada, protege del asoleamiento directo sin cerrar la vista.",
      en: "A conceptual exercise on a house organised along a horizontal axis. Living areas sit behind one continuous opening that frames the landscape, while the sleeping areas step back into the site for privacy. A slightly cantilevered flat roof shades the interior without closing off the view.",
    },
    category: "residential",
    location: PLACEHOLDER_LOCATION,
    year: PLACEHOLDER_YEAR,
    client: null,
    area: null,
    status: "published",
    featured: true,
    isConcept: true,
    coverImage: cover("casa-horizonte", {
      es: "Ilustración conceptual de una vivienda horizontal con un gran vano continuo hacia el paisaje",
      en: "Conceptual illustration of a horizontal house with a continuous opening onto the landscape",
    }),
    gallery: [],
    tags: ["residencial", "obra nueva"],
    seo: { title: {}, description: {}, ogImage: null },
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prj-casa-patio",
    slug: "casa-patio",
    title: { es: "Casa Patio", en: "Casa Patio" },
    summary: {
      es: "Planta cerrada al exterior que organiza todas las estancias alrededor de un patio central.",
      en: "A plan closed to the street, with every room arranged around a central courtyard.",
    },
    description: {
      es: "Propuesta conceptual que recupera la tipología de patio como estrategia climática y no solo compositiva. El vacío central ilumina y ventila de forma cruzada las cuatro crujías, y permite que la casa se cierre por completo hacia la calle sin perder luz natural en ninguna habitación.",
      en: "A conceptual proposal that returns to the courtyard typology as a climate strategy rather than a compositional one. The central void brings light and cross-ventilation to all four wings, letting the house close itself off from the street without losing daylight in any room.",
    },
    category: "residential",
    location: PLACEHOLDER_LOCATION,
    year: PLACEHOLDER_YEAR,
    client: null,
    area: null,
    status: "published",
    featured: false,
    isConcept: true,
    coverImage: cover("casa-patio", {
      es: "Ilustración conceptual de una vivienda organizada alrededor de un patio central",
      en: "Conceptual illustration of a house organised around a central courtyard",
    }),
    gallery: [],
    tags: ["residencial", "patio"],
    seo: { title: {}, description: {}, ogImage: null },
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prj-reforma-nordica",
    slug: "reforma-nordica",
    title: { es: "Reforma Nórdica", en: "Nordic Renovation" },
    summary: {
      es: "Remodelación interior que sustituye tabiquería por un espacio continuo de materiales cálidos.",
      en: "Interior remodel replacing partitions with one continuous space in warm materials.",
    },
    description: {
      es: "Estudio conceptual de remodelación en un departamento compartimentado. Se retiran los muros no estructurales para unificar cocina, comedor y sala en una sola pieza, y se recurre a madera clara, superficies mate y carpintería a medida para dar carácter sin recargar el espacio.",
      en: "A conceptual remodel study for a heavily partitioned apartment. Non-structural walls come down to merge kitchen, dining and living into a single room, with light timber, matte surfaces and bespoke joinery giving the space character without clutter.",
    },
    category: "remodeling",
    location: PLACEHOLDER_LOCATION,
    year: PLACEHOLDER_YEAR,
    client: null,
    area: null,
    status: "published",
    featured: false,
    isConcept: true,
    coverImage: cover("reforma-nordica", {
      es: "Ilustración conceptual de un interior remodelado con materiales claros y espacio continuo",
      en: "Conceptual illustration of a remodelled interior with light materials and continuous space",
    }),
    gallery: [],
    tags: ["remodelación", "interiorismo"],
    seo: { title: {}, description: {}, ogImage: null },
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prj-espacio-urbano",
    slug: "espacio-urbano",
    title: { es: "Espacio Urbano", en: "Espacio Urbano" },
    summary: {
      es: "Local comercial en planta baja resuelto con una fachada permeable hacia la calle.",
      en: "Ground-floor retail space resolved with a permeable street facade.",
    },
    description: {
      es: "Ejercicio conceptual sobre un local en planta baja entre medianeras. La fachada se resuelve como un filtro de lamas verticales que gradúa la relación con la calle: abierta en horario comercial, protegida del sol de tarde y cerrada sin necesidad de cortinas metálicas.",
      en: "A conceptual exercise for a ground-floor unit between party walls. The facade works as a vertical-louvre filter that grades the relationship with the street: open during business hours, shaded from afternoon sun, and secured without roller shutters.",
    },
    category: "commercial",
    location: PLACEHOLDER_LOCATION,
    year: PLACEHOLDER_YEAR,
    client: null,
    area: null,
    status: "published",
    featured: true,
    isConcept: true,
    coverImage: cover("espacio-urbano", {
      es: "Ilustración conceptual de un local comercial con fachada de lamas verticales",
      en: "Conceptual illustration of a retail space with a vertical-louvre facade",
    }),
    gallery: [],
    tags: ["comercial", "fachada"],
    seo: { title: {}, description: {}, ogImage: null },
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prj-casa-concreto",
    slug: "casa-concreto",
    title: { es: "Casa Concreto", en: "Casa Concreto" },
    summary: {
      es: "Volumen macizo de concreto aparente perforado por vanos profundos y controlados.",
      en: "A solid exposed-concrete volume pierced by deep, carefully placed openings.",
    },
    description: {
      es: "Propuesta conceptual que explora el concreto aparente como acabado final, sin revestimientos añadidos. Los vanos se abren con profundidad suficiente para generar sombra propia, y la textura de la cimbra queda a la vista como único ornamento del edificio.",
      en: "A conceptual proposal exploring exposed concrete as the final finish, with no added cladding. Openings are deep enough to cast their own shade, and the formwork texture is left visible as the only ornament of the building.",
    },
    category: "residential",
    location: PLACEHOLDER_LOCATION,
    year: PLACEHOLDER_YEAR,
    client: null,
    area: null,
    status: "published",
    featured: false,
    isConcept: true,
    coverImage: cover("casa-concreto", {
      es: "Ilustración conceptual de una vivienda de concreto aparente con vanos profundos",
      en: "Conceptual illustration of an exposed-concrete house with deep openings",
    }),
    gallery: [],
    tags: ["residencial", "concreto"],
    seo: { title: {}, description: {}, ogImage: null },
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prj-estudio-industrial",
    slug: "estudio-industrial",
    title: { es: "Estudio Industrial", en: "Industrial Studio" },
    summary: {
      es: "Rehabilitación de una nave para uso de oficinas conservando la estructura vista.",
      en: "Warehouse converted into offices while keeping the original structure exposed.",
    },
    description: {
      es: "Estudio conceptual de reconversión de una nave existente en espacio de trabajo. La estructura metálica original se conserva a la vista y los nuevos volúmenes se insertan como piezas exentas, de modo que la intervención sea legible y reversible.",
      en: "A conceptual study converting an existing warehouse into workspace. The original steel structure stays exposed and new volumes are inserted as free-standing pieces, keeping the intervention legible and reversible.",
    },
    category: "commercial",
    location: PLACEHOLDER_LOCATION,
    year: PLACEHOLDER_YEAR,
    client: null,
    area: null,
    status: "published",
    featured: false,
    isConcept: true,
    coverImage: cover("estudio-industrial", {
      es: "Ilustración conceptual de una nave industrial rehabilitada como espacio de oficinas",
      en: "Conceptual illustration of a warehouse converted into office space",
    }),
    gallery: [],
    tags: ["comercial", "rehabilitación"],
    seo: { title: {}, description: {}, ogImage: null },
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];
