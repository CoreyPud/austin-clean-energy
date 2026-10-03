import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bookmark, Link as LinkIcon, Trash2, Loader2, LogOut, Save } from "lucide-react";
import { toast } from "sonner";

export type AssessmentSnapshot = {
  address: string;
  property_type: string;
  calculator_state: Record<string, unknown>;
  results: unknown;
};

export type SavedRow = AssessmentSnapshot & {
  id: string;
  share_token: string;
  label: string | null;
  updated_at: string;
};

interface Props {
  getSnapshot: () => AssessmentSnapshot | null;
  onOpenSaved: (row: AssessmentSnapshot) => void;
}

export const shareUrlFor = (token: string) =>
  `${window.location.origin}/property-assessment?share=${token}`;

const PENDING_KEY = "ace_pending_save";

const SavedPropertiesDrawer = ({ getSnapshot, onOpenSaved }: Props) => {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  const loadRows = useCallback(async () => {
    if (!userId) return setRows([]);
    setLoadingList(true);
    const { data, error } = await supabase
      .from("saved_assessments")
      .select("id, share_token, label, address, property_type, calculator_state, results, updated_at")
      .order("updated_at", { ascending: false });
    setLoadingList(false);
    if (error) return toast.error("Couldn't load saved properties");
    setRows((data ?? []) as SavedRow[]);
  }, [userId]);

  useEffect(() => { loadRows(); }, [loadRows]);

  const save = useCallback(async (snap: AssessmentSnapshot) => {
    if (!userId) return;
    setBusy(true);
    const existing = rows.find((r) => r.address.toLowerCase() === snap.address.toLowerCase());
    const payload = { ...snap, calculator_state: snap.calculator_state as any, results: snap.results as any };
    const { error } = existing
      ? await supabase.from("saved_assessments").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", existing.id)
      : await supabase.from("saved_assessments").insert({ ...payload, user_id: userId });
    setBusy(false);
    if (error) return toast.error("Couldn't save", { description: error.message });
    toast.success(existing ? "Saved property updated" : "Property saved");
    loadRows();
  }, [userId, rows, loadRows]);

  // Finish a save that was started before signing in (Google redirect loses page state).
  useEffect(() => {
    if (!userId) return;
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_KEY);
    try { save(JSON.parse(pending)); setOpen(true); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const signIn = async () => {
    const snap = getSnapshot();
    if (snap) {
      try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(snap)); } catch { /* too large */ }
    }
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.href });
    if (result.error) toast.error("Sign-in failed", { description: String((result.error as any).message ?? result.error) });
  };

  const handleSaveCurrent = () => {
    const snap = getSnapshot();
    if (!snap) return toast("Run an assessment first, then save it.");
    save(snap);
  };

  // The standalone "Save property" button next to the drawer trigger:
  // signed in -> saves in one click; not signed in -> starts Google sign-in and
  // the assessment is saved automatically right after the redirect back.
  const handleSaveDirect = () => {
    if (!session) {
      if (!getSnapshot()) {
        setOpen(true);
        return toast("Run an assessment first, then save it.");
      }
      return signIn();
    }
    if (!getSnapshot()) {
      setOpen(true);
      return toast("Run an assessment first, then save it.");
    }
    handleSaveCurrent();
  };

  const copyLink = async (token: string) => {
    const url = shareUrlFor(token);
    try { await navigator.clipboard.writeText(url); toast.success("Share link copied", { description: "Anyone with the link can view it — no login needed." }); }
    catch { window.prompt("Copy this link:", url); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this saved property?")) return;
    const { error } = await supabase.from("saved_assessments").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete");
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const canSave = !!getSnapshot();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={handleSaveDirect} disabled={busy && canSave} className="gap-2">
        {busy && canSave ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {session ? "Save property" : "Save property (sign in)"}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Bookmark className="h-4 w-4" />
            My saved properties
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Saved properties</SheetTitle>
            <SheetDescription>
              Save an assessment with all your settings and share a view-only link with anyone.
            </SheetDescription>
          </SheetHeader>

          {!session ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign in to save properties{canSave ? " — the current assessment will be saved right after." : "."}
              </p>
              <Button onClick={signIn} className="w-full">Continue with Google</Button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="truncate">{session.user.email}</span>
                <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="gap-1">
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </Button>
              </div>
              <Button onClick={handleSaveCurrent} disabled={busy || !canSave} className="w-full gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {canSave ? "Save current assessment" : "Run an assessment to save it"}
              </Button>

              <BatchCsvUpload userId={session.user.id} onFinished={loadRows} />


              <div className="space-y-3">
                {loadingList && <p className="text-sm text-muted-foreground">Loading…</p>}
                {!loadingList && rows.length === 0 && (
                  <p className="text-sm text-muted-foreground">No saved properties yet.</p>
                )}
                {rows.map((r) => {
                  const st = r.calculator_state as { systemKw?: number };
                  return (
                    <div key={r.id} className="rounded-lg border border-border p-3 space-y-2">
                      <button
                        className="text-left w-full"
                        onClick={() => { onOpenSaved(r); setOpen(false); }}
                      >
                        <div className="font-medium text-foreground hover:underline">{r.address}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.property_type}
                          {st?.systemKw ? ` · ${st.systemKw} kW` : ""} · saved {new Date(r.updated_at).toLocaleDateString()}
                        </div>
                      </button>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyLink(r.share_token)} className="gap-1">
                          <LinkIcon className="h-3.5 w-3.5" /> Copy share link
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(r.id)} aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SavedPropertiesDrawer;
