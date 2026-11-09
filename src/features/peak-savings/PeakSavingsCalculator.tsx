// PeakSavingsCalculator.tsx: IRR, NPV and payback for cutting a building's electric peak.
// Needs: src/lib/peakCalc.ts and src/styles/peakSavingsCalculator.css. No extra packages (charts are plain SVG).
import { useMemo, useState } from "react";
import "./peakSavingsCalculator.css";
import { Inputs, MEASURES, MeasureType, Ownership, download, pct1, run, sensitivity, toCsv, totalDemandRate, usd, utilityValue } from "./peakCalc";

type Tab = "owner" | "utility";
const GREEN = "#2E7D6B", TEAL = "#123A4A", GREY = "#7D8F97", AMBER = "#F2A541";

function Num({ label, value, onChange, step = 1, min = 0, max, help, readOnly }: { label: string; value: number; onChange?: (v: number) => void; step?: number; min?: number; max?: number; help?: string; readOnly?: boolean }) {
  return (
    <label className="psc-field">
      <span>{label}</span>
      <input type="number" value={Number.isFinite(value) ? value : 0} step={step} min={min} max={max} readOnly={readOnly}
        onChange={(e) => onChange && onChange(Math.min(max ?? Infinity, Math.max(min, Number(e.target.value) || 0)))} />
      {help && <small>{help}</small>}
    </label>
  );
}

function CashChart({ cashflow, cumulative }: { cashflow: number[]; cumulative: number[] }) {
  const W = 900, H = 320, ML = 70, MR = 16, MT = 16, MB = 34;
  const PW = W - ML - MR, PH = H - MT - MB;
  const all = [...cashflow, ...cumulative, 0];
  const mx = Math.max(...all), mn = Math.min(...all);
  const span = (mx - mn) || 1;
  const y = (v: number) => MT + PH - ((v - mn) / span) * PH;
  const n = cashflow.length;
  const gw = PW / n;
  const x = (i: number) => ML + gw * i + gw / 2;
  const ticks = Array.from({ length: 5 }, (_, i) => mn + (span * i) / 4);
  const line = cumulative.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cash flow by year and cumulative cash flow" fontFamily="system-ui, sans-serif">
      <rect width={W} height={H} fill="#fff" />
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={ML} x2={W - MR} y1={y(t)} y2={y(t)} stroke="#E3E9EC" />
          <text x={ML - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#51666F">{usd(t)}</text>
        </g>
      ))}
      <line x1={ML} x2={W - MR} y1={y(0)} y2={y(0)} stroke="#51666F" />
      {cashflow.map((v, i) => (
        <g key={i}>
          <rect x={x(i) - gw * 0.3} y={Math.min(y(v), y(0))} width={gw * 0.6} height={Math.abs(y(v) - y(0))} fill={v < 0 ? AMBER : GREEN} />
          <text x={x(i)} y={H - 12} textAnchor="middle" fontSize={11} fill="#51666F">{i}</text>
        </g>
      ))}
      <path d={line} fill="none" stroke={TEAL} strokeWidth={2.5} />
      <text x={ML + PW / 2} y={H - 0} textAnchor="middle" fontSize={11} fill="#51666F"> </text>
    </svg>
  );
}

