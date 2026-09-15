import type { SiteSettings } from "@/types/content";

/**
 * Contenido editorial inicial del sitio.
 *
 * Es la fuente de verdad mientras no exista un registro en la base de datos, y
 * la semilla que se carga en Supabase la primera vez. Desde el panel se edita
 * todo lo que hay aqui sin tocar codigo.
 *
 * Los textos entre corchetes son marcadores pendientes de recibir informacion
 * real del despacho. No se inventan datos biograficos, titulos ni experiencia.
 */
export const defaultSettings: SiteSettings = {
  hero: {
    eyebrow: {
      es: "Despacho de arquitectura",
      en: "Architecture practice",
    },
    title: {
      es: "Mantenemos, renovamos y transformamos tus espacios.",
      en: "We maintain, renew and transform your spaces.",
    },
    subtitle: {
      es: "Soluciones profesionales en mantenimiento, remodelación, diseño arquitectónico, proyecto ejecutivo y construcción.",
      en: "Professional solutions in maintenance, remodeling, architectural design, construction documents and building.",
    },
    primaryCta: {
      label: { es: "Ver proyectos", en: "View projects" },
      href: "#proyectos",
    },
    secondaryCta: {
      label: { es: "Solicitar cotización", en: "Request a quote" },
      href: "#contacto",
    },
    image: null,
  },

  about: {
    architectName: "[Nombre del Arquitecto]",
    role: {
      es: "[Título profesional] · [Cédula / colegiación]",
      en: "[Professional title] · [License number]",
    },
    intro: {
      es: "AGM Diseño y Proyección es un despacho de arquitectura que acompaña cada proyecto de principio a fin: del primer diagnóstico a la entrega de la obra terminada.",
      en: "AGM Diseño y Proyección is an architecture practice that follows every project from end to end: from the first assessment to handing over finished work.",
    },
    body: [
      {
        es: "Trabajamos con la convicción de que un buen proyecto no empieza dibujando, sino escuchando. Antes de proponer una solución entendemos cómo se usa el espacio, qué limita hoy a quien lo habita y con qué presupuesto real contamos. Solo entonces tiene sentido diseñar.",
        en: "We work from the conviction that a good project does not start by drawing, but by listening. Before proposing a solution we understand how the space is used, what currently constrains the people in it, and what the real budget is. Only then does designing make sense.",
      },
      {
        es: "Cada propuesta busca el equilibrio entre función, estética y viabilidad constructiva. Un espacio bien resuelto tiene que ser cómodo de habitar, coherente de mirar y posible de construir con los recursos disponibles. Cuando alguno de los tres falla, el proyecto falla.",
        en: "Every proposal looks for the balance between function, aesthetics and buildability. A well-resolved space has to be comfortable to inhabit, coherent to look at, and possible to build with the resources at hand. When any one of the three fails, the project fails.",
      },
      {
        es: "El detalle es donde se nota la diferencia: un encuentro bien resuelto, una pendiente que desagua como debe, un acabado que envejece bien. Por eso documentamos el proyecto con precisión y supervisamos la obra hasta el final, respondiendo por lo que entregamos.",
        en: "Detail is where the difference shows: a junction properly resolved, a slope that actually drains, a finish that ages well. That is why we document projects precisely and supervise construction to the end, standing behind what we deliver.",
      },
    ],
    philosophy: {
      es: "No existe una solución única que sirva para todos los espacios. Existe la solución adecuada para este espacio, este presupuesto y estas personas.",
      en: "There is no single solution that fits every space. There is the right solution for this space, this budget and these people.",
    },
    portrait: null,
  },

  method: [
    {
      id: "step-01",
      number: "01",
      title: { es: "Escuchar", en: "Listen" },
      description: {
        es: "Entendemos las necesidades, los objetivos y el contexto real del proyecto antes de proponer nada.",
        en: "We understand the needs, goals and real context of the project before proposing anything.",
      },
      position: 1,
    },
    {
      id: "step-02",
      number: "02",
      title: { es: "Conceptualizar", en: "Conceptualise" },
      description: {
        es: "Traducimos esas necesidades en una idea arquitectónica clara, con criterios que se pueden defender.",
        en: "We turn those needs into a clear architectural idea, with criteria that can be defended.",
      },
      position: 2,
    },
    {
      id: "step-03",
      number: "03",
      title: { es: "Diseñar", en: "Design" },
      description: {
        es: "Desarrollamos la solución espacial, material y técnica hasta que cada decisión tiene una razón.",
        en: "We develop the spatial, material and technical solution until every decision has a reason.",
      },
      position: 3,
    },
    {
      id: "step-04",
      number: "04",
      title: { es: "Planificar", en: "Plan" },
      description: {
        es: "Preparamos el proyecto ejecutivo, el catálogo de conceptos y la estrategia de ejecución y tiempos.",
        en: "We prepare construction documents, the priced scope of work and the delivery strategy.",
      },
      position: 4,
    },
    {
      id: "step-05",
      number: "05",
      title: { es: "Construir", en: "Build" },
      description: {
        es: "Supervisamos y coordinamos la obra controlando calidad, avance y presupuesto en cada etapa.",
        en: "We supervise and coordinate construction, controlling quality, progress and budget at every stage.",
      },
      position: 5,
    },
    {
      id: "step-06",
      number: "06",
      title: { es: "Entregar", en: "Deliver" },
      description: {
        es: "Verificamos que el resultado cumple lo acordado y dejamos el espacio listo para usarse.",
        en: "We verify the result matches what was agreed and hand over the space ready to use.",
      },
      position: 6,
    },
  ],

  values: [
    {
      id: "value-calidad",
      title: { es: "Calidad", en: "Quality" },
      description: {
        es: "Materiales, ejecución y detalle a la altura de lo proyectado. Lo que se entrega debe sostenerse con el tiempo.",
        en: "Materials, workmanship and detail that match the design. What we hand over has to hold up over time.",
      },
      position: 1,
    },
    {
      id: "value-responsabilidad",
      title: { es: "Responsabilidad", en: "Accountability" },
      description: {
        es: "Respondemos por plazos, presupuesto y decisiones técnicas. Si algo cambia, se comunica a tiempo.",
        en: "We answer for schedule, budget and technical decisions. If something changes, you hear it in time.",
      },
      position: 2,
    },
    {
      id: "value-experiencia",
      title: { es: "Experiencia", en: "Experience" },
      description: {
        es: "Criterio construido en obra, no solo en el papel. Sabemos qué funciona y qué genera problemas después.",
        en: "Judgement built on site, not only on paper. We know what works and what causes problems later.",
      },
      position: 3,
    },
    {
      id: "value-compromiso",
      title: { es: "Compromiso", en: "Commitment" },
      description: {
        es: "Acompañamos el proyecto hasta el final, incluso cuando lo fácil sería entregar los planos y desaparecer.",
        en: "We stay with the project to the end, even when the easy option would be to hand over drawings and vanish.",
      },
      position: 4,
    },
  ],

  seo: {
    title: {
      es: "AGM Diseño y Proyección · Arquitectura, remodelación y construcción",
      en: "AGM Diseño y Proyección · Architecture, remodeling and construction",
    },
    description: {
      es: "Despacho de arquitectura especializado en diseño arquitectónico, proyecto ejecutivo, remodelaciones, mantenimiento de inmuebles y supervisión de obra. Solicita una cotización.",
      en: "Architecture practice specialising in architectural design, construction documents, remodeling, property maintenance and construction management. Request a quote.",
    },
    keywords: {
      es: [
        "despacho de arquitectura",
        "diseño arquitectónico",
        "proyecto ejecutivo",
        "remodelaciones",
        "mantenimiento de inmuebles",
        "impermeabilización de azoteas",
        "rehabilitación de fachadas",
        "supervisión de obra",
      ],
      en: [
        "architecture practice",
        "architectural design",
        "construction documents",
        "remodeling",
        "property maintenance",
        "roof waterproofing",
        "facade restoration",
        "construction management",
      ],
    },
    ogImage: null,
  },

  contact: {
    phone: null,
    email: null,
    facebookUrl: null,
    instagramUrl: null,
    addressLine: null,
    city: null,
    state: null,
    country: null,
    openingHours: null,
  },

  // Vacio a proposito: el aviso de privacidad lo redacta el despacho. No se
  // publica un texto legal inventado.
  privacy: {
    body: { es: "", en: "" },
  },

  updatedAt: "2026-01-01T00:00:00.000Z",
};
