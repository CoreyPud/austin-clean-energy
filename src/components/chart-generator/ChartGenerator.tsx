import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChartPane, type ChartSource } from "./ChartPane";
import { ComposerPane, type HistoryEntry } from "./ComposerPane";

type GenerateResponse = { spec: Record<string, unknown>; source: ChartSource } | { error: string };
type TweakResponse = { spec: Record<string, unknown> } | { error: string };

function adminHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("admin_token");
  return token ? { "x-admin-token": token } : {};
}

export function ChartGenerator() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [source, setSource] = useState<ChartSource | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const mode = spec ? "refine" : "generate";

  async function handleGenerate(prompt: string) {
    setIsGenerating(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("chart-generator", {
        headers: adminHeaders(),
        body: { action: "generate", prompt },
      });
      const result = data as GenerateResponse | null;
      if (fnError || !result || "error" in result) {
        setError((result && "error" in result && result.error) || fnError?.message || "Generation failed. Try again.");
        return;
      }
      setSpec(result.spec);
      setSource(result.source);
      setHistory([{ kind: "prompt", text: prompt }]);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRefine(instruction: string) {
    if (!spec) return;
    setIsRefining(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("chart-generator", {
        headers: adminHeaders(),
        body: { action: "tweak", instruction, currentSpec: spec },
      });
      const result = data as TweakResponse | null;
      if (fnError || !result || "error" in result) {
        setError((result && "error" in result && result.error) || fnError?.message || "Tweak failed. Try again.");
        return;
      }
      setSpec(result.spec);
      setHistory((prev) => [...prev, { kind: "tweak", text: instruction }]);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setIsRefining(false);
    }
  }

  function handleReset() {
    setSpec(null);
    setSource(null);
    setHistory([]);
    setError(null);
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid min-h-0 flex-1 grid-rows-2 lg:grid-cols-[minmax(0,22rem)_1fr] lg:grid-rows-1">
        <div className="min-h-0 border-b border-border lg:border-b-0 lg:border-r">
          <ComposerPane
            mode={mode}
            onGenerate={handleGenerate}
            onRefine={handleRefine}
            onReset={handleReset}
            history={history}
            isGenerating={isGenerating}
            isRefining={isRefining}
            error={error}
          />
        </div>
        <div className="min-h-0">
          <ChartPane spec={spec} source={source} isGenerating={isGenerating} isTweaking={isRefining} />
        </div>
      </div>
    </div>
  );
}
