import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PROGRAMS, validateDetails, reviewComplete, canAdminAccess, encryptDetails, decryptDetails, csvCell } from "./security.ts";
import { solarTextFields, solarNumberFields, solarFormRoute, solarForms } from "../_shared/rebate-form-model.ts";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-admin-token", "Cache-Control": "no-store", "Content-Type": "application/json" };
const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return response(405, { error: "Method not allowed" });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const secret = Deno.env.get("REBATE_DATA_KEY_V1");
    if (!url || !service || !secret) return response(503, { error: "Application storage unavailable" });
    const db = createClient(url, service);
    const token = req.headers.get("x-admin-token");
    let admin = false;
    let userId: string | null = null;
    if (token) {
      const { data, error } = await db.from("admin_sessions").select("id").eq("token", token).gt("expires_at", new Date().toISOString()).maybeSingle();
      if (error || !data) return response(401, { error: "Administrator session expired" });
      admin = true;
    } else {
      const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!bearer) return response(401, { error: "Sign in required" });
      const { data, error } = await db.auth.getUser(bearer);
      if (error || !data.user) return response(401, { error: "Sign in required" });
      userId = data.user.id;
    }
    const b = await req.json();
    const audit = async (id: string, action: string) => {
      const { error } = await db.from("rebate_application_audit").insert({ application_id: id, actor_user_id: userId, actor_type: admin ? "admin" : "owner", action });
      if (error) throw error;
    };
    if (b.action === "list") {
      let q = db.from("rebate_applications").select("id,program,status,consent_at,created_at,updated_at").order("created_at", { ascending: false }).limit(100);
      q = admin ? q.not("consent_at", "is", null).neq("status", "draft") : q.eq("user_id", userId);
      const { data, error } = await q;
      if (error) throw error;
      return response(200, { applications: data });
    }
    if (b.action === "save") {
      if (admin) return response(403, { error: "Owner action only" });
      if (!PROGRAMS.includes(b.program)) return response(400, { error: "Choose a program" });
      let details;
      try { details = validateDetails(b.details); } catch { return response(400, { error: "Check the application details" }); }
      const route = solarFormRoute(details);
      if (b.request_review === true && b.program !== "Commercial property improvements" && details.property_type && (!route.program || route.program !== b.program)) return response(400, { error: "Confirm the property type, AC rating and matching solar program before review" });
      if (b.request_review === true && (!reviewComplete(details) || b.consent !== true)) return response(400, { error: "Complete required fields and authorize review" });
      const id = b.id || crypto.randomUUID();
      if (b.id) {
        const { data } = await db.from("rebate_applications").select("id").eq("id", id).eq("user_id", userId).maybeSingle();
        if (!data) return response(404, { error: "Application not found" });
      }
      const row = { user_id: userId, program: b.program, encrypted_payload: await encryptDetails(details, secret, `${id}:${userId}`), status: b.request_review === true ? "review_requested" : "draft", consent_at: b.request_review === true ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
      const { error } = b.id ? await db.from("rebate_applications").update(row).eq("id", id).eq("user_id", userId) : await db.from("rebate_applications").insert({ id, ...row });
      if (error) throw error;
      await audit(id, b.request_review === true ? "review_authorized" : "saved");
      return response(200, { id });
    }
    let q = db.from("rebate_applications").select("*").eq("id", b.id);
    q = admin ? q.not("consent_at", "is", null).neq("status", "draft") : q.eq("user_id", userId);
    const { data: row, error } = await q.maybeSingle();
    if (error || !row) return response(404, { error: "Application not found" });
    if (admin && !canAdminAccess(row)) return response(403, { error: "Review not authorized" });
    if (b.action === "delete" && !admin) {
      await audit(row.id, "deleted");
      const { error } = await db.from("rebate_applications").delete().eq("id", row.id).eq("user_id", userId);
      if (error) throw error;
      return response(200, { deleted: true });
    }
    if (row.key_version !== 1) throw new Error("Unsupported key version");
    const details = await decryptDetails(row.encrypted_payload, secret, `${row.id}:${row.user_id}`);
    if (b.action === "get") {
      await audit(row.id, "viewed");
      return response(200, { application: { id: row.id, program: row.program, status: row.status, details } });
    }
    if (!admin) return response(403, { error: "Administrator action only" });
    if (b.action === "ready") {
      if (!reviewComplete(details)) return response(400, { error: "Missing required applicant details" });
      await audit(row.id, "marked_ready");
      const { error } = await db.from("rebate_applications").update({ status: "ready", updated_at: new Date().toISOString() }).eq("id", row.id).eq("updated_at", row.updated_at).select("id").single();
      if (error) return response(409, { error: "Application changed. Reload before reviewing." });
      return response(200, { ready: true });
    }
    if (b.action === "export") {
      if (!["ready", "exported"].includes(row.status)) return response(400, { error: "Review and mark ready before exporting" });
      await audit(row.id, "exported");
      const { error } = await db.from("rebate_applications").update({ status: "exported", updated_at: new Date().toISOString() }).eq("id", row.id).eq("updated_at", row.updated_at).select("id").single();
      if (error) return response(409, { error: "Application changed. Reload before exporting." });
      const fields = ["application_id", "program", "customer_name", "service_address", "account_number", "email", "phone", "project_description", "usage_source", "monthly_usage_json"];
      const values = [row.id, row.program, details.customer_name, details.service_address, details.account_number, details.email, details.phone, details.project_description, details.source, JSON.stringify(details.months)];
      const projectFields = [...Object.keys(solarTextFields), ...Object.keys(solarNumberFields)] as (keyof typeof solarTextFields | keyof typeof solarNumberFields)[];
      fields.push(...projectFields, "suggested_forms_json", "form_selection_note");
      values.push(...projectFields.map(field => String(details[field] ?? "")));
      const route = solarFormRoute(details);
      values.push(JSON.stringify(route.forms.map(key => solarForms[key])), route.note);
      return new Response(fields.join(",") + "\r\n" + values.map(csvCell).join(","), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="rebate-application.csv"' } });
    }
    return response(400, { error: "Unknown action" });
  } catch { return response(500, { error: "Unable to process application. Please retry." }); }
});