import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, ReferenceLine,
} from "recharts";

const PRI    = "hsl(var(--primary))";
const AMBER  = "#f59e0b";
const MUT    = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";

// ── Chart 1: JD Power APEAL ───────────────────────────────────────────────────
// Source: J.D. Power 2024 U.S. APEAL Study (press release, June 2024)
// Measures emotional attachment — 37 attributes from acceleration feel to cabin comfort
// Scale: 1,000 pts. Industry average 847. 2024 is the FIRST year EVs outscored gas.
// Scores: Non-Tesla BEV 877 · Tesla 870 · Gas 842 · PHEV 841
// Showing delta from industry average (847) so bars are proportional to actual difference
const apealData = [
  { label: "Electric", score: 877 },
  { label: "Gas",      score: 842 },
];

// ── Chart 2: Would buy same type again ───────────────────────────────────────
// EV: Global EV Alliance survey Dec 2024, 23,000+ owners across 18 countries
// Gas: Experian Automotive Q4 2024 — % of gas owners who replaced with same fuel type
const loyaltyData = [
  { label: "Electric", pct: 92 },
  { label: "Gas",      pct: 82 },
];

// ── Chart 3: Cabin noise by speed ────────────────────────────────────────────
// Source: Michelin acoustic research + automotive NVH testing
// EVs ~20 dB quieter at low speeds; gap narrows at highway as tyre/wind noise dominates
const noiseData = [
  { speed: "Idle",     ev: 35, gas: 55 },
  { speed: "City",     ev: 52, gas: 66 },
  { speed: "Highway",  ev: 75, gas: 78 },
];

// ── Chart 4: 0-60 times ──────────────────────────────────────────────────────
// Manufacturer specs & Car and Driver tests — mainstream mid-size SUVs, same segment
const accelerationData = [
  { name: "Tesla Model Y",   time: 4.8, type: "ev"  },
  { name: "Hyundai Ioniq 5", time: 5.1, type: "ev"  },
  { name: "Ford Mach-E",     time: 5.8, type: "ev"  },
  { name: "Honda CR-V",      time: 7.5, type: "gas" },
  { name: "Ford Explorer",   time: 7.9, type: "gas" },
  { name: "Toyota RAV4",     time: 8.4, type: "gas" },
];

// ─────────────────────────────────────────────────────────────────────────────

