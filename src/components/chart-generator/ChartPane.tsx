import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportChartPng } from "./chart-export";

import {
  Chart,
  type ChartConfiguration,
  BarController,
  BubbleController,
  CategoryScale,
  DoughnutController,
  LinearScale,
  LogarithmicScale,
  LineController,
  RadialLinearScale,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Legend,
  Title,
  Tooltip,
} from "chart.js";
import { Chart as ReactChart } from "react-chartjs-2";

Chart.register(
  BarController,
  BubbleController,
  CategoryScale,
  DoughnutController,
  LinearScale,
  LogarithmicScale,
  LineController,
  RadialLinearScale,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Legend,
  Title,
  Tooltip,
);

// Fills the canvas with a configurable background color before each draw so
// exported PNGs include the background rather than being transparent.
Chart.register({
  id: "customCanvasBackgroundColor",
  defaults: { color: "#ffffff" },
  beforeDraw(chart: Chart, _args: unknown, opts: { color?: string }) {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = opts.color ?? "#ffffff";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
});

type ChartState = "idle" | "rendering" | "ready" | "error";

type ChartJsConfig = {
  type: string;
  data: Record<string, unknown>;
  options?: Record<string, unknown>;
};

export type ChartSource = { view: string; columns: string[]; rowCount: number };

type Props = {
  spec: Record<string, unknown> | null;
  source: ChartSource | null;
  isGenerating: boolean;
  isTweaking: boolean;
};

class ChartErrorBoundary extends Component<
  { children: ReactNode; onError: (message: string) => void; resetKey: unknown },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : "Chart rendering failed.";
    this.props.onError(message);
  }

  componentDidUpdate(prevProps: { resetKey: unknown }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function ChartJsChart({
  config,
  onReady,
  chartRef,
}: {
  config: ChartJsConfig;
  onReady: () => void;
  chartRef: React.RefObject<Chart<ChartConfiguration["type"]> | null>;
}) {
  const hasCalledReady = useRef(false);

  useEffect(() => {
    hasCalledReady.current = false;
  }, [config]);

  function handleAnimationComplete() {
    if (!hasCalledReady.current) {
      hasCalledReady.current = true;
      onReady();
    }
  }

  const options = {
    ...(config.options ?? {}),
    responsive: true,
    maintainAspectRatio: false,
    animation: { onComplete: handleAnimationComplete },
  };

  return (
    <div className="relative h-full w-full p-4">
      <ReactChart
        ref={chartRef as React.ComponentProps<typeof ReactChart>["ref"]}
        type={config.type as Parameters<typeof ReactChart>[0]["type"]}
        data={config.data as unknown as Parameters<typeof ReactChart>[0]["data"]}
        options={options as Parameters<typeof ReactChart>[0]["options"]}
      />
    </div>
  );
}

export function ChartPane({ spec, source, isGenerating, isTweaking }: Props) {
  const [chartState, setChartState] = useState<ChartState>("idle");
  const [prevSpec, setPrevSpec] = useState<Record<string, unknown> | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const chartRef = useRef<Chart<ChartConfiguration["type"]> | null>(null);

  if (spec !== prevSpec) {
    setPrevSpec(spec);
    setChartState(spec !== null ? "rendering" : "idle");
    setRenderError(null);
  }

  function handleReady() {
    setChartState("ready");
  }

  function handleRenderError(message: string) {
    console.error("[ChartPane] Chart render failed:", message);
    setRenderError(message);
    setChartState("error");
  }

  function handleDownload() {
    if (!spec) return;
    const title =
      (spec as { options?: { plugins?: { title?: { text?: string } } } })?.options?.plugins?.title?.text ?? "chart";
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const filename = `${slug || "chart"}.png`;

    let dataUrl: string;
    try {
      dataUrl = exportChartPng(spec);
    } catch (err) {
      console.error("[ChartPane] exportChartPng failed, falling back to preview canvas:", err);
      if (!chartRef.current) return;
      dataUrl = chartRef.current.toBase64Image("image/png", 1);
    }

    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = filename;
    anchor.click();
  }

  const hasChart = spec !== null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 flex-wrap items-center gap-2 border-b border-border px-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Chart Preview</p>

        {source && (
          <Badge variant="secondary" className="font-mono text-[10px]">
            {source.view} &middot; {source.rowCount} rows
          </Badge>
        )}

        {chartState === "rendering" && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Loader2 size={11} className="animate-spin" /> Rendering&hellip;
          </span>
        )}
        {chartState === "ready" && (
          <Badge className="text-[10px]">Ready</Badge>
        )}

        <div className="ml-auto flex items-center gap-2">
          {chartState === "ready" && (
            <Button size="sm" variant="outline" onClick={handleDownload} disabled={isTweaking || isGenerating}>
              <Download size={13} className="mr-1.5" /> Download PNG
            </Button>
          )}
          {isTweaking && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 size={11} className="animate-spin" /> Applying&hellip;
            </span>
          )}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {hasChart && (
          <div className="absolute inset-0 flex items-stretch p-3">
            <div className="relative flex-1 overflow-hidden rounded-lg border border-border shadow-sm">
              <ChartErrorBoundary onError={handleRenderError} resetKey={spec}>
                <ChartJsChart config={spec as unknown as ChartJsConfig} onReady={handleReady} chartRef={chartRef} />
              </ChartErrorBoundary>
              {renderError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background p-8 text-center">
                  <p className="text-sm font-medium">This chart could not be drawn.</p>
                  <p className="max-w-md text-xs text-muted-foreground">Try generating it again or simplifying the request.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!hasChart && !isGenerating && (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted">
              <BarChart3 size={28} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No chart yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Describe a chart on the left, then click Generate Chart.
              </p>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Querying data and generating chart&hellip;</p>
          </div>
        )}

        {isTweaking && hasChart && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
            <Loader2 size={22} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Applying changes&hellip;</p>
          </div>
        )}
      </div>
    </div>
  );
}
