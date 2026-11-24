import { panelTsrf, type SolarPanel } from "@/lib/solar-filters";

/** Same contiguous, high-sunlight priority for map colors and roof selection sizing. */
export function orderedLayoutPanels(panels: SolarPanel[], preferredSegments: number[] = []): SolarPanel[] {
  if (preferredSegments.length) {
    const preferred = new Set(preferredSegments);
    return [
      ...preferredSegments.flatMap(segment => orderedLayoutPanels(panels.filter(p => p.segmentIndex === segment))),
      ...orderedLayoutPanels(panels.filter(p => !preferred.has(p.segmentIndex))),
    ];
  }
  const high = panels.filter(p => panelTsrf(p.yearlyEnergyDcKwh) >= 0.8);
  const low = panels.filter(p => panelTsrf(p.yearlyEnergyDcKwh) < 0.8)
    .sort((a, b) => b.yearlyEnergyDcKwh - a.yearlyEnergyDcKwh);
  if (!high.length) return low;
  const remaining = new Set(high.map((_, i) => i));
  const distances = new Float64Array(high.length).fill(Infinity);
  const ordered: SolarPanel[] = [];
  let next = high.reduce((best, p, i) => p.lat > high[best].lat || (p.lat === high[best].lat && p.lon < high[best].lon) ? i : best, 0);
  while (remaining.size) {
    const panel = high[next];
    ordered.push(panel);
    remaining.delete(next);
    let nearest = -1, distance = Infinity;
    for (const i of remaining) {
      const candidate = high[i];
      distances[i] = Math.min(distances[i], (candidate.lat - panel.lat) ** 2 + (candidate.lon - panel.lon) ** 2);
      if (distances[i] < distance) { nearest = i; distance = distances[i]; }
    }
    if (nearest < 0) break;
    next = nearest;
  }
  return [...ordered, ...low];
}

export function activeRoofPanelCounts(orderedPanels: SolarPanel[], systemKw: number, panelWatts: number): Record<number, number> {
  const counts: Record<number, number> = {};
  if (!(panelWatts > 0)) return counts;
  const selected = Math.max(0, Math.round(systemKw * 1000 / panelWatts));
  for (const panel of orderedPanels.slice(0, selected)) {
    counts[panel.segmentIndex] = (counts[panel.segmentIndex] ?? 0) + 1;
  }
  return counts;
}

/** Remove only selected panels, or include all available panels on a blue/yellow roof. */
export function roofToggleSystemKw(systemKw: number, activeCount: number, availableCount: number, panelWatts: number): number {
  return Math.max(0, Math.round((systemKw + (activeCount > 0 ? -activeCount : availableCount) * panelWatts / 1000) * 1000) / 1000);
}

export interface BlockedArea {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface AddedRoofPayload {
  panels: SolarPanel[];
  roofSegments: { segmentIndex: number; azimuthDeg: number; pitchDeg: number; areaM2?: number | null }[];
}

const DUPLICATE_DEG_TOL = 0.000006; // ~0.6 m

export function isPanelInBlockedArea(panel: Pick<SolarPanel, "lat" | "lon">, areas: BlockedArea[]): boolean {
  return areas.some(
    (box) =>
      panel.lat >= box.minLat &&
      panel.lat <= box.maxLat &&
      panel.lon >= box.minLon &&
      panel.lon <= box.maxLon,
  );
}

export function filterBlockedPanels(panels: SolarPanel[], areas: BlockedArea[]): SolarPanel[] {
  if (!areas.length) return panels;
  return panels.filter((panel) => !isPanelInBlockedArea(panel, areas));
}

/** Merge an additional Google Solar building onto an existing roof layout without segment collisions
 *  or duplicate panels when the user clicks an already-loaded roof. */
export function mergeAddedRoof(
  existingPanels: SolarPanel[],
  existingAzimuths: Record<number, number>,
  existingPitches: Record<number, number>,
  existingAreas: Record<number, number>,
  added: AddedRoofPayload,
): {
  panels: SolarPanel[];
  azimuths: Record<number, number>;
  pitches: Record<number, number>;
  segmentAreas: Record<number, number>;
  addedCount: number;
} {
  const segKeys = [
    ...existingPanels.map((p) => p.segmentIndex),
    ...Object.keys(existingAzimuths).map(Number),
  ];
  const offset = segKeys.length ? Math.max(...segKeys) + 1 : 0;

  const isDuplicate = (candidate: SolarPanel) =>
    existingPanels.some(
      (p) =>
        Math.abs(p.lat - candidate.lat) < DUPLICATE_DEG_TOL &&
        Math.abs(p.lon - candidate.lon) < DUPLICATE_DEG_TOL,
    );

  const newPanels: SolarPanel[] = [];
  for (const panel of added.panels) {
    if (isDuplicate(panel)) continue;
    newPanels.push({ ...panel, segmentIndex: panel.segmentIndex + offset });
  }

  const azimuths = { ...existingAzimuths };
  const pitches = { ...existingPitches };
  const segmentAreas = { ...existingAreas };

  if (newPanels.length > 0) {
    for (const seg of added.roofSegments) {
      const idx = seg.segmentIndex + offset;
      azimuths[idx] = seg.azimuthDeg;
      pitches[idx] = seg.pitchDeg;
      if (typeof seg.areaM2 === "number") segmentAreas[idx] = seg.areaM2;
    }
  }

  return {
    panels: newPanels.length ? [...existingPanels, ...newPanels] : existingPanels,
    azimuths,
    pitches,
    segmentAreas,
    addedCount: newPanels.length,
  };
}