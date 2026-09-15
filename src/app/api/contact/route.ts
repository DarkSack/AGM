import { NextResponse, after } from "next/server";
import { notifyConfig, sendContactNotification } from "@/lib/notify";
import { contactSchema, fieldErrors } from "@/lib/validation";
import { getPublicSupabase } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";
/** Nunca se cachea: cada peticion es una escritura. */
export const dynamic = "force-dynamic";

/**
 * Limite por IP, en memoria del proceso.
 *
 * Frena el envio repetido desde una misma pestana, que es el abuso habitual en
 * un formulario de contacto. No es una defensa completa: en un despliegue con
 * varias instancias cada una lleva su propia cuenta. Si el volumen de spam lo
 * justifica, el paso siguiente es un almacen compartido o un captcha, no
 * endurecer esto.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  // Poda perezosa para que el mapa no crezca sin limite.
  if (hits.size > 5_000) {
    for (const [entryKey, times] of hits) {
      if (times.every((time) => now - time >= WINDOW_MS)) hits.delete(entryKey);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  return ip || "unknown";
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "invalid_input", errors: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot: se responde 200 para no darle al bot ninguna senal util.
  if (data.company) {
    return NextResponse.json({ ok: true });
  }

  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { ok: false, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  const supabase = isSupabaseConfigured ? getPublicSupabase() : null;

  if (supabase) {
    const { error } = await supabase.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      project_type: data.projectType,
      message: data.message,
      locale: data.locale,
    });

    // El trigger `limit_contact_messages` de la base de datos tiene la ultima
    // palabra sobre el ritmo de envios, incluso entre instancias.
    if (error?.message.includes("contact_rate_limited")) {
      return NextResponse.json(
        { ok: false, code: "rate_limited" },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }

    if (!error) {
      // El aviso sale despues de responder: el visitante no espera a Resend,
      // y un fallo del correo no convierte en error un mensaje ya guardado.
      after(() => sendContactNotification(data));
      return NextResponse.json({ ok: true });
    }

    console.error("[contact] no se pudo guardar el mensaje:", error.message);
  }

  // No se pudo guardar (sin backend o con la base de datos caida). Si el
  // correo esta configurado es la unica via que queda, y se espera a saber si
  // salio: solo entonces se le dice al visitante que su mensaje llego.
  if (notifyConfig().enabled) {
    const sent = await sendContactNotification(data);
    if (sent.ok) return NextResponse.json({ ok: true });
  }

  // Ni guardado ni enviado. Se dice claramente en lugar de fingir un envio
  // correcto: el visitante debe saber que tiene que usar WhatsApp o el correo.
  return supabase
    ? NextResponse.json({ ok: false, code: "storage_error" }, { status: 502 })
    : NextResponse.json({ ok: false, code: "not_configured" }, { status: 503 });
}