const ApealChart = () => (
  <Card className="border border-border/50">
    <CardContent className="pt-4 pb-3 flex flex-col">
      <p className="text-xs font-medium text-foreground mb-0.5">Owner Excitement Score</p>
      <div className="h-14 flex flex-col justify-between">
        <p className="text-[10px] text-muted-foreground">Survey on 37 aspects of how much they love their vehicle — acceleration, cabin comfort, controls, and more</p>
        <div className="relative h-4" style={{ marginLeft: 84, marginRight: 44 }}>
          <span className="absolute text-[10px] text-muted-foreground -translate-x-1/2" style={{ left: "20%" }}>Lowest</span>
          <span className="absolute text-[10px] text-muted-foreground -translate-x-1/2" style={{ left: "47%" }}>Average</span>
          <span className="absolute text-[10px] text-muted-foreground -translate-x-1/2" style={{ left: "91%" }}>Highest</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <BarChart
          data={apealData}
          layout="vertical"
          margin={{ left: 4, right: 44, top: 4, bottom: 4 }}
          barSize={28}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
          <XAxis
            type="number"
            domain={[800, 900]}
            tick={{ fontSize: 10, fill: MUT }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={80}
            tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine x={820} stroke={MUT} strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine x={847} stroke={MUT} strokeDasharray="3 3" />
          <ReferenceLine x={891} stroke={MUT} strokeDasharray="3 3" strokeOpacity={0.5} />
          <Tooltip
            formatter={(v: number) => [`${v} / 1,000`, "APEAL score"]}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${BORDER}` }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            <Cell fill={PRI} />
            <Cell fill={AMBER} fillOpacity={0.75} />
            <LabelList
              dataKey="score"
              position="insideEnd"
              style={{ fontSize: 12, fontWeight: 600, fill: "#fff" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted-foreground mt-auto pt-2">
        Source: J.D. Power 2024 U.S. APEAL Study
      </p>
    </CardContent>
  </Card>
);

const LoyaltyChart = () => (
  <Card className="border border-border/50">
    <CardContent className="pt-4 pb-3 flex flex-col">
      <p className="text-xs font-medium text-foreground mb-0.5">Owner Loyalty</p>
      <div className="h-14 flex flex-col justify-between">
        <p className="text-[10px] text-muted-foreground">Share of owners who chose the same fuel type on their next vehicle purchase</p>
        <div className="h-4" />
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <BarChart
          data={loyaltyData}
          layout="vertical"
          margin={{ left: 4, right: 44, top: 4, bottom: 4 }}
          barSize={28}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 10, fill: MUT }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={80}
            tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: number) => [`${v}%`, "Would buy again"]}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${BORDER}` }}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
            <Cell fill={PRI} />
            <Cell fill={AMBER} fillOpacity={0.75} />
            <LabelList
              dataKey="pct"
              position="insideEnd"
              formatter={(v: number) => `${v}%`}
              style={{ fontSize: 12, fontWeight: 600, fill: "#fff" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted-foreground mt-auto pt-2">
        EV: Global EV Alliance Dec 2024, 23k+ owners · Gas: Experian Q4 2024
      </p>
    </CardContent>
  </Card>
);

const NoiseChart = () => (
  <Card className="border border-border/50">
    <CardContent className="pt-4 pb-3">
      <p className="text-xs font-medium text-foreground mb-3">Cabin Noise (dB) — lower is quieter</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={noiseData}
          layout="vertical"
          margin={{ left: 4, right: 44, top: 4, bottom: 4 }}
          barSize={18}
          barGap={3}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 90]}
            tick={{ fontSize: 10, fill: MUT }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="speed"
            width={52}
            tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: number, name: string) => [`${v} dB`, name === "ev" ? "Electric" : "Gas"]}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${BORDER}` }}
          />
          <Bar dataKey="ev"  name="Electric" fill={PRI}   radius={[0,4,4,0]}>
            <LabelList dataKey="ev"  position="right" formatter={(v: number) => `${v} dB`} style={{ fontSize: 10, fill: MUT }} />
          </Bar>
          <Bar dataKey="gas" name="Gas"      fill={AMBER} radius={[0,4,4,0]} fillOpacity={0.75}>
            <LabelList dataKey="gas" position="right" formatter={(v: number) => `${v} dB`} style={{ fontSize: 10, fill: MUT }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted-foreground mt-2">
        Source: Michelin acoustic research
      </p>
    </CardContent>
  </Card>
);

const AccelerationChart = () => (
  <Card className="border border-border/50">
    <CardContent className="pt-4 pb-3">
      <p className="text-xs font-medium text-foreground mb-3">0–60 mph — comparable models, seconds (shorter = faster)</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={accelerationData}
          layout="vertical"
          margin={{ left: 8, right: 44, top: 4, bottom: 4 }}
          barSize={18}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 10]}
            tickFormatter={v => `${v}s`}
            tick={{ fontSize: 10, fill: MUT }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: number) => [`${v}s`, "0–60 mph"]}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${BORDER}` }}
          />
          <Bar dataKey="time" radius={[0, 4, 4, 0]}>
            {accelerationData.map(entry => (
              <Cell
                key={entry.name}
                fill={entry.type === "ev" ? PRI : AMBER}
                fillOpacity={entry.type === "ev" ? 1 : 0.75}
              />
            ))}
            <LabelList
              dataKey="time"
              position="right"
              formatter={(v: number) => `${v}s`}
              style={{ fontSize: 11, fill: MUT, fontVariantNumeric: "tabular-nums" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted-foreground mt-2">
        Source: manufacturer specs &amp; Car and Driver tests
      </p>
    </CardContent>
  </Card>
);

const EVDrivingExperience = () => (
  <div className="space-y-4">
    <div className="grid md:grid-cols-2 gap-4">
      <ApealChart />
      <LoyaltyChart />
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <NoiseChart />
      <AccelerationChart />
    </div>
  </div>
);

export default EVDrivingExperience;
