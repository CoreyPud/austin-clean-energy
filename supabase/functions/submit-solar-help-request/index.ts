import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clean = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const name = clean(body.name, 200);
    const email = clean(body.email, 320);
    const message = clean(body.message, 5000);
    const sourcePage = clean(body.source_page, 300) || null;

    if (!name || !email || !message) {
      return json({ error: "name, email and message are required" }, 400);
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "A valid email address is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("solar_help_requests")
      .insert({
        name,
        email,
        message,
        source_page: sourcePage,
        user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Insert failed:", error.message);
      return json({ error: "Could not save your request" }, 500);
    }

    // Admin notification email. Sending is best-effort: a failed notification must never lose
    // an already-stored submission, so the response stays successful either way.
    let notified = false;
    const adminEmail = Deno.env.get("SOLAR_HELP_NOTIFY_EMAIL");
    if (adminEmail) {
      try {
        const res = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "solar-help-request",
            recipientEmail: adminEmail,
            idempotencyKey: `solar-help-request-${data.id}`,
            templateData: { name, email, message, sourcePage },
          },
        });
        if (res.error) throw res.error;
        notified = true;
        await supabase
          .from("solar_help_requests")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", data.id);
      } catch (e) {
        console.error("Notification email failed:", e instanceof Error ? e.message : e);
      }
    } else {
      console.warn("SOLAR_HELP_NOTIFY_EMAIL is not set; skipping admin notification");
    }

    return json({ ok: true, id: data.id, notified });
  } catch (e) {
    console.error("submit-solar-help-request error:", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
