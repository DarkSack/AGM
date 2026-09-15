import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/site";
import { Section, SectionHeading } from "@/components/ui/Section";
import type { Project } from "@/types/content";
import { ProjectCard } from "./ProjectCard";

interface ProjectsProps {
  projects: Project[];
  locale: Locale;
  /** Numeral editorial segun la posicion en la pagina. */
  index: string;
}

/**
 * Retícula asimetrica.
 *
 * El patron se repite cada seis piezas alternando anchos y proporciones, de
 * modo que la seccion respira como una doble pagina de revista y no como un
 * catalogo. Funciona con cualquier numero de proyectos porque el patron cicla.
 */
const LAYOUT = [
  { span: 7, aspect: "4/3" },
  { span: 5, aspect: "3/4" },
  { span: 5, aspect: "3/4" },
  { span: 7, aspect: "4/3" },
  { span: 6, aspect: "16/10" },
  { span: 6, aspect: "16/10" },
] as const;

export async function Projects({ projects, locale, index }: ProjectsProps) {
  const t = await getTranslations("projects");

  const hasConcepts = projects.some((project) => project.isConcept);

  return (
    <Section id="proyectos" labelledBy="proyectos-title" tone="alt">
      <div className="container-editorial">
        <SectionHeading
          id="proyectos-title"
          index={index}
          eyebrow={t("eyebrow")}
          title={t("title")}
          intro={t("intro")}
        />

        {hasConcepts ? (
          // Aviso explicito: estas propuestas no son obra ejecutada por AGM.
          <p
            className="mt-8 max-w-[70ch] border-l-2 border-accent bg-bg py-4 pr-5 pl-5 text-sm leading-relaxed text-fg-muted"
            data-reveal
          >
            {t("conceptNotice")}
          </p>
        ) : null}

        {projects.length === 0 ? (
          <p className="mt-14 text-lead text-fg-muted">{t("empty")}</p>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-24">
            {projects.map((project, index) => {
              const layout = LAYOUT[index % LAYOUT.length] ?? LAYOUT[0];
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  locale={locale}
                  span={layout.span}
                  aspect={layout.aspect}
                  priority={index === 0}
                  delay={Math.min(index, 3) * 60}
                />
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
}
