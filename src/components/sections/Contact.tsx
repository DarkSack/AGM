import { getTranslations } from "next-intl/server";
import { siteConfig, whatsappUrl, type Locale } from "@/config/site";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { resolveContact } from "@/lib/contactInfo";
import { buttonClasses } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { TrackedLink } from "@/components/ui/TrackedLink";
import type { SiteSettings } from "@/types/content";
import { ContactForm } from "./ContactForm";

interface ContactProps {
  settings: SiteSettings;
  locale: Locale;
  /** Numeral editorial segun la posicion en la pagina. */
  index: string;
}

/**
 * Contacto.
 *
 * Cierre de la pagina: a la izquierda las vias directas (WhatsApp, telefono,
 * correo) para quien quiere resolverlo en un minuto, a la derecha el
 * formulario para quien prefiere dejar el detalle por escrito.
 */
export async function Contact({ settings, locale, index }: ContactProps) {
  const t = await getTranslations("contact");
  const contact = resolveContact(settings);

  return (
    <Section id="contacto" labelledBy="contacto-title">
      <div className="container-editorial">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4" data-reveal>
              <span className="numeral">{index}</span>
              <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
              <span className="eyebrow">{t("eyebrow")}</span>
            </div>

            <h2
              id="contacto-title"
              className="mt-6 text-h1 text-fg"
              data-reveal
              style={{ "--reveal-delay": "60ms" } as React.CSSProperties}
            >
              {t("title")}
            </h2>

            <p
              className="mt-6 max-w-[42ch] text-lead text-fg-muted"
              data-reveal
              style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
            >
              {t("intro")}
            </p>

            <div className="mt-10" data-reveal>
              <TrackedLink
                href={whatsappUrl(locale, contact.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                event={ANALYTICS_EVENTS.whatsappClick}
                params={{ location: "contact_section", locale }}
                className={buttonClasses("solid", "lg", "w-full sm:w-auto")}
              >
                <WhatsAppGlyph />
                {t("whatsapp")}
              </TrackedLink>
            </div>

            <dl className="mt-12 divide-y divide-line border-y border-line" data-reveal>
              <ContactRow label={t("phone")}>
                <TrackedLink
                  href={contact.phoneHref}
                  event={ANALYTICS_EVENTS.phoneClick}
                  params={{ location: "contact_section", locale }}
                  className="text-fg transition-colors hover:text-accent"
                >
                  {contact.phoneDisplay}
                </TrackedLink>
              </ContactRow>

              <ContactRow label={t("email")}>
                <TrackedLink
                  href={contact.emailHref}
                  event={ANALYTICS_EVENTS.emailClick}
                  params={{ location: "contact_section", locale }}
                  className="break-all text-fg transition-colors hover:text-accent"
                >
                  {contact.email}
                </TrackedLink>
              </ContactRow>

              <ContactRow label={t("facebook")}>
                {contact.facebookUrl ? (
                  <TrackedLink
                    href={contact.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    event={ANALYTICS_EVENTS.facebookClick}
                    params={{ location: "contact_section", locale }}
                    className="text-fg transition-colors hover:text-accent"
                  >
                    {siteConfig.social.facebook.handle}
                  </TrackedLink>
                ) : (
                  // Sin URL real no se inventa un enlace: se muestra el nombre
                  // de la pagina y se marca que falta el dato.
                  <span className="text-fg">
                    {siteConfig.social.facebook.handle}
                    <span className="ml-2 font-sans text-xs text-fg-subtle">
                      ({t("facebookPending")})
                    </span>
                  </span>
                )}
              </ContactRow>

              <ContactRow label={t("location")}>
                {contact.locationPending ? (
                  <span className="font-sans text-sm text-fg-subtle">
                    {t("locationPending")}
                  </span>
                ) : (
                  <span className="text-fg">
                    {contact.addressLine ? `${contact.addressLine}. ` : ""}
                    {contact.cityLine}
                  </span>
                )}
              </ContactRow>
            </dl>
          </div>

          <div className="lg:col-span-6 lg:col-start-7" data-reveal>
            <ContactForm locale={locale} />
          </div>
        </div>
      </div>
    </Section>
  );
}

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-4 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="eyebrow sm:w-28 sm:shrink-0">{label}</dt>
      <dd className="font-sans text-[0.9375rem]">{children}</dd>
    </div>
  );
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-[18px]">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.57c.12.16 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.3Z" />
    </svg>
  );
}
