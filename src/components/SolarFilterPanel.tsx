import { useMemo, useState } from "react";
import {
  applySolarFilters,
  filterPanelsByRoofSegmentArea,
  type CommercialFilterResult,
  type SolarPanel,
} from "@/lib/solar-filters";

export interface UseSolarFilterOpts {
  panels?: SolarPanel[];
  propertyType?: string | null;
  azimuths?: Record<number, number>;
  segmentAreas?: Record<number, number | null | undefined>;
}

/**
 * Shared derate model for both the property viewer and the public property page.
 *
 * The derate is always applied — it is the realistic buildable layout, so it drives the
 * system size numbers everywhere. The 75% TSRF cut applies to every property type.
 * Commercial roofs additionally get roof-edge detection: a perimeter setback measured
 * off the traced border, plus walkways routed out from interior HVAC voids.
 */
export function useSolarFilter({ panels, propertyType, azimuths, segmentAreas }: UseSolarFilterOpts) {
  const [showRaw,      setShowRaw]      = useState(false);
  const [showDetected, setShowDetected] = useState(false);

  const isCommercial = propertyType === "commercial";
  const areaFilteredPanels = useMemo(
    () => panels ? filterPanelsByRoofSegmentArea(panels, propertyType, segmentAreas) : panels,
    [panels, propertyType, segmentAreas],
  );

  const result = useMemo<CommercialFilterResult | null>(() => {
    if (!areaFilteredPanels?.length) return null;
    return applySolarFilters(areaFilteredPanels, { propertyType, azimuths });
  }, [areaFilteredPanels, propertyType, azimuths]);

  // Spread straight onto <SatellitePane>. Small commercial surfaces stay hidden even in
  // the raw Google view; "raw" only bypasses the additional setback and TSRF derates.
  const applied = !showRaw;
  const paneProps = {
    panels:        applied ? (result?.panels ?? areaFilteredPanels) : areaFilteredPanels,
    walkwayPanels: applied ? result?.walkwayPanels : undefined,
    debugHoles:    showDetected ? result?.debugHoles   : undefined,
    edgeSegments:  showDetected ? result?.edgeSegments : undefined,
  };

  /** Buildable panel count after the derate; falls back to the area-eligible raw count. */
  const filteredPanelCount = result?.panels.length ?? areaFilteredPanels?.length ?? null;

  return {
    showRaw, setShowRaw,
    showDetected, setShowDetected,
    result, isCommercial, paneProps, filteredPanelCount, areaFilteredPanels,
    available: !!areaFilteredPanels?.length,
  };
}

export type SolarFilterState = ReturnType<typeof useSolarFilter>;

/** Inspection controls. Internal property viewer only — the public page has no toggles. */
export function SolarFilterPanel({
  state,
  capacityW = 400,
  className = "",
}: {
  state: SolarFilterState;
  capacityW?: number | null;
  className?: string;
}) {
  const { showRaw, setShowRaw, showDetected, setShowDetected,
          result, isCommercial, available } = state;

  if (!available) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showRaw}
          onChange={e => setShowRaw(e.target.checked)}
          className="rounded accent-foreground"
        />
        <span className="text-sm text-foreground">Show raw Google data</span>
      </label>

      {isCommercial && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDetected}
            onChange={e => setShowDetected(e.target.checked)}
            className="rounded accent-foreground"
          />
          <span className="text-sm text-foreground">Show detected roof edge and holes</span>
        </label>
      )}

      {result && (
        <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
          {isCommercial && <div>Setback removed: {result.setbackCount}</div>}
          <div>Low TSRF removed: {result.tsrfCount}</div>
          {isCommercial && <div>Walkway cells: {result.walkwayCount}</div>}
          <div className="font-medium text-foreground pt-0.5">
            Buildable: {result.panels.length} panels
            {` · ${((result.panels.length * (capacityW ?? 400)) / 1000).toFixed(1)} kW`}
          </div>
          {showRaw && (
            <div className="italic pt-0.5">Map is showing the raw Google layout.</div>
          )}
        </div>
      )}
    </div>
  );
}
