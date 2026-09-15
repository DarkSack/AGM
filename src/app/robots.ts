import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

/**
 * robots.txt.
 *
 * El panel y la API quedan fuera del rastreo: no aportan nada al indice y no
 * tiene sentido gastar presupuesto de rastreo en ellos. No es una medida de
 * seguridad —de eso se ocupan el proxy y las politicas RLS—, solo de
 * higiene de indexacion.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
