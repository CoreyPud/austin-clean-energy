import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function validateToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: "validate", token }),
    });
    const result = await response.json();
    return result.valid === true;
  } catch (e) {
    console.error("Token validation error:", e);
    return false;
  }
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const isValid = await validateToken(req.headers.get("x-admin-token"));
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const action = new URL(req.url).searchParams.get("action") ?? "list";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("solar_help_requests")
      .select("id, created_at, name, email, message, source_page, notified_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (action === "export") {
      const header = ["created_at", "name", "email", "message", "source_page", "notified_at"];
      const rows = (data ?? []).map((r: any) =>
        [r.created_at, r.name, r.email, r.message, r.source_page ?? "", r.notified_at ?? ""]
          .map(csvEscape)
          .join(","),
      );
      return new Response([header.join(","), ...rows].join("\n"), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="solar-help-requests.csv"',
        },
      });
    }

    return new Response(
      JSON.stringify({ requests: data ?? [], total: data?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in manage-solar-help-requests:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
