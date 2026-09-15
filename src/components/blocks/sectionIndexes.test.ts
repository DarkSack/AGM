import { describe, expect, it } from "vitest";
import type { ContentBlock } from "@/types/content";
import { sectionIndexes } from "./sectionIndexes";

function block(id: string, type: ContentBlock["type"], enabled = true): ContentBlock {
  return { id, type, position: 0, enabled, data: {} } as ContentBlock;
}

describe("sectionIndexes", () => {
  it("numera las secciones en el orden en que aparecen", () => {
    const indexes = sectionIndexes([
      block("h", "hero"),
      block("c", "contact"),
      block("a", "about"),
    ]);
    expect(indexes.get("c")).toBe("01");
    expect(indexes.get("a")).toBe("02");
    expect(indexes.has("h")).toBe(false);
  });

  it("no cuenta los bloques ocultos ni los que no llevan numeral", () => {
    const indexes = sectionIndexes([
      block("a", "about", false),
      block("t", "text"),
      block("s", "services"),
    ]);
    expect(indexes.get("s")).toBe("01");
    expect(indexes.has("a")).toBe(false);
    expect(indexes.has("t")).toBe(false);
  });
});
