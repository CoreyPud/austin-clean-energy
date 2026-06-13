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

const AREA_LABELS: Record<string, string> = {
  outreach_community: "Outreach & community building",
  data_validation: "Data validation",
  technical_work: "Technical work",
  engineering_events: "Engineering / volunteering at events",
};

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = req.headers.get("x-admin-token");
    const isValid = await validateToken(token);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "list";

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data, error } = await supabase
      .from("volunteer_signups")
      .select("id, created_at, name, email, involvement_area, notes")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (action === "export") {
      const header = ["created_at", "name", "email", "involvement_area", "notes"];
      const rows = (data ?? []).map((r: any) =>
        [
          r.created_at,
          r.name,
          r.email,
          AREA_LABELS[r.involvement_area] ?? r.involvement_area,
          r.notes ?? "",
        ]
          .map(csvEscape)
          .join(","),
      );
      const csv = [header.join(","), ...rows].join("\n");
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="volunteer-signups.csv"',
        },
      });
    }

    // default: list
    return new Response(
      JSON.stringify({
        signups: data ?? [],
        total: data?.length ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in manage-volunteer-signups:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
