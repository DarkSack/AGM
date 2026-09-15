/**
 * Secciones del panel, en el orden en que se usan: primero lo que se toca a
 * diario (proyectos, mensajes), despues lo que se ajusta de vez en cuando.
 */
export const ADMIN_NAV = [
  { href: "/admin", label: "Inicio", exact: true },
  { href: "/admin/proyectos", label: "Proyectos" },
  { href: "/admin/mensajes", label: "Mensajes" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/contenido", label: "Contenido" },
  { href: "/admin/bloques", label: "Composición" },
  { href: "/admin/despacho", label: "Despacho" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/privacidad", label: "Privacidad" },
] as const;

export type AdminNavItem = (typeof ADMIN_NAV)[number];
