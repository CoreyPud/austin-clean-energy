import type { SolarPanel } from "@/lib/solar-filters";

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