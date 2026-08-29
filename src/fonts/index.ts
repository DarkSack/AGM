import localFont from "next/font/local";

/**
 * Tipografia del proyecto, autoalojada.
 *
 * Instrument Serif para los titulares: un serif editorial de alto contraste
 * que aporta la voz de revista de arquitectura que pedia el encargo.
 * Archivo para el resto: una grotesca de senalizacion que sostiene bien los
 * textos largos y que, en mayusculas con tracking, imita las anotaciones de un
 * plano.
 *
 * `display: "swap"` evita el texto invisible mientras carga la fuente, y
 * `adjustFontFallback` ajusta las metricas del respaldo para que el salto al
 * intercambiar apenas mueva el texto (CLS).
 */
export const displayFont = localFont({
  src: "./InstrumentSerif-Regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-instrument-serif",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

/** Un unico fichero variable cubre de 400 a 700. */
export const sansFont = localFont({
  src: "./Archivo-Variable.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-archivo",
  fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});
