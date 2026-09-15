import { afterEach, describe, expect, it, vi } from "vitest";
import { buildContactEmail, escapeHtml, notifyConfig, sendContactNotification } from "./notify";

const mensaje = {
  name: "Ana <script>alert(1)</script>",
  email: "ana@ejemplo.com",
  phone: "33 1234 5678",
  projectType: "remodeling" as const,
  message: "Hola\n<b>quiero</b> remodelar",
  locale: "es" as const,
};

describe("escapeHtml", () => {
  it("neutraliza el marcado", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });
});

describe("buildContactEmail", () => {
  it("nunca incrusta HTML del visitante sin escapar", () => {
    const { html } = buildContactEmail(mensaje);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>quiero</b>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("pone el tipo de proyecto legible en el asunto y sin saltos de linea", () => {
    const { subject } = buildContactEmail({ ...mensaje, name: "Ana\r\nBcc: x@y.com" });
    expect(subject).toContain("Remodelación");
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("omite el telefono cuando no se dio", () => {
    const { text } = buildContactEmail({ ...mensaje, phone: "" });
    expect(text).not.toContain("Teléfono");
  });
});

describe("sendContactNotification", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("no hace nada sin RESEND_API_KEY", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(notifyConfig().enabled).toBe(false);
    expect(await sendContactNotification(mensaje)).toEqual({ ok: false, skipped: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("envia con reply_to al visitante y no lanza si Resend falla", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_NOTIFY_TO", "despacho@ejemplo.com");
    const fetchSpy = vi.fn().mockResolvedValue(new Response("boom", { status: 500 }));
    vi.stubGlobal("fetch", fetchSpy);
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await sendContactNotification(mensaje)).toEqual({ ok: false });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.to).toEqual(["despacho@ejemplo.com"]);
    expect(body.reply_to).toBe("ana@ejemplo.com");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
  });
});
