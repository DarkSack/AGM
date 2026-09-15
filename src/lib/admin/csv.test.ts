import { describe, expect, it } from "vitest";
import { csvCell, messagesToCsv } from "./csv";

describe("csvCell", () => {
  it("entrecomilla lo que romperia las columnas", () => {
    expect(csvCell('Hola, "amigo"\nadios')).toBe('"Hola, ""amigo""\nadios"');
    expect(csvCell("simple")).toBe("simple");
    expect(csvCell(null)).toBe("");
  });

  it("neutraliza formulas de Excel escritas por un visitante", () => {
    expect(csvCell("=HYPERLINK(\"http://x\")")).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell("+52 33 1234")).toBe("'+52 33 1234");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });
});

describe("messagesToCsv", () => {
  it("lleva BOM, cabecera y una fila por mensaje con etiquetas legibles", () => {
    const csv = messagesToCsv([
      {
        id: "1",
        name: "Ana",
        email: "ana@ejemplo.com",
        phone: null,
        projectType: "remodeling",
        message: "Hola",
        locale: "es",
        read: false,
        createdAt: "2026-09-15T10:00:00.000Z",
      },
    ]);
    expect(csv.startsWith("﻿Fecha,Nombre")).toBe(true);
    expect(csv).toContain("Remodelación,Español,No,Hola");
    expect(csv.trimEnd().split("\r\n")).toHaveLength(2);
  });
});
