import { createClient } from "npm:@supabase/supabase-js@2";
import { buildProjectSummary, summaryCsv } from "../_shared/project-share.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const URL_ = Deno.env.get("SUPABASE_URL")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function isAdmin(token: string | null) {
  if (!token) return false;
  try {
    const r = await fetch(`${URL_}/functions/v1/admin-auth`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` }, body: JSON.stringify({ action: "validate", token }) });
    return (await r.json()).valid === true;
  } catch { return false; }
}
const str = (v: unknown, max: number) => typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;

async function loadShare(token: unknown) {
  if (typeof token !== "string" || !TOKEN_RE.test(token)) return null;
  const { data } = await db.from("project_shares").select("id, recipient_name, saved_assessment_id, revoked_at").eq("token", token).maybeSingle();
  return data && !data.revoked_at ? data : null;
}
async function loadProject(id: string) {
  const { data } = await db.from("saved_assessments").select("address, property_type, label, calculator_state, results, updated_at").eq("id", id).maybeSingle();
  return data ? buildProjectSummary(data) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = req.headers.get("user-agent")?.slice(0, 300) ?? null;

    if (action === "view" || action === "download") {
      const share = await loadShare(body.token);
      if (!share) return json({ error: "This link is not active." }, 404);
      const project = await loadProject(share.saved_assessment_id);
      if (!project) return json({ error: "Project not found." }, 404);
      await db.from("project_share_events").insert({ share_id: share.id, event: action, detail: action === "download" ? "Project summary (CSV)" : null, ip_address: ip, user_agent: ua });
      if (action === "download") return json({ filename: "project-summary.csv", csv: summaryCsv(project) });
      return json({ recipient_name: share.recipient_name, project });
    }

    if (!(await isAdmin(req.headers.get("x-admin-token")))) return json({ error: "Unauthorized" }, 401);

    if (action === "list") {
      const [{ data: shares }, { data: events }, { data: projects }] = await Promise.all([
        db.from("project_shares").select("*").order("created_at", { ascending: false }),
        db.from("project_share_events").select("share_id, event, detail, ip_address, user_agent, created_at").order("created_at", { ascending: false }).limit(2000),
        db.from("saved_assessments").select("id, address, label, updated_at").order("updated_at", { ascending: false }).limit(500),
      ]);
      return json({ shares: shares ?? [], events: events ?? [], projects: projects ?? [] });
    }
    if (action === "create") {
      const name = str(body.recipient_name, 200), email = str(body.recipient_email, 320), note = str(body.note, 1000);
      const pid = typeof body.saved_assessment_id === "string" && /^[0-9a-f-]{36}$/i.test(body.saved_assessment_id) ? body.saved_assessment_id : null;
      if (!name || !pid) return json({ error: "Recipient name and project are required." }, 400);
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Invalid email." }, 400);
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const { data, error } = await db.from("project_shares").insert({ token, recipient_name: name, recipient_email: email, saved_assessment_id: pid, note }).select().single();
      if (error) throw error;
      return json({ share: data });
    }
    if (action === "revoke") {
      if (typeof body.id !== "string") return json({ error: "id required" }, 400);
      await db.from("project_shares").update({ revoked_at: new Date().toISOString() }).eq("id", body.id);
      return json({ ok: true });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("project-shares error", e);
    return json({ error: "Something went wrong." }, 500);
  }
});
