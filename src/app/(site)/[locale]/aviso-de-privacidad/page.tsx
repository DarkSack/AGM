import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/config/site";
import { getSettings } from "@/data/queries";
import { resolveContact } from "@/lib/contactInfo";
import { privacySections, privacyText } from "@/lib/privacy";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";

/** El texto se edita en el panel: se revalida como la portada. */
export const revalidate = 300;

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
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: "privacy" }),
    getSettings(),
  ]);
  const text = privacyText(settings, locale);

  return buildPageMetadata({
    locale,
    pathname: "/aviso-de-privacidad",
    title: t("title"),
    description: (text ?? t("body")).slice(0, 155),
    // Solo se indexa el aviso real. El provisional no aporta nada a Google.
    index: text !== null,
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
  const [t, settings] = await Promise.all([getTranslations("privacy"), getSettings()]);
  const text = privacyText(settings, locale);
  const contact = resolveContact(settings);

  const sections = text ? privacySections(text) : [];

  const updated = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en", {
    dateStyle: "long",
  }).format(new Date(settings.updatedAt));

  return (
    <div className="pt-32 pb-24 md:pt-40">
      <div className="container-editorial">
        <div className="max-w-[68ch]">
          <h1 className="text-h1 text-fg">{t("title")}</h1>

          {text ? (
            <>
              <p className="mt-6 font-sans text-xs text-fg-subtle">
                {t("updated", { date: updated })}
              </p>
              <div className="mt-10 flex flex-col gap-6">
                {sections.map((section, index) => (
                  <p
                    key={index}
                    className="text-base leading-[1.75] whitespace-pre-line text-fg-muted"
                  >
                    {section}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="mt-8 text-base leading-[1.75] text-fg-muted">{t("body")}</p>
              <p className="mt-8 border-l-2 border-accent py-3 pl-5 font-sans text-sm leading-relaxed text-fg-muted">
                {t.rich("placeholderNotice", {
                  email: () => (
                    <a
                      href={contact.emailHref}
                      className="break-all text-fg underline underline-offset-4"
                    >
                      {contact.email}
                    </a>
                  ),
                })}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
