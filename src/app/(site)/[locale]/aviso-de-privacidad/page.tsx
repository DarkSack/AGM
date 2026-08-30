import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/config/site";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "privacy" });

  return buildPageMetadata({
    locale,
    pathname: "/aviso-de-privacidad",
    title: t("title"),
    description: t("body").slice(0, 155),
    // Es un marcador: no interesa que Google lo indexe hasta que el despacho
    // redacte el texto definitivo.
    index: false,
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);

  // DIAGNOSTICO TEMPORAL: el deploy falla aqui con el mensaje enmascarado.
  let t;
  try {
    t = await getTranslations("privacy");
  } catch (error) {
    const e = error as Error & { digest?: string };
    console.error(
      `[diag] getTranslations locale=${locale} digest=${e?.digest}
${e?.stack ?? String(error)}`,
    );
    throw error;
  }

  return (
    <div className="pt-32 pb-24 md:pt-40">
      <div className="container-editorial">
        <div className="max-w-[68ch]">
          <h1 className="text-h1 text-fg">{t("title")}</h1>

          <p className="mt-8 border-l-2 border-accent py-3 pl-5 font-sans text-sm leading-relaxed text-fg-muted">
            {t("placeholderNotice")}
          </p>

          <p className="mt-8 text-base leading-[1.75] text-fg-muted">
            {t("body")}
          </p>
        </div>
      </div>
    </div>
  );
}
