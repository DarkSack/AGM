import { PROJECT_TYPE_LABELS } from "@/lib/validation";
import type { ContactMessage } from "@/types/content";

/**
 * Celda CSV segura.
 *
 * Dos riesgos distintos. Uno de formato: comillas, comas y saltos de linea
 * rompen columnas si no se entrecomillan. Otro de seguridad: el texto lo
 * escribio un visitante, y una celda que empieza por `=`, `+`, `-` o `@` Excel
 * la ejecuta como formula ("inyeccion CSV"). Se neutraliza anteponiendo un
 * apostrofo, que Excel oculta al mostrarla.
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function messagesToCsv(messages: ContactMessage[]): string {
  const header = [
    "Fecha",
    "Nombre",
    "Correo",
    "Teléfono",
    "Tipo de proyecto",
    "Idioma",
    "Leído",
    "Mensaje",
  ];

  const rows = messages.map((message) => [
    message.createdAt,
    message.name,
    message.email,
    message.phone,
    (PROJECT_TYPE_LABELS as Record<string, string>)[message.projectType] ??
      message.projectType,
    message.locale === "es" ? "Español" : "Inglés",
    message.read ? "Sí" : "No",
    message.message,
  ]);

  // BOM + CRLF: sin el BOM, Excel en Windows abre el UTF-8 como Latin-1 y
  // destroza los acentos de "Teléfono" o "Remodelación".
  return `﻿${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
