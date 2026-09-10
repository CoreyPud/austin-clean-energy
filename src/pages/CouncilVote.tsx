import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CouncilNav from "@/components/CouncilNav";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// council_decisions/agenda_item_vote_tallies aren't in the generated types until the
// migration lands and Lovable regenerates types.ts -- cast, same as CouncilDecisions.tsx.
type VoteChoice = "support" | "oppose";

interface ItemMeta {
  id: string;
  meeting_date: string;
  item_number: string;
  title: string | null;
  description: string | null;
  lead_dept: string | null;
  sub_depts: string[] | null;
  sponsor: string | null;
  co_sponsor: string | null;
  source_url: string | null;
  status: "open" | "decided";
  topic: string | null;
  significance: string | null;
  tags: string[] | null;
  decided_in_closed_session: boolean | null;
  visible: boolean;
  outcome?: string | null; // only ever fetched up front in admin mode
  imported_at?: string | null; // only ever fetched in admin mode
}
interface Reveal {
  support_count: number;
  oppose_count: number;
  outcome: string | null;
}

const STORAGE_PREFIX = "council-vote:";
function readStoredVote(id: string): VoteChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    return raw ? (JSON.parse(raw).choice as VoteChoice) : null;
  } catch {
    return null;
  }
}
function writeStoredVote(id: string, choice: VoteChoice) {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify({ choice }));
  } catch {
    /* localStorage unavailable (private browsing etc.) -- vote still recorded server-side */
  }
}

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const monthLabel = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long" });

// Source data (CIUR) stores names "Last, First" -- e.g. "Siegel, Mike" -- and co_sponsor packs
// multiple people into one flat comma list ("Alter, Ryan, Velasquez, Jose"), so every consecutive
// pair of tokens is one person. Reformat to "First Last" for display without touching stored data.
function formatNames(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const tokens = raw.split(",").map((t) => t.trim()).filter(Boolean);
  const names: string[] = [];
  for (let i = 0; i + 1 < tokens.length; i += 2) names.push(`${tokens[i + 1]} ${tokens[i]}`);
  if (tokens.length % 2 === 1) names.push(tokens[tokens.length - 1]!); // malformed leftover, keep rather than drop
  return names.join(", ");
}

const ITEM_COLUMNS = "id, meeting_date, item_number, title, description, lead_dept, sub_depts, sponsor, co_sponsor, source_url, status, topic, significance, tags, decided_in_closed_session, visible";

