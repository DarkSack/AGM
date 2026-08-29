/**
 * Genera las imagenes de marcador de los proyectos conceptuales.
 *
 * Son dibujos de linea, no fotografias de banco de imagenes: dejan claro que
 * el proyecto es una propuesta y no obra ejecutada, pesan ~2 KB cada uno y no
 * arrastran ninguna licencia. Se sustituyen subiendo fotos reales desde el
 * panel, que quedan en Supabase Storage y pasan por `next/image`.
 *
 *   node scripts/generate-placeholders.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "images",
  "projects",
);

const W = 1600;
const H = 1200;

/** Trama de fondo comun: la retícula de un plano. */
function grid(step = 100) {
  const lines = [];
  for (let x = 0; x <= W; x += step) lines.push(`M${x} 0V${H}`);
  for (let y = 0; y <= H; y += step) lines.push(`M0 ${y}H${W}`);
  return `<path d="${lines.join("")}" stroke="#1B1E22" stroke-opacity="0.07" stroke-width="1"/>`;
}

function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<rect width="${W}" height="${H}" fill="#E9E7E3"/>
${grid()}
<g fill="none" stroke="#1B1E22" stroke-linecap="square" stroke-linejoin="miter">
${body}
</g>
</svg>
`;
}

/** Volumen macizo con una opacidad de relleno suave. */
function solid(d, opacity = 0.06) {
  return `<path d="${d}" fill="#1B1E22" fill-opacity="${opacity}" stroke="none"/>`;
}

const drawings = {
  // Vivienda horizontal: un gran vano continuo bajo una cubierta volada.
  "casa-horizonte": `
${solid("M180 560h1240v380H180z", 0.05)}
<g stroke-width="2.5" stroke-opacity="0.55">
  <path d="M120 540h1360"/>
  <path d="M180 540v400M1420 540v400"/>
  <path d="M180 940h1240"/>
</g>
<g stroke-width="1.6" stroke-opacity="0.4">
  <path d="M260 620h1080v240H260z"/>
  <path d="M530 620v240M800 620v240M1070 620v240"/>
</g>
<g stroke-width="1.2" stroke-opacity="0.25">
  <path d="M0 940h1600"/>
  <path d="M0 1000h1600M0 1060h1600"/>
</g>
<g stroke-width="1.6" stroke-opacity="0.3">
  <path d="M1420 380v160M1300 440v100M1180 410v130"/>
</g>`,

  // Planta con patio: cuatro crujias alrededor de un vacio central.
  "casa-patio": `
${solid("M300 220h1000v760H300z", 0.045)}
<g stroke-width="2.5" stroke-opacity="0.55">
  <path d="M300 220h1000v760H300z"/>
</g>
<g stroke-width="2" stroke-opacity="0.45">
  <path d="M560 460h480v280H560z"/>
</g>
<g stroke-width="1.4" stroke-opacity="0.3">
  <path d="M300 460h260M1040 460h260M300 740h260M1040 740h260"/>
  <path d="M560 220v240M1040 220v240M560 740v240M1040 740v240"/>
  <path d="M420 220v760M1180 220v760"/>
</g>
<g stroke-width="1.2" stroke-opacity="0.22">
  <path d="M600 500h400M600 560h400M600 620h400M600 680h400"/>
</g>`,

  // Interior continuo: alzado con carpinteria y mobiliario esquematico.
  "reforma-nordica": `
${solid("M160 300h1280v600H160z", 0.04)}
<g stroke-width="2.5" stroke-opacity="0.5">
  <path d="M160 300h1280v600H160z"/>
  <path d="M160 900h1280"/>
</g>
<g stroke-width="1.6" stroke-opacity="0.4">
  <path d="M260 420h340v260H260z"/>
  <path d="M260 550h340"/>
  <path d="M430 420v260"/>
</g>
<g stroke-width="1.6" stroke-opacity="0.35">
  <path d="M720 640h420v260H720z"/>
  <path d="M720 720h420"/>
  <path d="M860 640v260M1000 640v260"/>
</g>
<g stroke-width="1.4" stroke-opacity="0.28">
  <path d="M1240 360v540"/>
  <path d="M1240 460h200M1240 560h200M1240 660h200"/>
</g>
<g stroke-width="1.2" stroke-opacity="0.2">
  <path d="M160 960h1280M160 1020h1280"/>
</g>`,

  // Fachada comercial: filtro de lamas verticales sobre planta baja.
  "espacio-urbano": `
${solid("M240 200h1120v760H240z", 0.045)}
<g stroke-width="2.5" stroke-opacity="0.55">
  <path d="M240 200h1120v760H240z"/>
  <path d="M240 660h1120"/>
</g>
<g stroke-width="1.5" stroke-opacity="0.38">
  ${Array.from({ length: 21 }, (_, i) => `<path d="M${300 + i * 50} 240v380"/>`).join("")}
</g>
<g stroke-width="1.8" stroke-opacity="0.42">
  <path d="M420 700h360v260H420z"/>
  <path d="M600 700v260"/>
  <path d="M900 700h300v260H900z"/>
</g>
<g stroke-width="1.2" stroke-opacity="0.22">
  <path d="M0 960h1600M0 1030h1600"/>
</g>`,

  // Volumen de concreto: masa perforada por vanos profundos.
  "casa-concreto": `
${solid("M340 240h920v720H340z", 0.08)}
<g stroke-width="2.8" stroke-opacity="0.55">
  <path d="M340 240h920v720H340z"/>
</g>
<g stroke-width="2" stroke-opacity="0.45">
  <path d="M440 360h240v200H440z"/>
  <path d="M920 360h240v200H920z"/>
  <path d="M440 680h300v280H440z"/>
</g>
<g stroke-width="1.2" stroke-opacity="0.24">
  <path d="M470 390h180v140H470z"/>
  <path d="M950 390h180v140H950z"/>
  <path d="M470 710h240v250H470z"/>
</g>
<g stroke-width="1" stroke-opacity="0.16">
  ${Array.from({ length: 9 }, (_, i) => `<path d="M340 ${320 + i * 80}h920"/>`).join("")}
</g>
<g stroke-width="1.2" stroke-opacity="0.25">
  <path d="M0 960h1600M0 1040h1600"/>
</g>`,

  // Nave rehabilitada: estructura metalica vista y volumenes exentos dentro.
  "estudio-industrial": `
${solid("M180 420h1240v540H180z", 0.04)}
<g stroke-width="2.5" stroke-opacity="0.5">
  <path d="M180 420 800 200l620 220"/>
  <path d="M180 420v540M1420 420v540"/>
  <path d="M180 960h1240"/>
</g>
<g stroke-width="1.4" stroke-opacity="0.32">
  <path d="M180 420h1240"/>
  <path d="M420 330v630M660 245v715M800 200v760M940 245v715M1180 330v630"/>
</g>
<g stroke-width="1.8" stroke-opacity="0.42">
  <path d="M280 700h300v260H280z"/>
  <path d="M700 620h420v340H700z"/>
  <path d="M700 760h420"/>
</g>
<g stroke-width="1.2" stroke-opacity="0.2">
  <path d="M0 960h1600M0 1030h1600"/>
</g>`,
};

mkdirSync(OUT_DIR, { recursive: true });

for (const [slug, body] of Object.entries(drawings)) {
  const file = join(OUT_DIR, `${slug}.svg`);
  writeFileSync(file, wrap(body.trim()), "utf8");
  console.log(`generado ${slug}.svg`);
}

console.log(`\n${Object.keys(drawings).length} imagenes en ${OUT_DIR}`);
