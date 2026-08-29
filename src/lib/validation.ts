import { z } from "zod";
import { LOCALES } from "@/config/site";

/**
 * Esquema compartido por el formulario y la ruta de API.
 *
 * Que el navegador valide es una comodidad para el usuario; la validacion que
 * cuenta es la del servidor, que usa exactamente este mismo esquema. Los
 * limites coinciden con los CHECK de la tabla `contact_messages`, de modo que
 * hay tres barreras: navegador, API y base de datos.
 *
 * Los mensajes son claves de traduccion, no texto: el idioma lo resuelve quien
 * pinta el error.
 */
export const PROJECT_TYPES = [
  "architectural-design",
  "remodeling",
  "construction",
  "maintenance",
  "executive-project",
  "consulting",
  "other",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

/** Digitos, espacios, guiones, puntos y parentesis; opcionalmente con `+`. */
const PHONE_PATTERN = /^\+?[\d\s().-]{7,25}$/;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "nameRequired")
    .max(120, "nameTooLong"),
  email: z
    .string()
    .trim()
    .min(1, "emailRequired")
    .max(200, "emailInvalid")
    .email("emailInvalid"),
  phone: z
    .string()
    .trim()
    .max(40, "phoneInvalid")
    .regex(PHONE_PATTERN, "phoneInvalid")
    .optional()
    .or(z.literal("")),
  projectType: z.enum(PROJECT_TYPES, { message: "projectTypeRequired" }),
  message: z
    .string()
    .trim()
    .min(10, "messageTooShort")
    .max(4000, "messageTooLong"),
  locale: z.enum(LOCALES).default("es"),
  /**
   * Trampa para bots: campo oculto que una persona nunca rellena.
   *
   * El esquema lo acepta con cualquier valor a proposito. Si lo rechazara, el
   * bot recibiria un 400 y sabria que ese campo importa; asi la ruta puede
   * responder 200 y descartar el envio sin darle ninguna pista.
   */
  company: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Convierte los errores de zod en un mapa campo -> clave de traduccion. */
export function fieldErrors(
  error: z.ZodError<ContactInput>,
): Partial<Record<keyof ContactInput, string>> {
  const result: Partial<Record<keyof ContactInput, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    const key = field as keyof ContactInput;
    result[key] ??= issue.message;
  }
  return result;
}
