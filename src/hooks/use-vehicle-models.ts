import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EV_MODELS, GAS_MODELS, type VehicleModel, type GasModel } from "@/data/vehicle-models";

type DbRow = {
  type: string;
  make: string;
  model: string;
  year: number;
  msrp: number | null;
  mi_per_kwh: number | null;
  mpg: number | null;
  range_mi: number | null;
  used_price: number | null;
  discontinued: boolean;
};

function toEvModels(rows: DbRow[]): VehicleModel[] {
  const grouped = new Map<string, DbRow[]>();
  for (const r of rows) {
    const k = `${r.make}|${r.model}`;
    grouped.set(k, [...(grouped.get(k) ?? []), r]);
  }
  return Array.from(grouped.values()).map(yearRows => {
    const sorted = yearRows.slice().sort((a, b) => a.year - b.year);
    const usedPrices: Partial<Record<number, number>> = {};
    const rangeMi: Partial<Record<number, number>> = {};
    for (const r of sorted) {
      if (r.used_price != null) usedPrices[r.year] = r.used_price;
      if (r.range_mi  != null) rangeMi[r.year]     = r.range_mi;
    }
    const msrpRows = sorted.filter(r => r.msrp != null);
    const withMsrp = msrpRows[msrpRows.length - 1]; // most recent row with an MSRP
    const any = sorted[sorted.length - 1];
    return {
      make:       any.make,
      model:      any.model,
      msrp:       withMsrp?.msrp ?? 0,
      miPerKwh:   sorted.find(r => r.mi_per_kwh != null)?.mi_per_kwh ?? 3.0,
      rangeMi,
      usedPrices,
      discontinued: any.discontinued,
    } satisfies VehicleModel;
  });
}

function toGasModels(rows: DbRow[]): GasModel[] {
  const grouped = new Map<string, DbRow[]>();
  for (const r of rows) {
    const k = `${r.make}|${r.model}`;
    grouped.set(k, [...(grouped.get(k) ?? []), r]);
  }
  return Array.from(grouped.values()).map(yearRows => {
    const sorted = yearRows.slice().sort((a, b) => a.year - b.year);
    const usedPrices: Partial<Record<number, number>> = {};
    for (const r of sorted) {
      if (r.used_price != null) usedPrices[r.year] = r.used_price;
    }
    const msrpRows = sorted.filter(r => r.msrp != null);
    const withMsrp = msrpRows[msrpRows.length - 1];
    const any = sorted[sorted.length - 1];
    return {
      make:        any.make,
      model:       any.model,
      msrp:        withMsrp?.msrp ?? 0,
      mpg:         sorted.find(r => r.mpg != null)?.mpg ?? 25,
      usedPrices,
      discontinued: any.discontinued,
    } satisfies GasModel;
  });
}

export function useVehicleModels() {
  const [evModels,  setEvModels]  = useState<VehicleModel[]>(EV_MODELS);
  const [gasModels, setGasModels] = useState<GasModel[]>(GAS_MODELS);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("vehicle_models")
      .select("type, make, model, year, msrp, mi_per_kwh, mpg, range_mi, used_price, discontinued")
      .order("make").order("model").order("year")
      .then(({ data, error }: { data: DbRow[] | null; error: unknown }) => {
        if (error || !data) { setLoading(false); return; }
        setEvModels(toEvModels(data.filter(r => r.type === "ev")));
        setGasModels(toGasModels(data.filter(r => r.type === "gas")));
        setLoading(false);
      });
  }, []);

  return { evModels, gasModels, loading };
}
