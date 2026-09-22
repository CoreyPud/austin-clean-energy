import { useRef, useState } from "react";
import { BarChart2, Loader2, RotateCcw, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Prompts scoped to what the eight stats_* views actually cover -- see
// supabase/functions/chart-generator/index.ts VIEW_CATALOG.
const EXAMPLE_PROMPTS = [
  "Bar chart of Austin solar installations by year since 2014",
  "Line chart of Austin Energy's generation mix by fuel type over the last two years",
  "Bar chart of EV charging stations opened per year in Austin, with cumulative total",
  "Bar chart of solar installations by council district",
  "Line chart of the average permit processing time by year",
  "Pie chart of climate-related council votes by year that passed unanimously vs contested",
];

const REFINE_SUGGESTIONS = [
  "Make it a line chart",
  "Use a dark background",
  "Sort descending by value",
  "Make the title bigger",
];

export type HistoryEntry = { kind: "prompt" | "tweak"; text: string };

type Props = {
  mode: "generate" | "refine";
  onGenerate: (prompt: string) => void;
  onRefine: (instruction: string) => void;
  onReset: () => void;
  history: HistoryEntry[];
  isGenerating: boolean;
  isRefining: boolean;
  error: string | null;
};

function ExamplesMenu({ mode, onSelect }: { mode: "generate" | "refine"; onSelect: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const items = mode === "generate" ? EXAMPLE_PROMPTS : REFINE_SUGGESTIONS;
  const label = mode === "generate" ? "Examples" : "Suggestions";

  return (
    <div className="relative">
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
        {label}
      </Button>
      {open && (
        <ul className="absolute left-0 top-full z-20 mt-1.5 w-[min(28rem,85vw)] rounded-lg border border-border bg-popover p-1 shadow-lg">
          {items.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                className="w-full rounded-md px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddChangeBlock({
  onSubmit,
  onCancel,
  isRefining,
}: {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isRefining: boolean;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = text.trim().length > 0 && !isRefining;

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isRefining) return;
    onSubmit(trimmed);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
      <Textarea
        ref={textareaRef}
        autoFocus
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape") onCancel();
        }}
        disabled={isRefining}
        placeholder="e.g. Use a log scale on the Y axis..."
        className="resize-none border-none bg-transparent p-0 text-sm focus-visible:ring-0"
      />
      <div className="flex items-center gap-1">
        <ExamplesMenu mode="refine" onSelect={(s) => { setText(s); textareaRef.current?.focus(); }} />
        <Button type="button" variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={onCancel} disabled={isRefining}>
          <X size={13} />
        </Button>
        <Button type="button" size="sm" disabled={!canSubmit} onClick={handleSubmit}>
          {isRefining ? <><Loader2 size={13} className="mr-1.5 animate-spin" /> Applying&hellip;</> : "Apply Change"}
        </Button>
      </div>
    </div>
  );
}

export function ComposerPane({ mode, onGenerate, onRefine, onReset, history, isGenerating, isRefining, error }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [addingChange, setAddingChange] = useState(false);
  const isBusy = isGenerating || isRefining;

  function handleGenerateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    onGenerate(trimmed);
  }

  function fillExample(example: string) {
    setText(example);
    textareaRef.current?.focus();
  }

  function handleRefineSubmit(instruction: string) {
    onRefine(instruction);
    setAddingChange(false);
  }

  const canGenerate = text.trim().length > 0 && !isBusy;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4">
        <BarChart2 size={14} className="text-primary" />
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {mode === "generate" ? "Compose" : "Refine"}
        </p>
        {mode === "refine" && (
          <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onReset}>
            <RotateCcw size={11} className="mr-1" /> New chart
          </Button>
        )}
      </div>

      {mode === "generate" && (
        <form onSubmit={handleGenerateSubmit} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="composer-text" className="text-xs font-medium text-muted-foreground">
              Describe the chart you want, in terms of Austin's solar, generation, EV, or council-vote data
            </label>
            <Textarea
              ref={textareaRef}
              id="composer-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerateSubmit(e as unknown as React.FormEvent);
              }}
              placeholder="e.g. Bar chart of Austin solar installations by year since 2014"
              rows={5}
              disabled={isBusy}
              className="resize-none text-sm"
            />
          </div>

          <div className="flex items-center gap-1">
            <ExamplesMenu mode="generate" onSelect={fillExample} />
            <Button type="submit" size="sm" disabled={!canGenerate} className="ml-auto">
              {isGenerating ? <><Loader2 size={13} className="mr-1.5 animate-spin" /> Generating&hellip;</> : <><BarChart2 size={13} className="mr-1.5" /> Generate Chart</>}
            </Button>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </form>
      )}

      {mode === "refine" && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-2 p-4 pb-2">
            {history.map((entry, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-3">
                <span
                  className={[
                    "mt-px shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                    entry.kind === "prompt" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {entry.kind === "prompt" ? "prompt" : "tweak"}
                </span>
                <p className="text-xs leading-relaxed text-muted-foreground">{entry.text}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="px-4 pb-2">
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive" role="alert">
                {error}
              </p>
            </div>
          )}

          <div className="mt-auto p-4 pt-2">
            {addingChange ? (
              <AddChangeBlock onSubmit={handleRefineSubmit} onCancel={() => setAddingChange(false)} isRefining={isRefining} />
            ) : (
              <button
                type="button"
                onClick={() => setAddingChange(true)}
                disabled={isRefining}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                <Plus size={13} /> Add a change&hellip;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
