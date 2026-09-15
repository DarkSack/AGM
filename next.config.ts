import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * El host de Supabase Storage se deriva de la URL publica del proyecto para que
 * `next/image` pueda optimizar las fotos que sube el despacho desde el panel.
 */
const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

/**
 * Content-Security-Policy, de momento en modo **solo reporte**.
 *
 * En este modo el navegador no bloquea nada: solo avisa en la consola de lo que
 * bloquearia. Es el paso previo obligado porque Tag Manager carga etiquetas
 * que se configuran fuera del codigo, y una politica aplicada a ciegas podria
 * romper la medicion sin que nadie lo notara. Cuando la consola del sitio
 * publicado este limpia, se cambia la cabecera a `Content-Security-Policy`.
 *
 * `'unsafe-inline'` en scripts es necesario con paginas estaticas: Next inyecta
 * scripts en linea para hidratar, y la alternativa (nonces) obliga a renderizar
 * cada pagina en cada peticion, que es justo lo que el ISR evita.
 */
const googleTags = [
  "https://www.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
];

const contentSecurityPolicy = [
  "default-src 'self'",
  // `'unsafe-eval'` solo en desarrollo: lo usa React para las trazas de error y
  // la recarga en caliente. En produccion no hace falta y no se permite.
  `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} ${googleTags.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseHost ? `https://${supabaseHost}` : ""} ${googleTags.join(" ")}`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseHost ? `https://${supabaseHost} wss://${supabaseHost}` : ""} ${googleTags.join(" ")}`,
  "frame-src https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
]
  .map((directive) => directive.replace(/\s+/g, " ").trim())
  .join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Obliga a HTTPS durante dos anos en visitas posteriores. Sin
          // `preload`: entrar en esa lista es dificil de revertir.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
