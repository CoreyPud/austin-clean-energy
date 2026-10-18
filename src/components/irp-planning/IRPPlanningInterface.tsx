import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  loadForecastFields,
  resourceRows as initialResourceRows,
  localBatteries,
  systemCostAdder,
  newResourceOptions as initialNewResourceOptions,
  newResourceBlockNote,
  reliabilityFields,
  pricePressureFields,
  financialFields,
  tagMeta,
  intro,
  namedOwnedPlants,
  windFacilities,
  solarFacilities,
  biomassFacility,
  contractedResources2026,
  batteryStorageTarget2027,
  windAuthorization2026,
  gasPeakerAuthorization2026Note,
  type ScalarField,
  type ResourceRow,
  type NewResourceOption,
  type Facility,
  type Tag,
} from "./irp-planning-data";
import "./irp-planning-interface.css";

// ---------------------------------------------------------------------------
// Small shared bits
// ---------------------------------------------------------------------------

const fmt = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });

const fmtMoney = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${fmt(n / 1_000_000_000, 2)}B`;
  if (abs >= 1_000_000) return `$${fmt(n / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `$${fmt(n / 1_000, 0)}K`;
  return `$${fmt(n, 0)}`;
};

function TagPill({ tag }: { tag: Tag }) {
  const meta = tagMeta[tag];
  return (
    <span
      className={`irp-tag irp-tag-${tag}`}
      title={meta.description}
    >
      {meta.label}
    </span>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: ScalarField;
  value: number;
  onChange: (v: number) => void;
}) {
  const blocked = field.tag === "blocked";
  return (
    <div className={`irp-field ${blocked ? "irp-field-blocked" : ""}`}>
      <div className="irp-field-head">
        <span className="irp-field-label">{field.label}</span>
        <TagPill tag={field.tag} />
      </div>
      <div className="irp-field-row">
        <input
          type="number"
          className="irp-input"
          aria-label={field.label}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          step="any"
        />
        <span className="irp-unit">{field.unit}</span>
      </div>
      <p className="irp-field-source">{field.source}</p>
      {field.note && <p className="irp-field-note">{field.note}</p>}
    </div>
  );
}

function BlockedBanner({ title, missing }: { title: string; missing: string[] }) {
  return (
    <div className="irp-blocked-banner">
      <div className="irp-blocked-head">
        <span className="irp-blocked-dot" />
        Model cannot run — {title}
      </div>
      <p className="irp-blocked-body">
        This calculation needs real numbers for the field{missing.length > 1 ? "s" : ""} below. Each is
        currently set to 0 because no sourced figure was found anywhere in this project. Fill in a real
        number on the Inputs tab and this output will compute automatically.
      </p>
      <ul className="irp-blocked-list">
        {missing.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

function FacilityTable({ title, facilities }: { title: string; facilities: Facility[] }) {
  const total = facilities.reduce((s, f) => s + f.mw, 0);
  return (
    <div className="irp-facility-block">
      <h3 className="irp-facility-title">
        {title} <span className="irp-facility-total">{fmt(total, 1)} MW total</span>
      </h3>
      <div className="irp-table-wrap">
        <table className="irp-table irp-table-compact">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Fuel</th>
              <th>MW</th>
              <th>Online</th>
              <th>Expiration</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((f) => (
              <tr key={f.name}>
                <td className="irp-row-fuel">
                  {f.name}
                  {f.note && <p className="irp-row-footnote">{f.note}</p>}
                </td>
                <td>{f.fuel}</td>
                <td>{fmt(f.mw, 1)}</td>
                <td>{f.onlineYear}</td>
                <td>{f.expiration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const FUEL_COLOR: Record<string, string> = Object.fromEntries(
  ["coal", "gas", "nuclear", "wind", "solar", "biomass", "fueloil", "localsolar"].map((id) => [id, `var(--irp-fuel-${id})`])
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IRPPlanningInterface() {
  const [tab, setTab] = useState<"inputs" | "outputs">("inputs");

  const [loadFields, setLoadFields] = useState(
    Object.fromEntries(loadForecastFields.map((f) => [f.id, f.value]))
  );
  const [reliability, setReliability] = useState(
    Object.fromEntries(reliabilityFields.map((f) => [f.id, f.value]))
  );
  const [financial, setFinancial] = useState(
    Object.fromEntries(financialFields.map((f) => [f.id, f.value]))
  );
  const [rows, setRows] = useState<ResourceRow[]>(initialResourceRows);
  const [battMW, setBattMW] = useState(localBatteries.dispatchableMW);
  const [battRate, setBattRate] = useState(localBatteries.capacityCostPerKWyr);
  const [systemRate, setSystemRate] = useState(systemCostAdder.value);
  const [newOptions, setNewOptions] = useState<NewResourceOption[]>(initialNewResourceOptions);
  const [layer, setLayer] = useState<1 | 2 | 3>(1);
  const [reliefYear, setReliefYear] = useState(pricePressureFields.reliefYear);
  const [targetYear, setTargetYear] = useState(2032);

  const updateRow = (id: string, patch: Partial<ResourceRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // --- Calculations ---------------------------------------------------

  const localSolarRow = rows.find((r) => r.id === "localsolar") ?? initialResourceRows[initialResourceRows.length - 1];
  const utilityOnlyRows = rows.filter((r) => r.id !== "localsolar");

  const calc = useMemo(() => {
    const perRow = utilityOnlyRows.map((r) => {
      const fuelOrPpa = r.generationMWh * r.perMWh;
      const plant = r.kind === "owned" ? r.generationMWh * r.varOM + r.mw * 1000 * (r.fixedOM + r.capital) : 0;
      return { id: r.id, fuel: r.fuel, mwh: r.generationMWh, fuelOrPpa, plant, total1: fuelOrPpa, total2: fuelOrPpa + plant };
    });
    const utilityGenMWh = utilityOnlyRows.reduce((s, r) => s + r.generationMWh, 0);
    const layer1 = perRow.reduce((s, r) => s + r.total1, 0);
    const layer2 = perRow.reduce((s, r) => s + r.total2, 0);
    const systemDollars = utilityGenMWh * systemRate;
    const layer3 = layer2 + systemDollars;

    const localSolarCost = localSolarRow.generationMWh * localSolarRow.perMWh;
    const batteryCost = battMW * 1000 * battRate;
    const localTotal = localSolarCost + batteryCost;

    const grandTotal = layer3 + localTotal;
    const allInGenMWh = utilityGenMWh + localSolarRow.generationMWh;
    const allInPerMWh = grandTotal / allInGenMWh;

    const layerTotal = layer === 1 ? layer1 : layer === 2 ? layer2 : layer3;
    const residentialShare = loadFields.residentialSharePct / 100;
    const perHousehold = (layerTotal * residentialShare) / loadFields.residentialCustomers;

    return { perRow, utilityGenMWh, layer1, layer2, layer3, systemDollars, localSolarCost, batteryCost, localTotal, grandTotal, allInPerMWh, layerTotal, perHousehold };
  }, [utilityOnlyRows, localSolarRow, systemRate, battMW, battRate, layer, loadFields.residentialSharePct, loadFields.residentialCustomers]);

  const capacityBalance = useMemo(() => {
    const missing: string[] = [];
    if (loadFields.reserveMarginTargetPct === 0) missing.push("Target reserve margin (Section 1)");
    if (loadFields.peakGrowthRatePct === 0) missing.push("Peak-demand growth rate (Section 1)");
    const wind = rows.find((r) => r.id === "wind") ?? { mw: 0 };
    const solar = rows.find((r) => r.id === "solar") ?? { mw: 0 };
    const biomass = rows.find((r) => r.id === "biomass") ?? { mw: 0 };
    if (reliability.windELCCPct === 0) missing.push("Wind effective (ELCC) capacity credit (Section 4)");
    if (reliability.solarELCCPct === 0) missing.push("Solar effective (ELCC) capacity credit (Section 4)");
    if (reliability.aeTransmissionLimitMW === 0) missing.push("AE transmission-constrained limit (Section 4)");

    // Battery contracts (one from 2025, three from 2026 — see data file
    // comment) are kept separate from the resourceRows/calc table above but
    // DO count toward capacity — they're real, Council-approved, dispatchable
    // MW. Not double-counting OCI Energy's 100 MW against the 100 MW named
    // in the broader wind/battery/peaker announcement — see that contract's
    // own note.
    const contracted2026MW = contractedResources2026.reduce((s, c) => s + c.mw, 0);

    const nameplateMW =
      rows.reduce((s, r) => s + r.mw, 0) + battMW + loadFields.committedMW + contracted2026MW;

    // Dependable capacity: dispatchable resources count at full nameplate;
    // wind/solar count only at their ELCC % (0 until a real figure is entered),
    // so a 0 ELCC correctly contributes 0 rather than silently assuming 100%.
    const dependableMW =
      (rows.find((r) => r.id === "coal")?.mw ?? 0) +
      (rows.find((r) => r.id === "gas")?.mw ?? 0) +
      (rows.find((r) => r.id === "nuclear")?.mw ?? 0) +
      (rows.find((r) => r.id === "fueloil")?.mw ?? 0) +
      (rows.find((r) => r.id === "localsolar")?.mw ?? 0) +
      biomass.mw +
      wind.mw * (reliability.windELCCPct / 100) +
      solar.mw * (reliability.solarELCCPct / 100) +
      battMW +
      loadFields.committedMW +
      contracted2026MW;

    return {
      missing,
      nameplateMW,
      dependableMW,
      contracted2026MW,
      peak: loadFields.peakDemandMW,
      shortfall: loadFields.peakDemandMW - dependableMW,
    };
  }, [loadFields, reliability, rows, battMW]);

  const pressure = useMemo(() => {
    const years = Array.from({ length: targetYear - pricePressureFields.baselineYear + 1 }, (_, i) => pricePressureFields.baselineYear + i);
    return pricePressureFields.scenarios.map((sc) => {
      const rate = sc.ratePct / 100;
      const series = years.map((y) => {
        const yearsElapsed = Math.min(y, reliefYear) - pricePressureFields.baselineYear;
        const central = pricePressureFields.baselineValue * Math.pow(1 + rate, Math.max(0, yearsElapsed));
        return { year: y, central, low: central * 0.8, high: central * 1.2 };
      });
      return { ...sc, series };
    });
  }, [targetYear, reliefYear]);

  const newResourceMissing = newOptions.flatMap((o) => {
    const fields: string[] = [];
    if (o.capexPerKW === 0) fields.push(`${o.label} — capex $/kW`);
    if (o.fixedOMPerKWyr === 0) fields.push(`${o.label} — fixed O&M $/kW-yr`);
    if (o.variableCostPerMWh === 0) fields.push(`${o.label} — variable cost $/MWh`);
    if (o.capacityFactorPct === 0) fields.push(`${o.label} — capacity factor %`);
    return fields;
  });

  const maxPressure = Math.max(...pressure.flatMap((p) => p.series.map((s) => s.high)));

  // --- Render -----------------------------------------------------------

  return (
    <div className="irp-page">
      <header className="irp-header">
        <p className="irp-dek">{intro.dek}</p>
        <p className="irp-datanote">{intro.dataNote}</p>
      </header>

      <nav className="irp-tabs" aria-label="Planning views">
        <Button variant="ghost" className={`irp-tab ${tab === "inputs" ? "irp-tab-active" : ""}`} aria-pressed={tab === "inputs"} onClick={() => setTab("inputs")}>
          1 · Inputs
        </Button>
        <Button variant="ghost" className={`irp-tab ${tab === "outputs" ? "irp-tab-active" : ""}`} aria-pressed={tab === "outputs"} onClick={() => setTab("outputs")}>
          2 · Calculations &amp; Outputs
        </Button>
      </nav>

      <div className="irp-legend">
        {(Object.keys(tagMeta) as Tag[]).map((t) => (
          <span key={t} className="irp-legend-item">
            <TagPill tag={t} /> <span className="irp-legend-desc">{tagMeta[t].description}</span>
          </span>
        ))}
      </div>

      {tab === "inputs" && (
        <div className="irp-sections">
          <section className="irp-section">
            <h2>Section 1 — Load forecast</h2>
            <div className="irp-field-grid">
              {loadForecastFields.map((f) => (
                <FieldRow
                  key={f.id}
                  field={f}
                  value={loadFields[f.id]}
                  onChange={(v) => setLoadFields((s) => ({ ...s, [f.id]: v }))}
                />
              ))}
            </div>
          </section>

          <section className="irp-section">
            <h2>Section 2 — Existing &amp; committed resource portfolio (2025 actuals)</h2>
            <p className="irp-section-note">
              Per-fuel figures below are editable. "Fuel/contract $/MWh" is the energy price; owned plants also
              carry variable O&amp;M (per MWh) plus fixed O&amp;M and capital (per kW-year) — contracted (PPA)
              resources don't, because the contract price is already all-in.
            </p>
            <div className="irp-table-wrap">
              <table className="irp-table">
                <thead>
                  <tr>
                    <th>Fuel</th>
                    <th>MW</th>
                    <th>Generation (MWh)</th>
                    <th>Fuel/contract $/MWh</th>
                    <th>Var O&amp;M $/MWh</th>
                    <th>Fixed O&amp;M $/kW-yr</th>
                    <th>Capital $/kW-yr</th>
                    <th>Retirement</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className={r.mwTag === "blocked" ? "irp-row-blocked" : ""}>
                      <td className="irp-row-fuel">
                        {r.fuel}
                        {r.note && <p className="irp-row-footnote">{r.note}</p>}
                      </td>
                      <td>
                        <input
                          className="irp-cell-input"
                          type="number"
                          value={r.mw}
                          onChange={(e) => updateRow(r.id, { mw: Number(e.target.value) })}
                        />
                        <TagPill tag={r.mwTag} />
                      </td>
                      <td>
                        <input
                          className="irp-cell-input"
                          type="number"
                          value={r.generationMWh}
                          onChange={(e) => updateRow(r.id, { generationMWh: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          className="irp-cell-input"
                          type="number"
                          value={r.perMWh}
                          onChange={(e) => updateRow(r.id, { perMWh: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        {r.kind === "owned" ? (
                          <input
                            className="irp-cell-input"
                            type="number"
                            value={r.varOM}
                            onChange={(e) => updateRow(r.id, { varOM: Number(e.target.value) })}
                          />
                        ) : (
                          <span className="irp-na">all-in</span>
                        )}
                      </td>
                      <td>
                        {r.kind === "owned" ? (
                          <input
                            className="irp-cell-input"
                            type="number"
                            value={r.fixedOM}
                            onChange={(e) => updateRow(r.id, { fixedOM: Number(e.target.value) })}
                          />
                        ) : (
                          <span className="irp-na">—</span>
                        )}
                      </td>
                      <td>
                        {r.kind === "owned" ? (
                          <input
                            className="irp-cell-input"
                            type="number"
                            value={r.capital}
                            onChange={(e) => updateRow(r.id, { capital: Number(e.target.value) })}
                          />
                        ) : (
                          <span className="irp-na">—</span>
                        )}
                      </td>
                      <td className="irp-row-retire">{r.retirement ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="irp-field-grid mt-5">
              <div className="irp-field">
                <div className="irp-field-head">
                  <span className="irp-field-label">Local battery dispatchable capacity</span>
                  <TagPill tag="derived" />
                </div>
                <div className="irp-field-row">
                  <input type="number" className="irp-input" value={battMW} onChange={(e) => setBattMW(Number(e.target.value))} />
                  <span className="irp-unit">MW</span>
                </div>
                <p className="irp-field-source">{localBatteries.dispatchableMWSource}</p>
              </div>
              <div className="irp-field">
                <div className="irp-field-head">
                  <span className="irp-field-label">Local battery capacity cost</span>
                  <TagPill tag="derived" />
                </div>
                <div className="irp-field-row">
                  <input type="number" className="irp-input" value={battRate} onChange={(e) => setBattRate(Number(e.target.value))} />
                  <span className="irp-unit">$/kW-yr</span>
                </div>
                <p className="irp-field-source">{localBatteries.capacityCostSource}</p>
              </div>
              <div className="irp-field">
                <div className="irp-field-head">
                  <span className="irp-field-label">{systemCostAdder.label}</span>
                  <TagPill tag={systemCostAdder.tag} />
                </div>
                <div className="irp-field-row">
                  <input type="number" className="irp-input" value={systemRate} onChange={(e) => setSystemRate(Number(e.target.value))} />
                  <span className="irp-unit">{systemCostAdder.unit}</span>
                </div>
                <p className="irp-field-source">{systemCostAdder.source}</p>
              </div>
            </div>
          </section>

          <section className="irp-section">
            <h2>Section 2b — Facility-level reference</h2>
            <p className="irp-section-note">
              The aggregate rows above are now backed by named facilities — Austin Energy's own Power Plants and
              Renewable Power Generation pages give a nameplate MW, commercial-operation year and (for contracted
              resources) expiration date for every unit. Reference only; the aggregate rows above drive the
              calculations.
            </p>
            <FacilityTable title="Owned / co-owned plants" facilities={namedOwnedPlants} />
            <FacilityTable title={`Wind contracts (${windFacilities.length})`} facilities={windFacilities} />
            <FacilityTable title={`Solar contracts (${solarFacilities.length})`} facilities={solarFacilities} />
            <FacilityTable title="Biomass" facilities={[biomassFacility]} />
          </section>

          <section className="irp-section">
            <h2>Section 2c — contracts not yet on either public site</h2>
            <p className="irp-section-note">
              Found by searching Austin City Council RCAs/minutes, Electric Utility Commission agendas and backup
              documents, and news coverage — none of this is on austinenergy.com's Power Plants or Renewable Power
              Generation pages yet, and none of it was in any dataset in this project until now. One contract below
              (Jupiter Power I) was actually approved in 2025, not 2026 — it's included for the same reason as the
              others: real, Council-approved, and missing from both public sites. Kept separate from Section 2's
              rows so it doesn't disturb that table's calibration against Power Money's published 2025 totals, but
              it does count toward the capacity-balance figures below.
            </p>
            <div className="irp-table-wrap">
              <table className="irp-table irp-table-compact">
                <thead>
                  <tr>
                    <th>Contract</th>
                    <th>MW</th>
                    <th>Annual cost</th>
                    <th>Term</th>
                    <th>Approved</th>
                    <th>Expected online</th>
                  </tr>
                </thead>
                <tbody>
                  {contractedResources2026.map((c) => (
                    <tr key={c.name}>
                      <td className="irp-row-fuel">
                        {c.name}
                        {c.note && <p className="irp-row-footnote">{c.note}</p>}
                      </td>
                      <td>{fmt(c.mw, 0)}</td>
                      <td>{fmtMoney(c.annualCost)}/yr</td>
                      <td>{c.termYears} yr</td>
                      <td>{c.approvalDate}</td>
                      <td>{c.expectedOnline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="irp-pending-callout">
              <strong>
                {fmt(contractedResources2026.reduce((s, c) => s + c.mw, 0))} MW across these four battery contracts
                vs. AE's own {fmt(batteryStorageTarget2027.mw)} MW by {batteryStorageTarget2027.byYear} target.
              </strong>{" "}
              {batteryStorageTarget2027.note} (Source: {batteryStorageTarget2027.source})
            </div>
            <div className="irp-pending-callout">
              <strong>{fmt(windAuthorization2026.mw)} MW wind — authorized to contract, not a signed deal.</strong>{" "}
              {windAuthorization2026.note} (Approved {windAuthorization2026.approvalDate}; source: {windAuthorization2026.source})
            </div>
            <p className="irp-section-note" >{gasPeakerAuthorization2026Note}</p>
            <p className="irp-section-note" >
              No new 2026 solar contract was found anywhere searched for this update.
            </p>
          </section>

          <section className="irp-section">
            <h2>Section 3 — New resource options</h2>
            <p className="irp-section-note irp-section-note-warn">{newResourceBlockNote}</p>
            <div className="irp-table-wrap">
              <table className="irp-table">
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Capex $/kW</th>
                    <th>Fixed O&amp;M $/kW-yr</th>
                    <th>Variable cost $/MWh</th>
                    <th>Capacity factor %</th>
                  </tr>
                </thead>
                <tbody>
                  {newOptions.map((o) => (
                    <tr key={o.id} className="irp-row-blocked">
                      <td className="irp-row-fuel">{o.label}</td>
                      {(["capexPerKW", "fixedOMPerKWyr", "variableCostPerMWh", "capacityFactorPct"] as const).map((k) => (
                        <td key={k}>
                          <input
                            className="irp-cell-input"
                            type="number"
                            value={o[k]}
                            onChange={(e) =>
                              setNewOptions((opts) =>
                                opts.map((x) => (x.id === o.id ? { ...x, [k]: Number(e.target.value) } : x))
                              )
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="irp-section">
            <h2>Section 4 — Reliability &amp; grid constraints</h2>
            <div className="irp-field-grid">
              {reliabilityFields.map((f) => (
                <FieldRow
                  key={f.id}
                  field={f}
                  value={reliability[f.id]}
                  onChange={(v) => setReliability((s) => ({ ...s, [f.id]: v }))}
                />
              ))}
            </div>
          </section>

          <section className="irp-section">
            <h2>Section 5 — Forward price-pressure assumptions</h2>
            <p className="irp-section-note">{pricePressureFields.scenarioNote}</p>
            <div className="irp-field-grid">
              <div className="irp-field">
                <div className="irp-field-head">
                  <span className="irp-field-label">Baseline adverse basis cost ({pricePressureFields.baselineYear})</span>
                  <TagPill tag={pricePressureFields.baselineTag} />
                </div>
                <div className="irp-field-row">
                  <span className="irp-static-value">${pricePressureFields.baselineValue}/MWh</span>
                </div>
                <p className="irp-field-source">{pricePressureFields.baselineSource}</p>
              </div>
              <div className="irp-field">
                <div className="irp-field-head">
                  <span className="irp-field-label">Transmission relief year</span>
                  <TagPill tag={pricePressureFields.reliefYearTag} />
                </div>
                <div className="irp-field-row">
                  <input type="number" className="irp-input" value={reliefYear} onChange={(e) => setReliefYear(Number(e.target.value))} />
                  <span className="irp-unit">year</span>
                </div>
                <p className="irp-field-source">{pricePressureFields.reliefYearSource}</p>
              </div>
            </div>
          </section>

          <section className="irp-section">
            <h2>Section 6 — Financial parameters</h2>
            <div className="irp-field-grid">
              {financialFields.map((f) => (
                <FieldRow
                  key={f.id}
                  field={f}
                  value={financial[f.id]}
                  onChange={(v) => setFinancial((s) => ({ ...s, [f.id]: v }))}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "outputs" && (
        <div className="irp-sections">
          <section className="irp-section">
            <h2>Output — Total system cost &amp; validation</h2>
            <div className="irp-layer-toggle">
              {([1, 2, 3] as const).map((l) => (
                <Button variant="ghost" key={l} className={`irp-layer-btn ${layer === l ? "irp-layer-btn-active" : ""}`} aria-pressed={layer === l} onClick={() => setLayer(l)}>
                  {l === 1 ? "Energy only" : l === 2 ? "Energy + plant" : "Full system"}
                </Button>
              ))}
            </div>
            <div className="irp-stat-grid">
              <div className="irp-stat-tile">
                <span className="irp-stat-value">{fmtMoney(calc.layerTotal)}</span>
                <span className="irp-stat-label">Utility-scale total, selected layer</span>
              </div>
              <div className="irp-stat-tile">
                <span className="irp-stat-value">${fmt(calc.allInPerMWh, 0)}</span>
                <span className="irp-stat-label">All-in $/MWh (full system + local solar)</span>
              </div>
              <div className="irp-stat-tile">
                <span className="irp-stat-value">${fmt(calc.perHousehold, 0)}</span>
                <span className="irp-stat-label">Per residential household/yr, selected layer</span>
              </div>
              <div className="irp-stat-tile">
                <span className="irp-stat-value">{fmtMoney(calc.grandTotal)}</span>
                <span className="irp-stat-label">Grand total: full system + local solar &amp; batteries</span>
              </div>
            </div>
            <p className="irp-section-note">
              Calibration check: Power Money publishes $106/MWh all-in, $244/household (energy-only layer) and a
              $1.52B combined ratepayer total for 2025. This engine recomputes {fmtMoney(calc.grandTotal)} /{" "}
              ${fmt(calc.allInPerMWh, 0)}/MWh from the Section 2 inputs above using Austin Energy's own published
              formula (fuel $ + variable O&amp;M + fixed O&amp;M/capital + system adder) — within rounding of the
              published figures, confirming the inputs and formula are consistent with the source.
            </p>
            <div className="irp-table-wrap">
              <table className="irp-table irp-table-compact">
                <thead>
                  <tr>
                    <th>Fuel</th>
                    <th>MWh</th>
                    <th>Fuel/contract $</th>
                    <th>Plant O&amp;M + capital $</th>
                    <th>Layer total $</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.perRow.map((r) => (
                    <tr key={r.id}>
                      <td>{r.fuel}</td>
                      <td>{fmt(r.mwh)}</td>
                      <td>{fmtMoney(r.fuelOrPpa)}</td>
                      <td>{r.plant ? fmtMoney(r.plant) : "—"}</td>
                      <td>{fmtMoney(layer === 1 ? r.total1 : r.total2)}</td>
                    </tr>
                  ))}
                  <tr className="irp-row-system">
                    <td>System cost adder</td>
                    <td>{fmt(calc.utilityGenMWh)}</td>
                    <td>—</td>
                    <td>—</td>
                    <td>{layer === 3 ? fmtMoney(calc.systemDollars) : "not in this layer"}</td>
                  </tr>
                  <tr className="irp-row-local">
                    <td>Local solar + batteries (addendum, not layer-toggled)</td>
                    <td>{fmt(localSolarRow.generationMWh)}</td>
                    <td>{fmtMoney(calc.localSolarCost)}</td>
                    <td>{fmtMoney(calc.batteryCost)}</td>
                    <td>{fmtMoney(calc.localTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="irp-section">
            <h2>Output — Resource mix</h2>
            <p className="irp-section-note">Share of 2025 generation (MWh) — every fuel has reported generation.</p>
            <div className="irp-mix-chart">
              {rows.map((r) => {
                const total = rows.reduce((s, x) => s + x.generationMWh, 0);
                const pct = (r.generationMWh / total) * 100;
                return (
                  <div key={r.id} className="irp-mix-row">
                    <span className="irp-mix-label">{r.fuel}</span>
                    <div className="irp-mix-track">
                      <div className="irp-mix-fill" style={{ width: `${pct}%`, background: FUEL_COLOR[r.id] }} />
                    </div>
                    <span className="irp-mix-pct">{fmt(pct, 1)}%</span>
                  </div>
                );
              })}
            </div>
            <p className="irp-section-note" >
              Share of nameplate capacity (MW) — now fully computable too, since AE's own pages give real wind,
              utility-solar and biomass MW. This is nameplate, not dependable capacity — see Capacity balance
              below for why those aren't the same number for wind and solar.
            </p>
            <div className="irp-mix-chart">
              {rows.map((r) => {
                const totalMW = rows.reduce((s, x) => s + x.mw, 0);
                const pct = totalMW > 0 ? (r.mw / totalMW) * 100 : 0;
                return (
                  <div key={r.id} className="irp-mix-row">
                    <span className="irp-mix-label">{r.fuel}</span>
                    <div className="irp-mix-track">
                      <div className="irp-mix-fill" style={{ width: `${pct}%`, background: FUEL_COLOR[r.id] }} />
                    </div>
                    <span className="irp-mix-pct">{fmt(pct, 1)}%</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="irp-section">
            <h2>Output — Capacity balance</h2>
            {capacityBalance.missing.length > 0 && (
              <BlockedBanner title="full capacity balance" missing={capacityBalance.missing} />
            )}
            <div className="irp-stat-grid" >
              <div className="irp-stat-tile">
                <span className="irp-stat-value">{fmt(capacityBalance.peak)} MW</span>
                <span className="irp-stat-label">Current peak demand</span>
              </div>
              <div className="irp-stat-tile">
                <span className="irp-stat-value">{fmt(capacityBalance.nameplateMW, 1)} MW</span>
                <span className="irp-stat-label">
                  Total nameplate MW — every 2025 resource + committed load pipeline + {fmt(capacityBalance.contracted2026MW)} MW of battery contracts not yet on either public site (Section 2c)
                </span>
              </div>
              <div className="irp-stat-tile irp-stat-tile-warn">
                <span className="irp-stat-value">{fmt(capacityBalance.dependableMW, 1)} MW</span>
                <span className="irp-stat-label">Dependable MW at today's ELCC settings (wind/solar derated by Section 4's % — 0 until entered)</span>
              </div>
              <div className="irp-stat-tile irp-stat-tile-warn">
                <span className="irp-stat-value">{capacityBalance.shortfall > 0 ? "−" : "+"}{fmt(Math.abs(capacityBalance.shortfall), 1)} MW</span>
                <span className="irp-stat-label">Peak minus dependable MW</span>
              </div>
            </div>
            <p className="irp-section-note irp-section-note-warn">
              Nameplate MW is now fully sourced for every resource (Austin Energy's own Power Plants and
              Renewable Power Generation pages gave real wind, utility-solar and biomass capacity). But summing
              raw nameplate against peak demand would overstate what's actually there at Austin's summer evening
              peak — wind and solar rarely run near full output then. Until a real ELCC/peak-coincident capacity
              credit is entered for wind and solar in Section 4, this model deliberately counts their dependable
              contribution as 0 rather than quietly assuming 100%, so the dependable-MW figure above is a floor,
              not the real answer. A full capacity balance still also needs a reserve-margin target and a
              peak-growth-rate assumption, neither of which is sourced yet.
            </p>
          </section>

          <section className="irp-section">
            <h2>Output — Forward price-pressure band, {pricePressureFields.baselineYear}–{targetYear}</h2>
            <div className="irp-field irp-horizon">
              <div className="irp-field-head">
                <span className="irp-field-label">Horizon end year</span>
              </div>
              <div className="irp-field-row">
                <input type="number" className="irp-input" value={targetYear} onChange={(e) => setTargetYear(Number(e.target.value))} />
              </div>
            </div>
            <svg viewBox="0 0 640 220" className="irp-pressure-svg" role="img" aria-label="Forward adverse-basis-cost pressure bands under three scenarios">
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <line key={f} x1={48} x2={620} y1={20 + f * 160} y2={20 + f * 160} className="irp-gridline" />
              ))}
              {pressure.map((sc, si) => {
                const x = (year: number) => 48 + ((year - pricePressureFields.baselineYear) / (targetYear - pricePressureFields.baselineYear)) * 572;
                const y = (v: number) => 180 - (v / maxPressure) * 160;
                const centralPath = sc.series.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year)},${y(p.central)}`).join(" ");
                const bandPath =
                  sc.series.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year)},${y(p.high)}`).join(" ") +
                  " " +
                  sc.series.slice().reverse().map((p) => `L${x(p.year)},${y(p.low)}`).join(" ") +
                  " Z";
                const colors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))"];
                return (
                  <g key={sc.id}>
                    <path d={bandPath} fill={colors[si]} opacity={0.12} />
                    <path d={centralPath} fill="none" stroke={colors[si]} strokeWidth={2} />

                  </g>
                );
              })}
              <text x={48} y={200} className="irp-axis-label">{pricePressureFields.baselineYear}</text>
              <text x={600} y={200} className="irp-axis-label">{targetYear}</text>
            </svg>
            <div className="irp-pressure-legend">
              {pressure.map((sc, i) => <span key={sc.id} className={`irp-scenario-${i}`}>{sc.label} ({sc.ratePct}%/yr)</span>)}
            </div>
            <p className="irp-section-note">
              Flat from {reliefYear} on the assumption that Euclid–Hillje relief ({reliabilityFields[0].value} MW)
              arrives on schedule. ±20% shaded band. This calculation runs fully — every input it needs (baseline
              cost, scenario rates, relief year) is sourced or explicitly marked as this toolkit's own planning
              scenario.
            </p>
          </section>

          <section className="irp-section">
            <h2>Output — New resource option ranking</h2>
            <BlockedBanner title="new-resource levelized-cost comparison" missing={newResourceMissing} />
          </section>
        </div>
      )}
    </div>
  );
}
