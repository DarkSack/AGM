import Script from "next/script";
import { gaMeasurementId, gtmContainerId } from "@/config/site";

/**
 * Medicion de audiencia. Dos caminos, y solo se usa uno.
 *
 * 1. Google Tag Manager (`NEXT_PUBLIC_GTM_ID`, del tipo `GTM-XXXXXXX`). El
 *    contenedor decide que etiquetas se cargan sin tocar el codigo, que es lo
 *    comodo para quien reciba el sitio.
 * 2. GA4 directo (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, del tipo `G-XXXXXXXXXX`).
 *    Mas ligero y con la configuracion de privacidad fijada aqui.
 *
 * GTM tiene prioridad: si el contenedor ya lleva dentro una etiqueta de GA4 y
 * ademas se configurara el identificador de GA4, cada visita se contaria dos
 * veces.
 *
 * OJO con la privacidad: en el camino 1 los ajustes de `anonymize_ip` y de las
 * senales de Google se configuran DENTRO de Tag Manager, no aqui. Este
 * componente no puede garantizarlos. En el camino 2 si van fijados abajo.
 *
 * Ambos se cargan con `afterInteractive` para no competir con el LCP. Las
 * vistas de pagina se registran solas; los eventos concretos salen de
 * `lib/analytics`.
 */
export function Analytics() {
  if (gtmContainerId) {
    return (
      <Script id="gtm-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
          (function (d, s, i) {
            var j = d.createElement(s);
            j.async = true;
            j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i;
            var f = d.getElementsByTagName(s)[0];
            f.parentNode.insertBefore(j, f);
          })(document, 'script', ${JSON.stringify(gtmContainerId)});
        `}
      </Script>
    );
  }

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

/**
 * El `<noscript>` de Tag Manager, que Google pide justo despues de `<body>`.
 *
 * Va aparte porque su sitio en el arbol no es el mismo que el del script: este
 * tiene que ser el primer hijo de `<body>`, y aquel se carga al final. Sin JS
 * apenas registra nada, pero es lo que documenta Google y no cuesta nada.
 */
export function AnalyticsNoScript() {
  if (!gtmContainerId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
