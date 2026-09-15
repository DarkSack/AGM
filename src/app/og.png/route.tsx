import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

/**
 * Imagen Open Graph por defecto (1200×630).
 *
 * Se usa cuando ni la pagina ni el panel definen una imagen social propia:
 * sin ella, compartir el enlace en WhatsApp o Facebook mostraba una tarjeta sin
 * imagen. No es un `opengraph-image` de convencion a proposito: esos ganan
 * siempre a la metadata y pisarian la imagen que el despacho elija en el panel.
 *
 * Se genera una sola vez en el build. Satori no lee woff2, asi que usa su
 * sans-serif integrada en lugar de las fuentes del sitio.
 */
export const dynamic = "force-static";

const BG = "#16181B";
const FG = "#FAFAF9";
const MUTED = "#9A9DA3";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: BG,
          color: FG,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="96" height="96" viewBox="0 0 40 40" fill="none">
            <rect x="1.5" y="1.5" width="37" height="37" stroke={FG} strokeWidth="1" />
            <path d="M8 22 20 10l12 12" stroke={FG} strokeWidth="1.5" />
            <path d="M11 30V25M20 30V16M29 30V25" stroke={FG} strokeWidth="1.5" />
            <path d="M14.5 26h11" stroke={FG} strokeWidth="1.5" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: 10 }}>
              {siteConfig.shortName}
            </span>
            <span
              style={{ fontSize: 20, letterSpacing: 6, color: MUTED, textTransform: "uppercase" }}
            >
              {siteConfig.tagline}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 64, lineHeight: 1.1, maxWidth: 900 }}>
            Mantenemos, renovamos y transformamos tus espacios.
          </span>
          <span style={{ fontSize: 26, color: MUTED }}>
            Arquitectura · Remodelación · Proyecto ejecutivo · {siteConfig.location.city},{" "}
            {siteConfig.location.state}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
