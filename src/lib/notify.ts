import { siteConfig } from "@/config/site";
import { PROJECT_TYPE_LABELS, type ContactInput } from "@/lib/validation";

/**
 * Aviso por correo de cada solicitud del formulario.
 *
 * Sin esto el mensaje solo quedaba guardado en la base de datos, y si nadie
 * entraba al panel el cliente potencial se perdia sin que el despacho lo
 * supiera.
 *
 * Se envia con la API HTTP de Resend, sin SDK: es una sola peticion y no
 * justifica una dependencia. Todas las variables son de servidor (sin
 * `NEXT_PUBLIC_`): la clave nunca llega al navegador.
 *
 *  - `RESEND_API_KEY`       obligatoria para enviar; sin ella no se envia nada.
 *  - `CONTACT_NOTIFY_TO`    destinatario; por defecto el correo del despacho.
 *  - `CONTACT_NOTIFY_FROM`  remitente. El de pruebas de Resend solo entrega al
 *                           dueno de la cuenta: con dominio propio verificado,
 *                           ponlo aqui (p. ej. `AGM Web <avisos@midominio.com>`).
 */
export function notifyConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() || null;
  return {
    apiKey,
    enabled: apiKey !== null,
    to: process.env.CONTACT_NOTIFY_TO?.trim() || siteConfig.contact.email,
    from:
      process.env.CONTACT_NOTIFY_FROM?.trim() ||
      `${siteConfig.shortName} Web <onboarding@resend.dev>`,
  };
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Todo lo que escribe el visitante se escapa antes de ir al HTML del correo. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

type NotifiableMessage = Pick<
  ContactInput,
  "name" | "email" | "phone" | "projectType" | "message" | "locale"
>;

export function buildContactEmail(data: NotifiableMessage) {
  const type = PROJECT_TYPE_LABELS[data.projectType];
  const language = data.locale === "es" ? "Español" : "Inglés";
  const phone = data.phone?.trim() || null;

  // El nombre va al asunto sin saltos de linea: un asunto con "\n" es la via
  // clasica para inyectar cabeceras.
  const subject = `Nueva solicitud: ${type} · ${data.name.replace(/[\r\n]+/g, " ")}`;

  const rows: [string, string][] = [
    ["Nombre", escapeHtml(data.name)],
    ["Correo", `<a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>`],
    ...(phone
      ? ([["Teléfono", `<a href="tel:${escapeHtml(phone.replace(/[^\d+]/g, ""))}">${escapeHtml(phone)}</a>`]] as [string, string][])
      : []),
    ["Tipo de proyecto", escapeHtml(type)],
    ["Idioma", language],
  ];

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#1c1f24;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e2df;">
    <tr><td style="padding:24px 28px;border-bottom:1px solid #e2e2df;">
      <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b7078;">${escapeHtml(siteConfig.name)}</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:600;">Nueva solicitud desde la web</h1>
    </td></tr>
    <tr><td style="padding:20px 28px;">
      <table role="presentation" width="100%" style="font-size:14px;border-collapse:collapse;">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:6px 12px 6px 0;color:#6b7078;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 0;">${value}</td></tr>`,
          )
          .join("")}
      </table>
      <p style="margin:20px 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7078;">Mensaje</p>
      <div style="padding:14px 16px;background:#f7f7f5;border-left:2px solid #4a5f78;font-size:14px;line-height:1.6;white-space:pre-line;">${escapeHtml(data.message)}</div>
      <p style="margin:24px 0 0;font-size:12px;color:#6b7078;">Responde a este correo para contestar directamente a ${escapeHtml(data.name)}. También queda guardado en el panel, en Mensajes.</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    "Nueva solicitud desde la web",
    "",
    `Nombre: ${data.name}`,
    `Correo: ${data.email}`,
    ...(phone ? [`Teléfono: ${phone}`] : []),
    `Tipo de proyecto: ${type}`,
    `Idioma: ${language}`,
    "",
    "Mensaje:",
    data.message,
  ].join("\n");

  return { subject, html, text };
}

/**
 * Envia el aviso. No lanza: devuelve si se envio, para que quien llame decida.
 * Un fallo de correo nunca debe tumbar el guardado del mensaje.
 */
export async function sendContactNotification(
  data: NotifiableMessage,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const config = notifyConfig();
  if (!config.enabled) return { ok: false, skipped: true };

  const { subject, html, text } = buildContactEmail(data);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        // "Responder" en el correo contesta directamente al visitante.
        reply_to: data.email,
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        "[notify] Resend rechazo el correo:",
        response.status,
        (await response.text()).slice(0, 300),
      );
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.error("[notify] no se pudo enviar el aviso:", error);
    return { ok: false };
  }
}
