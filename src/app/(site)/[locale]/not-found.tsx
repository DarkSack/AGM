import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-[70svh] items-center pt-28 pb-20">
      <div className="container-editorial">
        <span className="numeral">404</span>
        <h1 className="mt-4 text-h1 text-fg">{t("title")}</h1>
        <p className="mt-5 max-w-[46ch] text-lead text-fg-muted">{t("body")}</p>
        <Link href="/" className={buttonClasses("outline", "md", "mt-9")}>
          {t("cta")}
        </Link>
      </div>
    </div>
  );
}
