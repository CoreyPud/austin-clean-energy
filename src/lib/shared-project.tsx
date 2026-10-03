import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// Project details shared by the Solar Suite tools (SolarBOM Pro, SolarPlanStudio Pro, SolarFlow PM).
// When opened from a saved property, savedId links back to saved_assessments and the
// tools re-read that row on load and whenever the tab regains focus, so later edits show up.
export type FinanceMode = "cash" | "finance";

export type SharedProject = {
  projectName: string;
  address: string;
  systemSizeKw: number;
  costPerW: number | null;
  financeMode: FinanceMode;
  loanTermYears: number | null;
  loanRate: number | null;
  billingMode: string | null;
  savedId: string | null;
  savedUpdatedAt: string | null;
};

const STORAGE_KEY = "ace-shared-project-v2";

export const defaultSharedProject: SharedProject = {
  projectName: "Austin Commercial Rooftop",
  address: "Austin, Texas",
  systemSizeKw: 250,
  costPerW: null,
  financeMode: "cash",
  loanTermYears: null,
  loanRate: null,
  billingMode: null,
  savedId: null,
  savedUpdatedAt: null,
};

type SharedProjectContextValue = {
  project: SharedProject;
  updateProject: (updates: Partial<SharedProject>) => void;
};

const SharedProjectContext = createContext<SharedProjectContextValue | null>(null);

function parseProject(raw: string | null): SharedProject | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<SharedProject>;
    if (typeof v.projectName !== "string" || typeof v.address !== "string" || typeof v.systemSizeKw !== "number") return null;
    return { ...defaultSharedProject, ...v, systemSizeKw: Math.max(0, v.systemSizeKw) };
  } catch {
    return null;
  }
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

type SavedRow = { id: string; address: string; label: string | null; calculator_state: unknown; results: unknown; updated_at: string };

/** Map a saved assessment row onto the shared project fields. */
export function projectFromSaved(row: SavedRow): Partial<SharedProject> {
  const s = (row.calculator_state ?? {}) as Record<string, unknown>;
  const si = ((row.results ?? {}) as { solarInsights?: { maxPanels?: number; panelCapacityWatts?: number } }).solarInsights;
  const maxFitKw = si?.maxPanels && si?.panelCapacityWatts ? Math.round((si.maxPanels * si.panelCapacityWatts) / 100) / 10 : null;
  const kw = num(s.systemKw) ?? (s.maxFit ? maxFitKw : null);
  return {
    savedId: row.id,
    savedUpdatedAt: row.updated_at,
    projectName: row.label || row.address.split(",")[0],
    address: row.address,
    ...(kw != null ? { systemSizeKw: kw } : {}),
    costPerW: num(s.costPerW),
    financeMode: s.financeMode === "finance" ? "finance" : "cash",
    loanTermYears: num(s.loanTermYears),
    loanRate: num(s.loanRate),
    billingMode: typeof s.billingMode === "string" ? s.billingMode : null,
  };
}

/** Encode project fields for a URL so a freshly opened tab can fill in without storage access. */
export function encodeProjectParam(p: Partial<SharedProject>): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(p))));
}

function decodeProjectParam(raw: string | null): Partial<SharedProject> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(escape(atob(raw)))) as Partial<SharedProject>;
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

export function SharedProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<SharedProject>(() => parseProject(window.localStorage.getItem(STORAGE_KEY)) ?? defaultSharedProject);

  // ?saved=<id> in the URL links the tools to that saved property.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("saved");
    // ?p=<encoded details> carries the property's values directly, so the tools fill in
    // even when this tab can't see the opener's storage or sign-in (e.g. preview iframes).
    const packed = decodeProjectParam(params.get("p"));
    if (packed) params.delete("p");
    if (id || packed) {
      setProject((cur) => ({
        ...cur,
        ...(packed ?? {}),
        ...(id ? { savedId: id } : {}),
        savedUpdatedAt: packed?.savedUpdatedAt ?? (id && cur.savedId === id ? cur.savedUpdatedAt : null),
      }));
      params.delete("saved");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
    }
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = parseProject(event.newValue);
      if (next) setProject(next);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  const savedId = project.savedId;
  const savedUpdatedAt = project.savedUpdatedAt;

  // Pull the latest values from the saved property; only overwrite when it changed since last sync.
  useEffect(() => {
    if (!savedId) return;
    let cancelled = false;
    const refresh = async () => {
      const { data, error } = await supabase
        .from("saved_assessments")
        .select("id, address, label, calculator_state, results, updated_at")
        .eq("id", savedId)
        .maybeSingle();
      if (cancelled || error || !data) return;
      if (data.updated_at === savedUpdatedAt) return;
      setProject((cur) => ({ ...cur, ...projectFromSaved(data as SavedRow) }));
    };
    refresh();
    const onFocus = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") refresh(); });
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      sub.subscription.unsubscribe();
    };
  }, [savedId, savedUpdatedAt]);

  const updateProject = useCallback((updates: Partial<SharedProject>) => {
    setProject((current) => ({ ...current, ...updates }));
  }, []);

  const value = useMemo(() => ({ project, updateProject }), [project, updateProject]);
  return <SharedProjectContext.Provider value={value}>{children}</SharedProjectContext.Provider>;
}

export function useSharedProject() {
  const value = useContext(SharedProjectContext);
  if (!value) throw new Error("useSharedProject must be used within SharedProjectProvider");
  return value;
}