// Same page backs both /council-vote (public) and /admin/agenda-items (admin=true), rather than
// maintaining two near-identical card layouts. Admin mode: session-gated, sees every item
// (including hidden ones) with tally/outcome unconditionally revealed, and can toggle visibility
// or edit title/description. Public mode: the blind-then-reveal voting flow, unchanged.
export default function CouncilVote({ admin = false }: { admin?: boolean }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemMeta[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reveals, setReveals] = useState<Record<string, Reveal>>({});
  const [votedIds, setVotedIds] = useState<Record<string, VoteChoice>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lookbackDays, setLookbackDays] = useState("183");
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    if (!admin) {
      loadPublic();
      return;
    }
    const token = sessionStorage.getItem("admin_token");
    const expires = sessionStorage.getItem("admin_token_expires");
    if (!token || !expires || new Date(expires) < new Date()) {
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_token_expires");
      navigate("/admin");
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke("admin-auth", { body: { action: "validate", token } });
      if (error || !data?.valid) {
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_token_expires");
        navigate("/admin");
        return;
      }
      loadAdmin();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  async function loadPublic() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("council_decisions")
      .select(ITEM_COLUMNS)
      .eq("visible", true)
      .order("meeting_date", { ascending: false });
    if (error) {
      setErr(error.message);
      return;
    }
    const rows = (data ?? []) as ItemMeta[];
    setItems(rows);

    const stored: Record<string, VoteChoice> = {};
    for (const it of rows) {
      const choice = readStoredVote(it.id);
      if (choice) stored[it.id] = choice;
    }
    setVotedIds(stored);

    const ids = Object.keys(stored);
    if (ids.length === 0) return;
    const [{ data: decided }, { data: tallies }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("council_decisions").select("id, outcome").in("id", ids),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("agenda_item_vote_tallies").select("agenda_item_id, support_count, oppose_count").in("agenda_item_id", ids),
    ]);
    setReveals(mergeReveals(ids, decided, tallies));
  }

  async function loadAdmin() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("council_decisions")
      .select(`${ITEM_COLUMNS}, outcome, imported_at`)
      .order("meeting_date", { ascending: false });
    if (error) {
      setErr(error.message);
      return;
    }
    const rows = (data ?? []) as ItemMeta[];
    setItems(rows);

    const ids = rows.map((r) => r.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tallies } = await (supabase as any)
      .from("agenda_item_vote_tallies")
      .select("agenda_item_id, support_count, oppose_count")
      .in("agenda_item_id", ids.length ? ids : ["__none__"]);
    setReveals(mergeReveals(ids, rows, tallies));

    const { data: syncStat } = await supabase
      .from("cached_stats")
      .select("updated_at")
      .eq("stat_type", "agenda_sync_last_run")
      .maybeSingle();
    setLastSync(syncStat?.updated_at ?? null);
  }

  function mergeReveals(
    ids: string[],
    outcomeRows: { id: string; outcome?: string | null }[] | null,
    tallyRows: { agenda_item_id: string; support_count: number; oppose_count: number }[] | null,
  ): Record<string, Reveal> {
    const next: Record<string, Reveal> = {};
    for (const id of ids) {
      const outcomeRow = (outcomeRows ?? []).find((d) => d.id === id);
      const tallyRow = (tallyRows ?? []).find((t) => t.agenda_item_id === id);
      next[id] = {
        outcome: outcomeRow?.outcome ?? null,
        support_count: tallyRow?.support_count ?? 0,
        oppose_count: tallyRow?.oppose_count ?? 0,
      };
    }
    return next;
  }

  async function castVote(id: string, choice: VoteChoice) {
    setPending(id);
    try {
      const { data, error } = await supabase.functions.invoke("vote-agenda-item", {
        body: { agenda_item_id: id, choice },
      });
      if (error) throw error;
      const recorded: VoteChoice = data?.choice ?? choice;
      writeStoredVote(id, recorded);
      setVotedIds((prev) => ({ ...prev, [id]: recorded }));
      setReveals((prev) => ({
        ...prev,
        [id]: {
          support_count: data?.support_count ?? 0,
          oppose_count: data?.oppose_count ?? 0,
          outcome: data?.outcome ?? null,
        },
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  }

  async function saveAdminField(id: string, patch: { title?: string; visible?: boolean }) {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    try {
      const { error } = await supabase.functions.invoke("manage-agenda-items", {
        body: { action: "update", id, ...patch },
        headers: { "x-admin-token": token },
      });
      if (error) throw error;
      setItems((prev) => (prev ?? []).map((it) => (it.id === id ? { ...it, ...patch } : it)));
      toast.success("Saved");
    } catch (e) {
      console.error("Error saving agenda item:", e);
      toast.error("Failed to save");
    }
  }

  async function deleteAdminItem(id: string) {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    if (!confirm("Delete this item? This also deletes any votes already cast on it. Cannot be undone.")) return;
    try {
      const { error } = await supabase.functions.invoke("manage-agenda-items", {
        body: { action: "delete", id },
        headers: { "x-admin-token": token },
      });
      if (error) throw error;
      setItems((prev) => (prev ?? []).filter((it) => it.id !== id));
      toast.success("Deleted");
    } catch (e) {
      console.error("Error deleting agenda item:", e);
      toast.error("Failed to delete");
    }
  }

  async function runSync() {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-agenda-items", {
        body: { lookback_days: Number(lookbackDays) || 183 },
        headers: { "x-admin-token": token },
      });
      if (error) throw error;
      const h = data?.history;
      const u = data?.upcoming;
      const parts = [];
      if (h) parts.push(`history: ${h.classified_climate ?? 0} synced (${h.visible ?? 0} visible / ${h.hidden ?? 0} hidden)`);
      if (u?.found) parts.push(`upcoming: ${u.items_found ?? 0} found for ${u.meeting_date}`);
      else if (u) parts.push("upcoming: no meeting with a posted Draft Agenda found");
      toast.success(parts.join(" · ") || "Sync complete");
      loadAdmin();
    } catch (e) {
      console.error("Error running sync:", e);
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const open = (items ?? []).filter((i) => i.status === "open").sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));
  const decided = (items ?? []).filter((i) => i.status === "decided").sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-14">
        {!admin && <CouncilNav />}
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Austin City Council</p>
          {admin ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight">Agenda Item Editor</h1>
              <p className="text-muted-foreground max-w-2xl">
                Every item, including ones hidden from the public page. Toggle visibility or edit
                the title directly.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <label className="text-xs text-muted-foreground" htmlFor="lookback-days">
                  Lookback (days)
                </label>
                <input
                  id="lookback-days"
                  type="number"
                  min={1}
                  value={lookbackDays}
                  onChange={(e) => setLookbackDays(e.target.value)}
                  className="w-20 rounded border border-input bg-background px-1.5 py-0.5 text-xs"
                />
                <Button size="sm" onClick={runSync} disabled={syncing}>
                  {syncing ? "Importing…" : "Import agenda items"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {lastSync ? `Last synced ${new Date(lastSync).toLocaleString()}` : "Never synced"}
                </span>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">Vote on climate &amp; energy items</h1>
              <p className="text-muted-foreground max-w-2xl">
                Support or oppose each item yourself. The community tally, and for decided items what
                council actually did, only shows after you vote, so it can't sway your answer first.
              </p>
            </>
          )}
        </header>

        {err && <p className="text-sm text-destructive">{err}</p>}
        {!items && !err && <p className="text-sm text-muted-foreground">Loading…</p>}

        {items && (
          <>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Open for voting</h2>
              {open.length === 0 && <p className="text-sm text-muted-foreground">No upcoming items posted yet.</p>}
              {open.length > 0 && (
                <div className="space-y-4">
                  {open.map((it, idx) => {
                    const heading = idx === 0 || monthLabel(it.meeting_date) !== monthLabel(open[idx - 1].meeting_date)
                      ? monthLabel(it.meeting_date) : null;
                    return (
                      <div key={it.id} className={heading ? "space-y-2" : ""}>
                        {heading && <h3 className="text-sm font-semibold text-foreground/80 pt-2">{heading}</h3>}
                        <VoteCard
                          item={it}
                          voted={votedIds[it.id] ?? null}
                          reveal={reveals[it.id] ?? null}
                          pending={pending === it.id}
                          onVote={(c) => castVote(it.id, c)}
                          admin={admin}
                          onToggleVisible={(v) => saveAdminField(it.id, { visible: v })}
                          onSaveEdit={(patch) => saveAdminField(it.id, patch)}
                          onDelete={() => deleteAdminItem(it.id)}
                          lastSync={lastSync}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">History</h2>
              {decided.length === 0 && <p className="text-sm text-muted-foreground">No history synced yet.</p>}
              {decided.length > 0 && (
                <div className="space-y-4">
                  {decided.map((it, idx) => {
                    const heading = idx === 0 || monthLabel(it.meeting_date) !== monthLabel(decided[idx - 1].meeting_date)
                      ? monthLabel(it.meeting_date) : null;
                    return (
                      <div key={it.id} className={heading ? "space-y-2" : ""}>
                        {heading && <h3 className="text-sm font-semibold text-foreground/80 pt-2">{heading}</h3>}
                        <VoteCard
                          item={it}
                          voted={votedIds[it.id] ?? null}
                          reveal={reveals[it.id] ?? null}
                          pending={pending === it.id}
                          onVote={(c) => castVote(it.id, c)}
                          admin={admin}
                          onToggleVisible={(v) => saveAdminField(it.id, { visible: v })}
                          onSaveEdit={(patch) => saveAdminField(it.id, patch)}
                          onDelete={() => deleteAdminItem(it.id)}
                          lastSync={lastSync}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function VoteCard({
  item, voted, reveal, pending, onVote, admin, onToggleVisible, onSaveEdit, onDelete, lastSync,
}: {
  item: ItemMeta;
  voted: VoteChoice | null;
  reveal: Reveal | null;
  pending: boolean;
  onVote: (choice: VoteChoice) => void;
  admin?: boolean;
  onToggleVisible?: (visible: boolean) => void;
  onSaveEdit?: (patch: { title?: string }) => void;
  onDelete?: () => void;
  lastSync?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(item.title ?? "");
  const revealed = admin || !!voted;
  // "New" = this exact id was first inserted by the most recent sync run, not just re-touched --
  // upsert never overwrites imported_at on an existing row, so a match here means brand new,
  // never reviewed by an admin yet. Frontend-only: no schema/edge changes needed.
  const isNew = admin && !!item.imported_at && !!lastSync
    && Math.abs(new Date(item.imported_at).getTime() - new Date(lastSync).getTime()) < 5 * 60 * 1000;

  return (
    <div
      className={`p-4 space-y-2 rounded-lg border ${item.status === "open" ? "border-primary/30 bg-primary/[0.03]" : "border-border bg-card"} ${admin && !item.visible ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs text-muted-foreground">
          {item.status === "open" ? <span className="font-medium text-primary">Upcoming</span> : null}
          {item.status === "open" ? " · " : ""}
          {fmtDate(item.meeting_date)}
        </p>
        {editing ? (
          <div className="space-y-2">
            <Textarea value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} rows={2} placeholder="Title" />
            {item.description && item.description !== item.title && (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onSaveEdit?.({ title: titleDraft });
                  setEditing(false);
                }}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTitleDraft(item.title ?? "");
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-foreground">
            {isNew && item.status === "open" && (
              <span className="mr-1.5 inline-block rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary align-middle">
                New
              </span>
            )}
            {item.title || `Item ${item.item_number}`}
          </p>
        )}
        <details className="text-xs">
          <summary className="cursor-pointer text-primary">More details</summary>
          <div className="mt-1.5 space-y-1 text-muted-foreground">
            {item.description && item.description !== item.title && <p>{item.description}</p>}
            <p>
              item {item.item_number}
              {item.lead_dept ? ` · ${item.lead_dept}` : ""}
            </p>
            {(item.sponsor || item.co_sponsor) && (
              <p>
                {item.sponsor ? `Sponsor: ${formatNames(item.sponsor)}` : ""}
                {item.sponsor && item.co_sponsor ? " · " : ""}
                {item.co_sponsor ? `Co-sponsor: ${formatNames(item.co_sponsor)}` : ""}
              </p>
            )}
            {item.topic && <p>Topic: {item.topic}</p>}
            {item.significance && <p>Significance: {item.significance}</p>}
            {item.tags?.length ? <p>Tags: {item.tags.join(", ")}</p> : null}
            {item.sub_depts?.length ? <p>Sub-departments: {item.sub_depts.join(", ")}</p> : null}
            {item.decided_in_closed_session && <p>Decided in executive session</p>}
            {item.source_url && (
              <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 inline-block">
                View source ↗
              </a>
            )}
          </div>
        </details>
      </div>

      {revealed ? (
        <div className="space-y-1.5">
          <p className="text-xs">
            {voted && (
              <span className={voted === "support" ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                You voted {voted}
              </span>
            )}
            {item.status === "decided" && reveal?.outcome ? (
              <span className="text-muted-foreground">
                {voted ? " · " : ""}council: <span className="text-foreground">{reveal.outcome.replace(/_/g, " ")}</span>
              </span>
            ) : null}
          </p>
          {reveal ? <VoteBar support={reveal.support_count} oppose={reveal.oppose_count} /> : (
            <p className="text-xs text-muted-foreground">loading tally…</p>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => onVote("support")}
            className="rounded-md border border-emerald-600/40 text-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500/10 disabled:opacity-50"
          >
            Support
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onVote("oppose")}
            className="rounded-md border border-rose-600/40 text-rose-600 px-3 py-1.5 text-xs font-medium hover:bg-rose-500/10 disabled:opacity-50"
          >
            Oppose
          </button>
        </div>
      )}

      {admin && (
        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{item.visible ? "Shown on public page" : "Hidden from public page"}</span>
            <Switch checked={item.visible} onCheckedChange={(v) => onToggleVisible?.(v)} />
            {item.imported_at && (
              <span className="text-xs text-muted-foreground">
                · Imported {new Date(item.imported_at).toLocaleString()}
              </span>
            )}
          </div>
          {!editing && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" className="text-rose-600 hover:text-rose-600" onClick={onDelete}>
                Delete
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VoteBar({ support, oppose }: { support: number; oppose: number }) {
  const total = support + oppose;
  const supportPct = total > 0 ? Math.round((support / total) * 100) : 0;
  const opposePct = total > 0 ? 100 - supportPct : 0;
  return (
    <div className="space-y-1.5">
      <div className="text-sm">
        {total > 0 ? (
          <>
            <span className="font-semibold text-emerald-600">{supportPct}% Support</span>
            <span className="text-muted-foreground"> ({support.toLocaleString()}/{total.toLocaleString()})</span>
          </>
        ) : (
          <span className="text-muted-foreground">No votes yet</span>
        )}
      </div>
      {total > 0 ? (
        <div className="h-2 w-full rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500" style={{ width: `${supportPct}%` }} />
          <div className="h-full bg-rose-500" style={{ width: `${opposePct}%` }} />
        </div>
      ) : (
        // No votes yet -- a bar half-filled with one color here would misleadingly look like a
        // real result, so show a plain neutral track instead.
        <div className="h-2 w-full rounded-full bg-muted" />
      )}
    </div>
  );
}
