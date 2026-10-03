import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SharedProject = {
  projectName: string;
  address: string;
  systemSizeKw: number;
};

const STORAGE_KEY = "ace-shared-project-v1";

export const defaultSharedProject: SharedProject = {
  projectName: "Austin Commercial Rooftop",
  address: "Austin, Texas",
  systemSizeKw: 250,
};

type SharedProjectContextValue = {
  project: SharedProject;
  updateProject: (updates: Partial<SharedProject>) => void;
};

const SharedProjectContext = createContext<SharedProjectContextValue | null>(null);

function parseProject(raw: string | null): SharedProject | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SharedProject>;
    if (typeof value.projectName !== "string" || typeof value.address !== "string" || typeof value.systemSizeKw !== "number") return null;
    return { projectName: value.projectName, address: value.address, systemSizeKw: Math.max(0, value.systemSizeKw) };
  } catch {
    return null;
  }
}

export function SharedProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState(defaultSharedProject);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = parseProject(window.localStorage.getItem(STORAGE_KEY));
    if (stored) setProject(stored);
    setHydrated(true);
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = parseProject(event.newValue);
      if (next) setProject(next);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [hydrated, project]);

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