export default function PeakSavingsCalculator() {
  const [tab, setTab] = useState<Tab>("owner");
  const [type, setType] = useState<MeasureType>("led");
  const [own, setOwn] = useState<Ownership>("buy");
  const [share, setShare] = useState(50);
  const [bill, setBill] = useState({ demandCharge: 10.32, regCharge: 5.03, energyRate: 0.0594, capturePct: 75, rateEscPct: 3, buildingPeak: 0 });
  const [m, setM] = useState({ kw: 10, kwh: 35000, upfront: 3500, rebate: 0, creditPct: 0, om: 0, degPct: 0, life: 12, discPct: 8, omEscPct: 2.5 });
  const [bat, setBat] = useState({ kw: 100, hours: 2, perKwh: 520, shave: 0.5 });
  const [util, setUtil] = useState({ kw: 1000, ratePerKwYear: 65, lossPct: 6, customers: 500000 });
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const setBill_ = (k: keyof typeof bill, v: number) => setBill({ ...bill, [k]: v });
  const setM_ = (k: keyof typeof m, v: number) => setM({ ...m, [k]: v });

  const applyBattery = (b: typeof bat, keepOm = false) => {
    setBat(b);
    setM((prev) => ({ ...prev, kw: Math.round(b.kw * b.shave * 10) / 10, upfront: Math.round(b.kw * b.hours * b.perKwh), kwh: 0, om: keepOm ? prev.om : Math.round(44 * b.kw) }));
  };
  const pickType = (t: MeasureType) => {
    setType(t);
    const d = MEASURES[t];
    if (t === "battery") {
      const b = { kw: 100, hours: 2, perKwh: 520, shave: 0.5 };
      setBat(b);
      setM({ kw: 50, kwh: 0, upfront: 104000, rebate: 0, creditPct: 30, om: 4400, degPct: 2, life: d.life, discPct: m.discPct, omEscPct: m.omEscPct });
    } else {
      setM({ kw: d.kw, kwh: d.kwh, upfront: d.cost, rebate: 0, creditPct: 0, om: d.om, degPct: 0, life: d.life, discPct: m.discPct, omEscPct: m.omEscPct });
    }
    if (t !== "battery") setOwn("buy");
  };

  const inputs: Inputs = useMemo(() => ({
    demandCharge: bill.demandCharge, regCharge: bill.regCharge, energyRate: bill.energyRate, capturePct: bill.capturePct, rateEscPct: bill.rateEscPct,
    kw: m.kw, kwh: m.kwh, upfront: m.upfront, rebate: m.rebate, creditPct: m.creditPct, om: m.om, degPct: m.degPct, life: Math.max(1, Math.round(m.life)), discPct: m.discPct, omEscPct: m.omEscPct,
    thirdPartySharePct: type === "battery" && own === "third" ? share : undefined,
  }), [bill, m, type, own, share]);

  const uv = utilityValue(util);
  const utilInputs: Inputs = { ...inputs, thirdPartySharePct: undefined, annualOverride: uv.annual };
  const out = useMemo(() => run(tab === "owner" ? inputs : utilInputs), [tab, inputs, uv.annual]); // eslint-disable-line react-hooks/exhaustive-deps
  const sens = useMemo(() => (tab === "owner" && !out.thirdParty ? sensitivity(inputs) : null), [tab, inputs, out.thirdParty]);

  const sentence = out.thirdParty
    ? `At your inputs the owner keeps ${share}% of the demand savings and you keep about ${usd(out.y1Net)} in year 1, with no upfront cost. Your payment to the owner is about ${usd(out.ownerPayment1)} in year 1.`
    : out.irr !== null && out.payback !== null
      ? `At your inputs, this pays back in ${out.payback} year${out.payback === 1 ? "" : "s"} with an IRR of ${pct1(out.irr)} and an NPV of ${usd(out.npv)}.`
      : `At your inputs, this does not pay back. To reach a ${m.discPct}% return you would need about ${usd(out.neededExtra)} more per year in savings.`;

  const warnings: string[] = [];
  if (type === "battery" && bat.shave > 0.6) warnings.push("A shave above 0.6 needs perfect forecasting. Treat results above that as a best case.");
  if (bill.capturePct > 90) warnings.push("Few buildings lower their peak in nearly every month.");
  if (bill.buildingPeak > 0 && m.kw > 0.3 * bill.buildingPeak) warnings.push("That is a large share of your peak; check the estimate with your installer.");
  warnings.push("Demand charges here are Austin Energy rates published in 2026 and may change. A pending Texas PUC rule (replacing 4CP with 12CP) may change how transmission costs are allocated. Check your bill.");

  const copy = async () => {
    const t = `Peak Savings Calculator\n${MEASURES[type].label}\n${sentence}\nYear-1 net savings: ${usd(out.y1Net)}\nNet upfront cost: ${usd(out.netCost)}\nIRR: ${out.irr === null ? "n/a" : pct1(out.irr)}\nNPV: ${usd(out.npv)}\nPayback: ${out.payback ?? "none"}`;
    try { await navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  const csv = () => download("peak-savings-cashflow.csv", toCsv([["Year", "Savings", "Operating cost", "Cash flow", "Cumulative"], ...out.cashflow.map((c, i) => [i, i === 0 ? 0 : out.savings[i - 1], i === 0 ? 0 : out.om[i - 1], c, out.cumulative[i]])]));

  const drivers = [
    { label: "Demand-charge savings", v: out.y1Demand, color: GREEN },
    { label: "Energy savings", v: out.y1Energy, color: "#5FA896" },
    { label: "Operating cost", v: -(out.om[0] ?? 0), color: AMBER },
  ];
  const dmax = Math.max(1, ...drivers.map((d) => Math.abs(d.v)));
  const D = totalDemandRate(bill);

  return (
    <div className="psc-root">
      <header className="psc-header">
        <h1>Peak Savings Calculator</h1>
        <p>Estimate the return on cutting your building's electric peak with efficiency, demand response or a battery. Austin Energy commercial rates.</p>
        <div className="psc-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "owner"} className={tab === "owner" ? "on" : ""} onClick={() => setTab("owner")}>Building owner</button>
          <button role="tab" aria-selected={tab === "utility"} className={tab === "utility" ? "on" : ""} onClick={() => setTab("utility")}>Utility view (Austin Energy)</button>
        </div>
      </header>

      <div className="psc-layout">
        <div className="psc-inputs">
          {tab === "owner" ? (
            <>
              <section className="psc-card">
                <h2>What are you doing?</h2>
                <div className="psc-seg" role="group" aria-label="Measure type">
                  {(Object.keys(MEASURES) as MeasureType[]).map((t) => <button key={t} type="button" className={type === t ? "on" : ""} onClick={() => pickType(t)}>{MEASURES[t].label}</button>)}
                </div>
                <button type="button" className="psc-link" onClick={() => pickType(type)}>Reset to defaults</button>
                {type === "battery" && (
                  <div className="psc-seg" role="group" aria-label="Ownership">
                    <button type="button" className={own === "buy" ? "on" : ""} onClick={() => setOwn("buy")}>I buy it</button>
                    <button type="button" className={own === "third" ? "on" : ""} onClick={() => setOwn("third")}>Third party owns it (shared savings)</button>
                  </div>
                )}
                {own === "third" && type === "battery" && <Num label="Share of your demand-charge savings paid to the owner, %" value={share} onChange={setShare} max={100} help="No upfront cost and no tax credit for you." />}
                <small>Defaults are typical placeholders; replace them with your quote.</small>
              </section>

              <section className="psc-card">
                <h2>Your building and bill</h2>
                <div className="psc-grid">
                  <Num label="Demand charge, $/kW-month" value={bill.demandCharge} onChange={(v) => setBill_("demandCharge", v)} step={0.01} help="Austin Energy SV2 (10 to under 300 kW). Larger customers pay a different rate: check your bill." />
                  <Num label="Regulatory charge, $/kW-month" value={bill.regCharge} onChange={(v) => setBill_("regCharge", v)} step={0.01} help="Austin Energy pass-through for transmission and ERCOT costs, billed per kW." />
                </div>
                <p className="psc-total">Total demand-related charge: <strong>${D.toFixed(2)} per kW-month</strong></p>
                <div className="psc-grid">
                  <Num label="Energy rate, $/kWh" value={bill.energyRate} onChange={(v) => setBill_("energyRate", v)} step={0.0001} help="Energy charge 2.029 cents plus power supply adjustment 3.912 cents. Check your bill; the PSA changes each year." />
                  <Num label="Months the measure lowers your billed peak, %" value={bill.capturePct} onChange={(v) => setBill_("capturePct", v)} max={100} help="Your bill is set by your highest 15-minute peak each month. A measure only saves money in months where it lowers that peak." />
                  <Num label="Annual increase in rates, %" value={bill.rateEscPct} onChange={(v) => setBill_("rateEscPct", v)} step={0.5} max={15} />
                  <Num label="My building's peak kW (optional)" value={bill.buildingPeak} onChange={(v) => setBill_("buildingPeak", v)} help="Used only for a sanity check." />
                </div>
              </section>

              <section className="psc-card">
                <h2>The measure</h2>
                {type === "battery" && (
                  <div className="psc-grid">
                    <Num label="Battery power, kW" value={bat.kw} onChange={(v) => applyBattery({ ...bat, kw: v })} />
                    <Num label="Battery duration, hours" value={bat.hours} onChange={(v) => applyBattery({ ...bat, hours: v })} step={0.5} max={12} />
                    <Num label="Installed cost, $/kWh" value={bat.perKwh} onChange={(v) => applyBattery({ ...bat, perKwh: v })} />
                    <label className="psc-field">
                      <span>Shave per battery kW: {bat.shave.toFixed(2)}</span>
                      <input type="range" min={0.1} max={0.8} step={0.05} value={bat.shave} onChange={(e) => applyBattery({ ...bat, shave: Number(e.target.value) }, true)} />
                      <small>In a test on Texas commercial building profiles, a battery sized at 10 percent of building peak cut 0.5 to 0.8 kW per battery kW with perfect forecasting but only 0.0 to 0.3 with a simple rule. Good dispatch software is what decides your savings.</small>
                    </label>
                  </div>
                )}
                <div className="psc-grid">
                  <Num label="kW removed from your monthly peak" value={m.kw} onChange={(v) => setM_("kw", v)} step={0.5} readOnly={type === "battery"} help={type === "battery" ? "Battery kW x shave." : undefined} />
                  <Num label="kWh saved per year (efficiency only)" value={m.kwh} onChange={(v) => setM_("kwh", v)} step={100} readOnly={type === "battery"} />
                  <Num label="Upfront cost, $" value={m.upfront} onChange={(v) => setM_("upfront", v)} step={100} readOnly={type === "battery"} help={type === "battery" ? "Power x hours x $/kWh." : undefined} />
                  <Num label="Rebate or incentive, $" value={m.rebate} onChange={(v) => setM_("rebate", v)} step={100} />
                  <Num label="Federal tax credit, %" value={m.creditPct} onChange={(v) => setM_("creditPct", v)} max={100} help="Storage credits are assumed available; confirm with your tax adviser." />
                  <Num label={MEASURES[type].omLabel} value={m.om} onChange={(v) => setM_("om", v)} step={50} />
                  <Num label="Annual loss of savings (degradation), %" value={m.degPct} onChange={(v) => setM_("degPct", v)} step={0.5} max={20} />
                  <Num label="Life, years" value={m.life} onChange={(v) => setM_("life", v)} min={1} max={40} />
                  <Num label="Discount rate for NPV, %" value={m.discPct} onChange={(v) => setM_("discPct", v)} step={0.5} max={30} />
                  <Num label="Annual increase in operating cost, %" value={m.omEscPct} onChange={(v) => setM_("omEscPct", v)} step={0.5} max={15} />
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="psc-card">
                <h2>Value to Austin Energy of a lower 4CP</h2>
                <div className="psc-grid">
                  <Num label="kW reduced at the four summer system peaks" value={util.kw} onChange={(v) => setUtil({ ...util, kw: v })} step={50} />
                  <Num label="Transmission rate, $/kW-year" value={util.ratePerKwYear} onChange={(v) => setUtil({ ...util, ratePerKwYear: v })} help="Rough 2024 estimate: about $5.1 billion transmission cost spread over about 80 GW of peak load; replace with the current rate." />
                  <Num label="Line-loss gross-up, %" value={util.lossPct} onChange={(v) => setUtil({ ...util, lossPct: v })} step={0.5} max={30} />
                  <Num label="Austin Energy customers" value={util.customers} onChange={(v) => setUtil({ ...util, customers: v })} step={10000} help="Approximation; replace." />
                </div>
                <p className="psc-total">{util.kw.toLocaleString("en-US")} kW cut at the four peaks is worth about <strong>{usd(uv.annual)} a year</strong> to Austin Energy, or about <strong>${uv.perCustomer.toFixed(2)} per customer</strong>.</p>
                <p className="psc-note">The four-coincident-peak charge counts one 15-minute system peak in each of June through September and sets the next calendar year's transmission charges. A proposed 12CP rule would use monthly peaks in all 12 months.</p>
              </section>
              <section className="psc-card">
                <h2>Cost of getting there</h2>
                <div className="psc-grid">
                  <Num label="Upfront cost, $" value={m.upfront} onChange={(v) => setM_("upfront", v)} step={1000} />
                  <Num label="Federal tax credit, %" value={m.creditPct} onChange={(v) => setM_("creditPct", v)} max={100} />
                  <Num label="Annual operating cost, $/yr" value={m.om} onChange={(v) => setM_("om", v)} step={500} />
                  <Num label="Life, years" value={m.life} onChange={(v) => setM_("life", v)} min={1} max={40} />
                  <Num label="Discount rate, %" value={m.discPct} onChange={(v) => setM_("discPct", v)} step={0.5} max={30} />
                  <Num label="Annual increase in savings, %" value={bill.rateEscPct} onChange={(v) => setBill_("rateEscPct", v)} step={0.5} max={15} />
                </div>
              </section>
            </>
          )}
        </div>

        <div className="psc-results" aria-live="polite">
          <p className="psc-sentence">{sentence}</p>
          <div className="psc-metrics">
            <div className="psc-metric"><h3>IRR</h3><p className="big">{out.thirdParty ? "n/a" : out.irr === null ? "None" : pct1(out.irr)}</p><p>{out.thirdParty ? "No upfront cost" : out.irr === null ? "Does not pay back" : "Return per year"}</p></div>
            <div className="psc-metric"><h3>NPV</h3><p className="big">{usd(out.npv)}</p><p>at {m.discPct}%</p></div>
            <div className="psc-metric"><h3>Payback</h3><p className="big">{out.thirdParty ? "Immediate" : out.payback === null ? "None" : `${out.payback} yr`}</p><p>{out.payback === null && !out.thirdParty ? `Not within the ${Math.round(m.life)}-year life` : "Simple payback"}</p></div>
            <div className="psc-metric"><h3>Year-1 net savings</h3><p className="big">{usd(out.y1Net)}</p><p>after operating cost</p></div>
          </div>

          <section className="psc-card">
            <h2>Cash flow by year</h2>
            <CashChart cashflow={out.cashflow} cumulative={out.cumulative} />
            <div className="psc-legend"><span><i style={{ background: AMBER }} /> Upfront cost</span><span><i style={{ background: GREEN }} /> Yearly cash flow</span><span><i style={{ background: TEAL }} /> Cumulative</span></div>
            <p className="psc-note">Net upfront cost {usd(out.netCost)}. Total savings over life {usd(out.totalSavings)}. Net total gain {usd(out.netGain)}.</p>
          </section>

          <section className="psc-card">
            <h2>What drives your result</h2>
            {drivers.map((d) => (
              <div key={d.label} className="psc-bar">
                <span>{d.label}</span>
                <div className="track"><div style={{ width: `${(Math.abs(d.v) / dmax) * 100}%`, background: d.color }} /></div>
                <strong>{usd(d.v)}</strong>
              </div>
            ))}
            <p className="psc-note">Year 1. Demand savings = kW removed x ${D.toFixed(2)} x 12 x {bill.capturePct}% of months.</p>
          </section>

          {sens && (
            <section className="psc-card">
              <h2>Sensitivity: IRR</h2>
              <div className="psc-tablewrap">
                <table>
                  <thead><tr><th>Upfront cost</th>{[25, 50, 75, 100].map((c) => <th key={c}>{c}% of months</th>)}</tr></thead>
                  <tbody>{sens.map((r) => <tr key={r.costPct}><td>{r.costPct}% of entered</td>{r.cells.map((c, i) => <td key={i}>{c === null ? "-" : pct1(c)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </section>
          )}

          {warnings.map((w, i) => <div className="psc-warn" key={i}>{w}</div>)}

          <div className="psc-actions">
            <button type="button" onClick={copy}>{copied ? "Copied" : "Copy results"}</button>
            <button type="button" onClick={csv}>Download CSV</button>
          </div>

          <section className="psc-card">
            <button type="button" className="psc-acc" aria-expanded={open} onClick={() => setOpen(!open)}>How this is calculated {open ? "▲" : "▼"}</button>
            {open && (
              <div className="psc-note">
                <p>Demand savings in year t = kW removed x (demand charge + regulatory charge) x 12 x share of months that count, grown by the yearly rate increase and reduced by any yearly loss of savings.</p>
                <p>Energy savings in year t = kWh saved x energy rate, grown the same way.</p>
                <p>Net upfront cost = upfront cost x (1 - tax credit) - rebate. Cash flow in year t = savings - operating cost. IRR is the rate that makes the cash flows add to zero; NPV discounts them at your rate. Payback is the first year the running total reaches zero.</p>
                <p>With third-party ownership you pay the owner your chosen share of demand savings and have no upfront cost, so IRR does not apply.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <footer className="psc-footer">
        Estimates only, not financial, tax or engineering advice. Costs and savings are placeholders until you have quotes. Rates: Austin Energy commercial rate schedule (Secondary Voltage 2). Peak-shaving behavior: modeled on Texas commercial building load profiles. No data is stored or sent.
      </footer>
    </div>
  );
}
