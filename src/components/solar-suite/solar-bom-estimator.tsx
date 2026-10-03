import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  FileText,
  Gauge,
  Printer,
  Ruler,
  GanttChart,
  Save,
  Settings2,
  LogIn,
  LogOut,
  SunMedium,
  Weight,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSharedProject } from "@/lib/shared-project";

type WindZone = "Low" | "Moderate" | "High";
type Category = "PV Modules" | "Inverters" | "Racking" | "Electrical BOS" | "Roof Protection";

type Pricing = {
  module: number;
  inverter60: number;
  inverter125: number;
  tray: number;
  midClamp: number;
  endClamp: number;
  paver: number;
  slipSheet: number;
  pvWire: number;
  connector: number;
  groundingLug: number;
  copperWire: number;
  disconnect: number;
};

type PricingKey = keyof Pricing;

const defaultPricing: Pricing = {
  module: 318,
  inverter60: 18_500,
  inverter125: 31_500,
  tray: 42,
  midClamp: 4.5,
  endClamp: 6,
  paver: 8.5,
  slipSheet: 3.25,
  pvWire: 0.72,
  connector: 4.8,
  groundingLug: 5.5,
  copperWire: 2.9,
  disconnect: 2_400,
};

const pricingLabels: Record<keyof Pricing, string> = {
  module: "PV module",
  inverter60: "60 kW inverter",
  inverter125: "125 kW inverter",
  tray: "Racking tray",
  midClamp: "Mid clamp",
  endClamp: "End clamp",
  paver: "35 lb paver",
  slipSheet: "Slip sheet",
  pvWire: "10 AWG PV wire / ft",
  connector: "MC4 connector set",
  groundingLug: "Grounding lug",
  copperWire: "#6 copper wire / ft",
  disconnect: "AC fused disconnect",
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function SolarBomEstimator() {
  const { project, updateProject } = useSharedProject();
  const systemKw = project.systemSizeKw;
  const setSystemKw = (value: number) => updateProject({ systemSizeKw: Math.max(0, value) });
  const [panelWatts, setPanelWatts] = useState(550);
  const [gridVoltage, setGridVoltage] = useState("480V 3-Phase");
  const [windZone, setWindZone] = useState<WindZone>("Moderate");
  const [membrane, setMembrane] = useState("TPO");
  const [pricing, setPricing] = useState(defaultPricing);
  const [pricingOpen, setPricingOpen] = useState(false);
  const jobName = project.projectName;
  const jobAddress = project.address;
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const estimate = useMemo(() => {
    const modules = Math.ceil((Math.max(systemKw, 0) * 1000) / Math.max(panelWatts, 1));
    const requiredAc = systemKw / 1.25;
    const inverterSize = systemKw < 100 ? 60 : 125;
    const inverters = Math.ceil(requiredAc / inverterSize);
    const trays = Math.ceil(modules * 1.12);
    const midClamps = modules * 2;
    const endClamps = Math.ceil(modules * 0.25);
    const windMultiplier = windZone === "Low" ? 2.5 : windZone === "Moderate" ? 3.5 : 5;
    const pavers = Math.ceil(modules * windMultiplier);
    const pvWire = modules * 12;
    const copperWire = Math.ceil(systemKw * 15);
    const inverterPrice = inverterSize === 60 ? pricing.inverter60 : pricing.inverter125;

    const rows = [
      { pricingKey: "module" as PricingKey, category: "PV Modules" as Category, item: "Monocrystalline PV Module", specification: `${panelWatts} W commercial module`, quantity: modules, unit: "ea", unitCost: pricing.module },
      { pricingKey: (inverterSize === 60 ? "inverter60" : "inverter125") as PricingKey, category: "Inverters" as Category, item: "Three-Phase String Inverter", specification: `${inverterSize} kW · ${gridVoltage}`, quantity: inverters, unit: "ea", unitCost: inverterPrice },
      { pricingKey: "tray" as PricingKey, category: "Racking" as Category, item: "Ballasted Racking Tray", specification: `10° flat-roof mount · ${membrane}`, quantity: trays, unit: "ea", unitCost: pricing.tray },
      { pricingKey: "midClamp" as PricingKey, category: "Racking" as Category, item: "Module Mid Clamp", specification: "Commercial anodized aluminum", quantity: midClamps, unit: "ea", unitCost: pricing.midClamp },
      { pricingKey: "endClamp" as PricingKey, category: "Racking" as Category, item: "Module End Clamp", specification: "Commercial anodized aluminum", quantity: endClamps, unit: "ea", unitCost: pricing.endClamp },
      { pricingKey: "paver" as PricingKey, category: "Racking" as Category, item: "Concrete Ballast Paver", specification: `35 lb · ${windZone} wind zone`, quantity: pavers, unit: "ea", unitCost: pricing.paver },
      { pricingKey: "slipSheet" as PricingKey, category: "Roof Protection" as Category, item: "Rubber Slip Protection Sheet", specification: `${membrane}-compatible · one per tray`, quantity: trays, unit: "ea", unitCost: pricing.slipSheet },
      { pricingKey: "pvWire" as PricingKey, category: "Electrical BOS" as Category, item: "10 AWG PV Wire", specification: "PV-rated copper conductor", quantity: pvWire, unit: "ft", unitCost: pricing.pvWire },
      { pricingKey: "connector" as PricingKey, category: "Electrical BOS" as Category, item: "MC4 Connector Set", specification: "Male / female pair", quantity: modules * 2, unit: "set", unitCost: pricing.connector },
      { pricingKey: "groundingLug" as PricingKey, category: "Electrical BOS" as Category, item: "Solar Grounding Lug", specification: "UL 2703 listed", quantity: modules, unit: "ea", unitCost: pricing.groundingLug },
      { pricingKey: "copperWire" as PricingKey, category: "Electrical BOS" as Category, item: "#6 Bare Copper Grounding Wire", specification: "Solid bare copper", quantity: copperWire, unit: "ft", unitCost: pricing.copperWire },
      { pricingKey: "disconnect" as PricingKey, category: "Electrical BOS" as Category, item: "AC Fused Disconnect Switch", specification: `${gridVoltage} rated`, quantity: inverters, unit: "ea", unitCost: pricing.disconnect },
    ].map((row) => ({ ...row, cost: row.quantity * row.unitCost }));

    const categoryCosts = rows.reduce<Record<Category, number>>(
      (totals, row) => ({ ...totals, [row.category]: totals[row.category] + row.cost }),
      { "PV Modules": 0, Inverters: 0, Racking: 0, "Electrical BOS": 0, "Roof Protection": 0 },
    );
    const totalCost = rows.reduce((sum, row) => sum + row.cost, 0);
    const totalWeight = modules * 62 + trays * 8 + pavers * 35 + inverters * (inverterSize === 125 ? 190 : 130);
    const roofArea = modules * 42;
    return { modules, requiredAc, inverterSize, inverters, rows, categoryCosts, totalCost, totalWeight, density: roofArea ? totalWeight / roofArea : 0 };
  }, [gridVoltage, membrane, panelWatts, pricing, systemKw, windZone]);

  const exportCsv = () => {
    const header = ["Category", "Item", "Specification / Model", "Quantity", "Unit", "Unit Cost", "Estimated Cost"];
    const lines = estimate.rows.map((row) => [row.category, row.item, row.specification, row.quantity, row.unit, row.unitCost.toFixed(2), row.cost.toFixed(2)]);
    const csv = [header, ...lines].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "solar-bom.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const breakdown = [
    { label: "Modules", value: estimate.categoryCosts["PV Modules"], color: "bg-chart-1" },
    { label: "Inverters", value: estimate.categoryCosts.Inverters, color: "bg-chart-2" },
    { label: "Racking", value: estimate.categoryCosts.Racking, color: "bg-chart-3" },
    { label: "BOS", value: estimate.categoryCosts["Electrical BOS"] + estimate.categoryCosts["Roof Protection"], color: "bg-chart-4" },
  ];

  const updateUnitCost = (key: PricingKey, value: string) => setPricing((current) => ({ ...current, [key]: Math.max(0, Number(value)) }));

  async function generateBom() {
    if (!user) return;
    if (!jobAddress.trim()) { toast.error("Enter a project address first"); return; }
    setSaving(true);
    const { error } = await supabase.from("solar_bom_snapshots").insert({
      user_id: user.id,
      project_name: jobName.trim() || "Untitled solar project",
      project_address: jobAddress.trim(),
      system_kw: systemKw,
      panel_watts: panelWatts,
      grid_voltage: gridVoltage,
      wind_zone: windZone,
      membrane,
      pricing,
      line_items: estimate.rows,
      total_cost: estimate.totalCost,
      total_weight: estimate.totalWeight,
    });
    setSaving(false);
    if (error) { toast.error("Could not save this BOM"); return; }
    toast.success("BOM generated and saved", { description: jobAddress.trim() });
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="no-print sticky top-0 z-30 border-b border-primary-foreground/15 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5"><SunMedium className="size-6 text-accent" /><div><p className="font-display text-xl font-bold leading-none">SolarBOM <span className="text-accent">Pro</span></p><p className="font-mono text-[9px] uppercase tracking-widest opacity-75">Austin Clean Energy</p></div></div>
          <div className="flex items-center gap-2"><Button size="sm" variant="outline" asChild className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/solar-suite/draft"><Ruler /> <span className="hidden sm:inline">Plans</span></Link></Button><Button size="sm" variant="outline" asChild className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/solar-suite/flow"><GanttChart /> <span className="hidden sm:inline">Schedule</span></Link></Button>{user ? <Button size="sm" variant="outline" onClick={signOut} className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><LogOut /> <span className="hidden sm:inline">Sign out</span></Button> : <Button size="sm" variant="outline" asChild className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/auth"><LogIn /> Sign in</Link></Button>}</div>
        </div>
      </header>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <p className="font-mono text-xs uppercase tracking-[0.18em] opacity-80">Commercial PV estimator</p>
          <div className="mt-2 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div><h1 className="font-display text-4xl font-bold leading-none sm:text-6xl">Solar Bill of Materials</h1><p className="mt-3 max-w-2xl text-base opacity-80">Flat-roof material planning for commercial solar installations.</p></div>
            <div className="flex flex-wrap gap-2 no-print"><Button variant="outline" onClick={() => setPricingOpen(true)} className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Settings2 /> Pricing</Button>{user ? <Button onClick={generateBom} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90"><Save /> {saving ? "Saving…" : "Generate BOM"}</Button> : <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/auth"><LogIn /> Sign in to save</Link></Button>}<Button variant="outline" onClick={exportCsv} className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Download /> Export CSV</Button><Button variant="outline" onClick={() => window.print()} className="border-primary-foreground/25 bg-primary text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Printer /> Print / PDF</Button></div>
          </div>
        </div>
      </section>

      <div className="print-header mx-auto hidden max-w-7xl px-6 py-6">
        <p className="font-display text-2xl font-bold">Austin Clean Energy · SolarBOM Pro</p><p>{jobName} · {jobAddress}</p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="no-print border-b border-border pb-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">System parameters</h2><span className="font-mono text-xs text-muted-foreground">DC:AC 1.25</span></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="System capacity" suffix="kW DC"><input aria-label="System capacity in kilowatts DC" type="number" min="1" value={systemKw} onChange={(event) => setSystemKw(Number(event.target.value))} /></Field>
            <Field label="Panel wattage" suffix="W"><input aria-label="Panel wattage" type="number" min="400" max="700" step="5" value={panelWatts} onChange={(event) => setPanelWatts(Math.min(700, Math.max(400, Number(event.target.value))))} /></Field>
            <SelectField label="Grid voltage" value={gridVoltage} onChange={setGridVoltage} options={["480V 3-Phase", "208V 3-Phase"]} />
            <SelectField label="Roof membrane" value={membrane} onChange={setMembrane} options={["TPO", "EPDM", "PVC", "Built-Up"]} />
            <div className="rounded-md border border-border bg-card p-3"><span className="font-mono text-[10px] uppercase tracking-wider text-primary">Wind zone</span><div className="mt-2 grid grid-cols-3 gap-1">{(["Low", "Moderate", "High"] as WindZone[]).map((zone) => <Button key={zone} type="button" size="sm" variant={windZone === zone ? "default" : "outline"} onClick={() => setWindZone(zone)} className="px-1 text-[10px]">{zone}</Button>)}</div></div>
          </div>
        </section>

        <section className="grid grid-cols-2 border-b border-border bg-foreground text-background sm:grid-cols-4">
          <Kpi icon={<SunMedium />} label="PV modules" value={number.format(estimate.modules)} />
          <Kpi icon={<Zap />} label="Inverters" value={`${estimate.inverters} × ${estimate.inverterSize} kW`} />
          <Kpi icon={<Weight />} label="Roof weight" value={`${number.format(estimate.totalWeight)} lb`} />
          <Kpi icon={<Gauge />} label="Weight density" value={`${estimate.density.toFixed(2)} lb/ft²`} />
        </section>

        <section className="grid gap-8 border-b border-border py-7 lg:grid-cols-[1fr_1.4fr]">
          <div><div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-wider text-primary">Estimated material cost</p><h2 className="mt-1 font-display text-4xl font-bold">{money.format(estimate.totalCost)}</h2></div><p className="font-mono text-sm text-muted-foreground">{money.format(estimate.totalCost / Math.max(systemKw * 1000, 1))}/W</p></div><div className="mt-6 flex h-5 overflow-hidden rounded-sm">{breakdown.map((item) => <div key={item.label} className={item.color} style={{ width: `${estimate.totalCost ? (item.value / estimate.totalCost) * 100 : 0}%` }} />)}</div><div className="mt-4 grid grid-cols-2 gap-3">{breakdown.map((item) => <div key={item.label} className="flex items-center gap-2 text-sm"><span className={`size-2.5 rounded-full ${item.color}`} /><span className="flex-1">{item.label}</span><span className="font-mono text-xs">{money.format(item.value)}</span></div>)}</div></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Job / project name"><input value={jobName} onChange={(event) => updateProject({ projectName: event.target.value })} /></Field><Field label="Job site"><input value={jobAddress} onChange={(event) => updateProject({ address: event.target.value })} /></Field><div className="sm:col-span-2 flex items-start gap-3 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground"><FileText className="mt-0.5 size-4 shrink-0 text-primary" /><p>Report quantities update instantly. Final ballast and structural loads require site-specific engineering review.</p></div></div>
        </section>

        <section className="py-7">
          <div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-wider text-primary">Itemized estimate</p><h2 className="font-display text-2xl font-bold">Bill of materials</h2></div><span className="font-mono text-xs text-muted-foreground">{estimate.rows.length} line items</span></div>
          <div className="hidden overflow-hidden rounded-md border border-border md:block"><table className="w-full border-collapse text-left"><thead className="bg-muted font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><tr>{["Category", "Item", "Specification / Model", "Quantity", "Unit price", "Estimated cost"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{estimate.rows.map((row) => <tr key={`${row.category}-${row.item}`} className="border-t border-border"><td className="px-3 py-3 text-xs font-semibold text-primary">{row.category}</td><td className="px-3 py-3 text-sm font-semibold">{row.item}</td><td className="px-3 py-3 text-xs text-muted-foreground">{row.specification}</td><td className="px-3 py-3 font-mono text-sm">{number.format(row.quantity)} <span className="text-xs text-muted-foreground">{row.unit}</span></td><td className="px-3 py-2"><label className="flex w-28 items-center rounded-md border border-input bg-background px-2"><span className="text-muted-foreground">$</span><input aria-label={`${row.item} unit price`} className="w-full bg-transparent px-1 py-1.5 text-right font-mono text-sm outline-none" type="number" min="0" step="0.01" value={pricing[row.pricingKey]} onChange={(event) => updateUnitCost(row.pricingKey, event.target.value)} /></label></td><td className="px-3 py-3 text-right font-mono text-sm font-semibold">{money.format(row.cost)}</td></tr>)}</tbody></table></div>
          <div className="space-y-2 md:hidden">{estimate.rows.map((row) => <article key={`${row.category}-${row.item}`} className="rounded-md border border-border bg-card p-3"><div className="flex justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-wider text-primary">{row.category}</p><h3 className="mt-1 text-sm font-semibold">{row.item}</h3></div><p className="font-mono text-sm font-semibold">{money.format(row.cost)}</p></div><div className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground"><span>{row.specification}</span><span className="shrink-0 font-mono text-foreground">{number.format(row.quantity)} {row.unit}</span></div><label className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs"><span className="font-mono uppercase text-muted-foreground">Unit price</span><span className="flex w-28 items-center rounded-md border border-input bg-background px-2"><span className="text-muted-foreground">$</span><input aria-label={`${row.item} unit price`} className="w-full bg-transparent px-1 py-1.5 text-right font-mono text-sm text-foreground outline-none" type="number" min="0" step="0.01" value={pricing[row.pricingKey]} onChange={(event) => updateUnitCost(row.pricingKey, event.target.value)} /></span></label></article>)}</div>
        </section>
      </div>

      {pricingOpen && <div className="no-print fixed inset-0 z-50 bg-foreground/40" onClick={() => setPricingOpen(false)}><aside className="ml-auto h-full w-full max-w-md overflow-y-auto bg-background p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-wider text-primary">Cost controls</p><h2 className="font-display text-2xl font-bold">Pricing settings</h2></div><Button variant="ghost" size="icon" aria-label="Close pricing settings" onClick={() => setPricingOpen(false)}><X /></Button></div><p className="mt-2 text-sm text-muted-foreground">Edit unit costs to match current supplier pricing. Totals update immediately.</p><div className="mt-6 space-y-3">{(Object.keys(pricing) as (keyof Pricing)[]).map((key) => <label key={key} className="flex items-center justify-between gap-4 border-b border-border pb-3"><span className="text-sm">{pricingLabels[key]}</span><span className="flex w-32 items-center rounded-md border border-input bg-card px-2"><span className="text-muted-foreground">$</span><input aria-label={`${pricingLabels[key]} unit cost`} className="w-full bg-transparent px-2 py-2 text-right font-mono text-sm outline-none" type="number" min="0" step="0.01" value={pricing[key]} onChange={(event) => setPricing((current) => ({ ...current, [key]: Math.max(0, Number(event.target.value)) }))} /></span></label>)}</div><Button className="mt-6 w-full" onClick={() => setPricingOpen(false)}>Apply pricing <ChevronDown /></Button></aside></div>}
    </main>
  );
}

function Field({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactElement<{ className?: string }> }) {
  return <label className="rounded-md border border-border bg-card p-3"><span className="font-mono text-[10px] uppercase tracking-wider text-primary">{label}</span><div className="mt-1 flex items-baseline gap-2">{useMemo(() => ({ ...children, props: { ...children.props, className: "min-w-0 w-full bg-transparent font-mono text-lg font-semibold outline-none" } }), [children])}{suffix && <span className="shrink-0 font-mono text-xs text-muted-foreground">{suffix}</span>}</div></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="rounded-md border border-border bg-card p-3"><span className="font-mono text-[10px] uppercase tracking-wider text-primary">{label}</span><select className="mt-1 w-full bg-transparent font-mono text-sm font-semibold outline-none" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="border-b border-r border-background/15 p-4 sm:border-b-0 sm:p-5"><div className="flex items-center gap-2 text-accent [&_svg]:size-4"><span>{icon}</span><span className="font-mono text-[9px] uppercase tracking-wider">{label}</span></div><p className="mt-2 font-display text-xl font-bold sm:text-2xl">{value}</p></div>;
}