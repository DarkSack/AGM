import { getTranslations } from "next-intl/server";
import { siteConfig, type Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { resolveContact } from "@/lib/contactInfo";
import { TrackedLink } from "@/components/ui/TrackedLink";
import type { SiteSettings } from "@/types/content";
import { FooterNav } from "./FooterNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

interface FooterProps {
  settings: SiteSettings;
  locale: Locale;
}

export async function Footer({ settings, locale }: FooterProps) {
  const t = await getTranslations("footer");
  const tContact = await getTranslations("contact");
  const contact = resolveContact(settings);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-bg-alt">
      <div className="container-editorial py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-6 max-w-[34ch] text-sm leading-relaxed text-fg-muted">
              {settings.hero.subtitle[locale]}
            </p>
          </div>

          {/* Las columnas tienen que sumar 12: con la navegacion en 3 la
              columna "Legal" no cabia y bajaba a una segunda fila. */}
          <nav aria-labelledby="footer-nav" className="lg:col-span-2 lg:col-start-6">
            <h2 id="footer-nav" className="eyebrow font-sans">
              {t("navHeading")}
            </h2>
            <FooterNav />
          </nav>

          <div className="lg:col-span-3">
            <h2 className="eyebrow font-sans">{t("contactHeading")}</h2>
            <ul className="mt-5 flex flex-col gap-3">
              <li>
                <TrackedLink
                  href={contact.phoneHref}
                  event={ANALYTICS_EVENTS.phoneClick}
                  params={{ location: "footer", locale }}
                  className="font-sans text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  {contact.phoneDisplay}
                </TrackedLink>
              </li>
              <li>
                <TrackedLink
                  href={contact.emailHref}
                  event={ANALYTICS_EVENTS.emailClick}
                  params={{ location: "footer", locale }}
                  className="font-sans text-sm break-all text-fg-muted transition-colors hover:text-fg"
                >
                  {contact.email}
                </TrackedLink>
              </li>
              <li>
                {contact.facebookUrl ? (
                  <TrackedLink
                    href={contact.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    event={ANALYTICS_EVENTS.facebookClick}
                    params={{ location: "footer", locale }}
                    className="font-sans text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {tContact("facebook")}
                  </TrackedLink>
                ) : (
                  <span className="font-sans text-sm text-fg-subtle">
                    {tContact("facebook")} · {tContact("facebookPending")}
                  </span>
                )}
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="eyebrow font-sans">{t("legalHeading")}</h2>
            <ul className="mt-5 flex flex-col gap-3">
              <li>
                <Link
                  href="/aviso-de-privacidad"
                  className="font-sans text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  {t("privacy")}
                </Link>
              </li>
            </ul>

            <div className="mt-8">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-xs text-fg-subtle">
            © {year} {siteConfig.name}. {t("rights")}
          </p>

          {siteConfig.credit ? (
            <p className="font-sans text-xs text-fg-subtle">
              {siteConfig.credit.label}:{" "}
              {siteConfig.credit.url ? (
                <a
                  href={siteConfig.credit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fg-muted transition-colors hover:text-fg"
                >
                  {siteConfig.credit.name}
                </a>
              ) : (
                <span className="text-fg-muted">{siteConfig.credit.name}</span>
              )}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
