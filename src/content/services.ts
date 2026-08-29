import type { Service } from "@/types/content";

/**
 * Los ocho servicios que AGM anuncia en su papeleria. Son el contenido inicial:
 * desde el panel se pueden editar, reordenar, desactivar o ampliar.
 */
export const defaultServices: Service[] = [
  {
    id: "svc-mantenimiento",
    slug: "mantenimiento-de-inmuebles",
    title: {
      es: "Mantenimiento de inmuebles",
      en: "Property maintenance",
    },
    description: {
      es: "Conservación preventiva y correctiva de edificios y espacios en uso. Diagnóstico del estado actual, plan de intervención y ejecución sin interrumpir la actividad del inmueble.",
      en: "Preventive and corrective upkeep of buildings in active use. We assess current condition, define an intervention plan and carry it out without disrupting daily operation.",
    },
    icon: "maintenance",
    position: 1,
    active: true,
  },
  {
    id: "svc-remodelaciones",
    slug: "remodelaciones",
    title: { es: "Remodelaciones", en: "Remodeling" },
    description: {
      es: "Transformación de espacios residenciales y comerciales que ya no responden a quien los habita. Reorganizamos distribución, luz y materiales partiendo de lo que ya existe.",
      en: "Reworking residential and commercial spaces that no longer fit the people using them. We rethink layout, light and materials starting from what is already there.",
    },
    icon: "remodeling",
    position: 2,
    active: true,
  },
  {
    id: "svc-impermeabilizacion",
    slug: "impermeabilizacion-de-azoteas",
    title: {
      es: "Impermeabilización de azoteas",
      en: "Roof waterproofing",
    },
    description: {
      es: "Protección de cubiertas frente a filtraciones. Preparación del sustrato, elección del sistema adecuado a cada azotea y garantía sobre el trabajo ejecutado.",
      en: "Protecting roofs against water ingress. Substrate preparation, a waterproofing system matched to each roof, and a warranty on the work delivered.",
    },
    icon: "waterproofing",
    position: 3,
    active: true,
  },
  {
    id: "svc-fachadas",
    slug: "rehabilitacion-de-fachadas",
    title: {
      es: "Rehabilitación de fachadas",
      en: "Facade restoration",
    },
    description: {
      es: "Recuperación de la envolvente del edificio: tratamiento de grietas y humedades, reposición de acabados y una imagen exterior que vuelve a estar a la altura.",
      en: "Restoring the building envelope: treating cracks and damp, replacing finishes, and giving the exterior back the presence it deserves.",
    },
    icon: "facade",
    position: 4,
    active: true,
  },
  {
    id: "svc-diseno",
    slug: "diseno-arquitectonico",
    title: {
      es: "Diseño arquitectónico",
      en: "Architectural design",
    },
    description: {
      es: "Proyecto de espacios funcionales y coherentes con su contexto. Del programa de necesidades a la definición formal, material y espacial de la propuesta.",
      en: "Designing functional spaces that answer to their context. From the brief to the formal, material and spatial definition of the proposal.",
    },
    icon: "design",
    position: 5,
    active: true,
  },
  {
    id: "svc-ejecutivo",
    slug: "proyecto-ejecutivo",
    title: { es: "Proyecto ejecutivo", en: "Construction documents" },
    description: {
      es: "La documentación técnica que permite construir sin improvisar: planos constructivos, detalles, especificaciones y catálogo de conceptos para presupuestar con precisión.",
      en: "The technical documentation that makes building predictable: construction drawings, details, specifications and a priced scope of work.",
    },
    icon: "blueprint",
    position: 6,
    active: true,
  },
  {
    id: "svc-consultoria",
    slug: "consultoria-arquitectonica",
    title: {
      es: "Consultoría arquitectónica",
      en: "Architectural consulting",
    },
    description: {
      es: "Acompañamiento para decidir con criterio antes de invertir: viabilidad de una idea, revisión de un proyecto ajeno o segunda opinión sobre una obra en curso.",
      en: "Support for deciding with criteria before investing: feasibility of an idea, review of an external project, or a second opinion on work already underway.",
    },
    icon: "consulting",
    position: 7,
    active: true,
  },
  {
    id: "svc-supervision",
    slug: "supervision-y-ejecucion-de-obra",
    title: {
      es: "Supervisión y ejecución de obra",
      en: "Construction management",
    },
    description: {
      es: "Coordinación de oficios, control de calidad, avance y presupuesto. La obra se ejecuta según lo proyectado y usted recibe reportes claros de cada etapa.",
      en: "Coordinating trades, quality, schedule and budget. The work is built as designed, and you get clear reporting at every stage.",
    },
    icon: "supervision",
    position: 8,
    active: true,
  },
];
