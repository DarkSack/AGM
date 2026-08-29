import type { Locale } from "@/config/site";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { Method } from "@/components/sections/Method";
import { Projects } from "@/components/sections/Projects";
import { Services } from "@/components/sections/Services";
import { Values } from "@/components/sections/Values";
import type {
  ContentBlock,
  Project,
  Service,
  SiteSettings,
} from "@/types/content";
import {
  CtaBlock,
  DividerBlock,
  FeaturedProjectBlock,
  ImageBlock,
  ImageGridBlock,
  QuoteBlock,
  StatsBlock,
  TextBlock,
} from "./SimpleBlocks";

interface BlockRendererProps {
  blocks: ContentBlock[];
  settings: SiteSettings;
  services: Service[];
  projects: Project[];
  locale: Locale;
}

/**
 * Compone la pagina publica a partir del orden de bloques guardado.
 *
 * El `switch` es exhaustivo sobre la union de tipos: si manana se anade un
 * bloque nuevo a `BLOCK_TYPES` sin darle componente, TypeScript falla en la
 * rama `default` en lugar de renderizar un hueco vacio en produccion.
 */
export function BlockRenderer({
  blocks,
  settings,
  services,
  projects,
  locale,
}: BlockRendererProps) {
  return (
    <>
      {blocks
        .filter((block) => block.enabled)
        .map((block) => {
          switch (block.type) {
            case "hero":
              return <Hero key={block.id} settings={settings} locale={locale} />;
            case "about":
              return <About key={block.id} settings={settings} locale={locale} />;
            case "services":
              return (
                <Services key={block.id} services={services} locale={locale} />
              );
            case "projects":
              return (
                <Projects key={block.id} projects={projects} locale={locale} />
              );
            case "method":
              return (
                <Method key={block.id} steps={settings.method} locale={locale} />
              );
            case "values":
              return (
                <Values key={block.id} values={settings.values} locale={locale} />
              );
            case "contact":
              return (
                <Contact key={block.id} settings={settings} locale={locale} />
              );
            case "featuredProject":
              return (
                <FeaturedProjectBlock
                  key={block.id}
                  block={block}
                  locale={locale}
                  projects={projects}
                />
              );
            case "stats":
              return <StatsBlock key={block.id} block={block} locale={locale} />;
            case "quote":
              return <QuoteBlock key={block.id} block={block} locale={locale} />;
            case "text":
              return <TextBlock key={block.id} block={block} locale={locale} />;
            case "image":
              return <ImageBlock key={block.id} block={block} locale={locale} />;
            case "imageGrid":
              return (
                <ImageGridBlock key={block.id} block={block} locale={locale} />
              );
            case "cta":
              return <CtaBlock key={block.id} block={block} locale={locale} />;
            case "divider":
              return <DividerBlock key={block.id} />;
            default: {
              const exhaustive: never = block;
              void exhaustive;
              return null;
            }
          }
        })}
    </>
  );
}
