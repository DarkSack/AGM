import Script from "next/script";
import { gaMeasurementId } from "@/config/site";

/**
 * GA4.
 *
 * Se carga con `afterInteractive` para que no compita con el LCP, y no se
 * inyecta nada si `NEXT_PUBLIC_GA_MEASUREMENT_ID` esta vacio o conserva el
 * placeholder `G-XXXXXXXXXX`.
 *
 * `anonymize_ip` y la desactivacion de las senales de Google reducen el dato
 * personal que sale del sitio. Las vistas de pagina las gestiona el propio
 * gtag; los eventos concretos se envian desde `lib/analytics`.
 */
export function Analytics() {
  if (!gaMeasurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaMeasurementId}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
    </>
  );
}
