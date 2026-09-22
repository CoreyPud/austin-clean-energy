/**
 * Client-side off-screen Chart.js export at a fixed high resolution.
 *
 * Ported near-verbatim from switchdev00/s_austin_app's lib/chartExport.ts --
 * framework-agnostic, browser-only, depends only on chart.js. Renders a fresh
 * Chart.js instance onto a detached 1200x675 canvas with devicePixelRatio=2,
 * producing a 2400x1350 PNG. Enforces minimum font sizes so text stays
 * readable at that scale.
 *
 * Must only be imported in client code (never at module scope during SSR --
 * this app is a Vite SPA, so that's a non-issue here, but the guard stays).
 */
import {
  Chart,
  type ChartConfiguration,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Legend,
  Title,
  Tooltip,
} from "chart.js";

// Idempotent -- Chart.js deduplicates registrations by ID.
Chart.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Legend,
  Title,
  Tooltip,
);

const EXPORT_W = 1200;
const EXPORT_H = 675;
const EXPORT_DPR = 2;

const MIN_TITLE_SIZE = 26;
const MIN_TICK_SIZE = 14;
const MIN_LEGEND_SIZE = 14;
const MIN_AXIS_TITLE_SIZE = 15;
const MIN_LAYOUT_PADDING = 24;

type DeepRecord = Record<string, unknown>;

/** Merge b into a without overwriting existing truthy values. */
function mergeDefaults(a: DeepRecord, b: DeepRecord): DeepRecord {
  for (const [k, v] of Object.entries(b)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      if (typeof a[k] !== "object" || a[k] === null) a[k] = {};
      mergeDefaults(a[k] as DeepRecord, v as DeepRecord);
    } else if (a[k] === undefined || a[k] === null) {
      a[k] = v;
    }
  }
  return a;
}

/** Enforce a numeric floor: only increases the value, never decreases. */
function applyFloor(obj: DeepRecord, key: string, floor: number): void {
  const cur = obj[key];
  if (typeof cur !== "number" || cur < floor) {
    obj[key] = floor;
  }
}

/**
 * Deep-clone and overlay font floors onto options so small specs are still
 * legible at 2400x1350.
 */
function applyFontFloors(options: DeepRecord): DeepRecord {
  const opts = JSON.parse(JSON.stringify(options)) as DeepRecord;

  if (typeof opts.layout !== "object" || opts.layout === null) opts.layout = {};
  const layout = opts.layout as DeepRecord;
  if (typeof layout.padding !== "object" || layout.padding === null) {
    const existing = typeof layout.padding === "number" ? layout.padding : 0;
    layout.padding = Math.max(existing, MIN_LAYOUT_PADDING);
  }

  if (typeof opts.plugins !== "object" || opts.plugins === null) opts.plugins = {};
  const plugins = opts.plugins as DeepRecord;

  if (typeof plugins.title === "object" && plugins.title !== null) {
    const title = plugins.title as DeepRecord;
    if (typeof title.font !== "object" || title.font === null) title.font = {};
    applyFloor(title.font as DeepRecord, "size", MIN_TITLE_SIZE);
    if (!(title.font as DeepRecord).weight) (title.font as DeepRecord).weight = "bold";
  }

  if (typeof plugins.legend === "object" && plugins.legend !== null) {
    const legend = plugins.legend as DeepRecord;
    if (typeof legend.labels !== "object" || legend.labels === null) legend.labels = {};
    const labels = legend.labels as DeepRecord;
    if (typeof labels.font !== "object" || labels.font === null) labels.font = {};
    applyFloor(labels.font as DeepRecord, "size", MIN_LEGEND_SIZE);
  }

  if (typeof opts.scales === "object" && opts.scales !== null) {
    for (const axis of Object.values(opts.scales as Record<string, unknown>)) {
      if (typeof axis !== "object" || axis === null) continue;
      const ax = axis as DeepRecord;

      if (typeof ax.ticks !== "object" || ax.ticks === null) ax.ticks = {};
      const ticks = ax.ticks as DeepRecord;
      if (typeof ticks.font !== "object" || ticks.font === null) ticks.font = {};
      applyFloor(ticks.font as DeepRecord, "size", MIN_TICK_SIZE);

      if (typeof ax.title === "object" && ax.title !== null) {
        const axTitle = ax.title as DeepRecord;
        if (typeof axTitle.font !== "object" || axTitle.font === null) axTitle.font = {};
        applyFloor(axTitle.font as DeepRecord, "size", MIN_AXIS_TITLE_SIZE);
      }
    }
  }

  return opts;
}

/**
 * Render `spec` off-screen at 2400x1350 and return a PNG data URL.
 * Throws if called in a non-browser environment.
 */
export function exportChartPng(spec: Record<string, unknown>): string {
  if (typeof document === "undefined") {
    throw new Error("exportChartPng must be called in a browser context.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_W * EXPORT_DPR;
  canvas.height = EXPORT_H * EXPORT_DPR;
  canvas.style.width = `${EXPORT_W}px`;
  canvas.style.height = `${EXPORT_H}px`;

  const rawOptions = (spec.options as DeepRecord | undefined) ?? {};
  const floored = applyFontFloors(rawOptions);

  const exportOptions: DeepRecord = mergeDefaults(
    {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      devicePixelRatio: EXPORT_DPR,
    },
    floored,
  );

  exportOptions.responsive = false;
  exportOptions.animation = false;
  exportOptions.devicePixelRatio = EXPORT_DPR;

  const config: ChartConfiguration = {
    type: spec.type as ChartConfiguration["type"],
    data: spec.data as ChartConfiguration["data"],
    options: exportOptions as ChartConfiguration["options"],
  };

  const chart = new Chart(canvas, config);
  const dataUrl = chart.toBase64Image("image/png", 1);
  chart.destroy();

  return dataUrl;
}
