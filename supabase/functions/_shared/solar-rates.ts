// Single source for the Austin solar economics constants shared by the app (via
// src/lib/solar-model.ts), the Deno edge functions, and the Node scripts. Lives under
// supabase/functions/_shared/ for the same reason solar-filters.ts does: Deno can import it
// directly and the app can re-export it, so the two can't drift. Keep this file import-free.

/** Austin Energy Value of Solar bill credit, $/kWh, applied to all production. */
export const VOS_RATE = 0.1288;

/** Austin Energy residential solar rebate: flat $, for systems at or above the minimum size.
 *  Raised from $2,500 to $4,000 on July 1, 2026 (AE "for your home" page, reviewed 07/01/2026). */
export const AUSTIN_ENERGY_SOLAR_REBATE = 4000;
export const AUSTIN_ENERGY_SOLAR_REBATE_MIN_KW = 3; // kW DC, inclusive

/** Berkeley Lab 2024 Austin residential installed cost, $/kW DC. */
export const AUSTIN_INSTALL_COST_PER_KW = 2950;

/** NREL PVWatts default performance ratio: inverter, wiring, soiling, and temperature losses
 *  applied on top of Google's geometry- and shading-adjusted sunshine hours. */
export const SYSTEM_DERATE = 0.86;

/** Austin average production, kWh per kW-year, when no roof-specific data is available. */
export const DEFAULT_PRODUCTION_PER_KW = 1500;

/** Grid CO2 intensity for Austin (ERCOT), kg per MWh, used when Google's per-property factor
 *  isn't available (e.g. a cached lookup, which doesn't store it). Google Solar API's
 *  carbonOffsetFactorKgPerMwh returned 639 at all five addresses sampled on 2026-09-26
 *  (78660, 78705, 78745, 78758, 78723): it's a grid-level figure, not per-roof. */
export const CO2_FALLBACK_KG_PER_MWH = 639;

/** Panel output loss per year: NREL's median degradation for modern crystalline-silicon
 *  modules, matching typical 25-year warranties (~87% of nameplate at year 25). */
export const PANEL_DEGRADATION_RATE = 0.005;
