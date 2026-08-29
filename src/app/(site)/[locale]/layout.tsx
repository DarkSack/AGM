import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { googleSiteVerification, isLocale, siteUrl } from "@/config/site";
import { displayFont, sansFont } from "@/fonts";
import { getSettings } from "@/data/queries";
import { routing } from "@/i18n/routing";
import { Analytics } from "@/components/layout/Analytics";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ThemeKeeper } from "@/components/layout/ThemeKeeper";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { RevealObserver } from "@/components/ui/RevealObserver";
import "../../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  // El color de la barra del navegador acompana al tema activo.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#16181B" },
  ],
  colorScheme: "light dark",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  setRequestLocale(locale);
  const settings = await getSettings();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.seo.title[locale],
      // Las paginas internas anaden su propio titulo delante del nombre.
      template: `%s · AGM Diseño y Proyección`,
    },
    description: settings.seo.description[locale],
    applicationName: "AGM Diseño y Proyección",
    authors: [{ name: "AGM Diseño y Proyección" }],
    creator: "AGM Diseño y Proyección",
    formatDetection: { telephone: true, address: false, email: true },
    verification: googleSiteVerification
      ? { google: googleSiteVerification }
      : undefined,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Necesario para que las paginas de este segmento se puedan renderizar de
  // forma estatica: sin esto next-intl las marca como dinamicas.
  setRequestLocale(locale);

  const [settings, messages, t] = await Promise.all([
    getSettings(),
    // En next-intl 3 hay que entregar los mensajes al proveedor de forma
    // explicita: sin esto los componentes de cliente (navbar, formulario,
    // selector de idioma) se quedan sin traducciones.
    getMessages(),
    getTranslations("nav"),
  ]);

  return (
    // <html> no recibe `className`: es lo unico que impide que React lo
    // reescriba al re-renderizar este layout (al cambiar de idioma, por
    // ejemplo) y se lleve por delante la clase `dark` del script de tema.
    // Las variables de fuente van en <body>.
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${displayFont.variable} ${sansFont.variable} min-h-svh antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:bg-fg focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:text-bg"
          >
            {t("skipToContent")}
          </a>

          <Header />

          <main id="contenido">{children}</main>

          <Footer settings={settings} locale={locale} />

          <ThemeKeeper />
          <RevealObserver />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
