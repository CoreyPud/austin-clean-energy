export interface SupplyDemandInputs {
  supplyMw: number;
  demandMw: number;
  annualSupplyChangeMw: number;
  demandGrowthPct: number;
}

// ERCOT October 2026 Fact Sheet: 104,850+ MW expected summer peak-hour
// capacity (December 2025 CDR); 91,155 MW unofficial July 22, 2026 record.
export const supplyDemandSource = "https://www.ercot.com/files/docs/2022/02/08/ERCOT_Fact_Sheet.pdf";
export const supplyDemandDefaults: SupplyDemandInputs = {
  supplyMw: 104850,
  demandMw: 91155,
  annualSupplyChangeMw: 0,
  demandGrowthPct: 0,
};

export function buildSupplyDemandScenario(inputs: SupplyDemandInputs) {
  return Array.from({ length: 19 }, (_, index) => {
    const year = 2027 + index;
    const elapsed = year - 2026;
    const supplyMw = Math.max(0, inputs.supplyMw + inputs.annualSupplyChangeMw * elapsed);
    const demandMw = inputs.demandMw * Math.pow(1 + inputs.demandGrowthPct / 100, elapsed);
    return { year, supplyMw, demandMw, gapMw: supplyMw - demandMw };
  });
}