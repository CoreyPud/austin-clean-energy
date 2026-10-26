/**
 * Commercial property improvement recommendations. Rebate rates come from Austin Energy's
 * commercial Property Improvements page (last reviewed 02/18/2026):
 * https://austinenergy.com/energy-efficiency/rebates-incentives/commercial/property-improvements
 */

export const AE_COMMERCIAL_REBATES = {
  insulationPerSqFt: 1.0,
  reflectiveRoofPerSqFt: 0.25,
  windowMaxPerSqFt: 2.25,
};

const BASE = "https://austinenergy.com/energy-efficiency/rebates-incentives/commercial/property-improvements";

export interface CommercialPlanData {
  role: "owner" | "tenant" | "manager";
  roofType: "flat" | "pitched" | "unsure";
  insulation: "poor" | "ok" | "unsure";
  roofSurface: "dark" | "reflective" | "unsure";
  windows: "single" | "unshaded" | "efficient" | "unsure";
  roofSqFt?: number;
  windowSqFt?: number;
}

const $ = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function buildCommercialCards(d: CommercialPlanData) {
  const cards: any[] = [];
  const tenantNote = d.role === "tenant" ? "As a tenant, you'll need the property owner's approval — share this with them." : null;

  if (d.insulation !== "ok") {
    const est = d.roofSqFt ? d.roofSqFt * AE_COMMERCIAL_REBATES.insulationPerSqFt : null;
    cards.push({
      id: "insulation", impact: "high", category: "Building Envelope", icon: "Wrench",
      title: "Add ceiling or roof insulation",
      summary: `Austin Energy rebates $1.00 per square foot of ceiling or roof insulation installed${est ? ` — about ${$(est)} for ${d.roofSqFt!.toLocaleString()} sq ft` : ""}.`,
      bullets: ["Cuts heat gain, so AC runs less in Austin summers", ...(tenantNote ? [tenantNote] : [])],
      cta: { label: "Insulation rebate details", url: `${BASE}/insulation` },
    });
  }

  if (d.roofSurface !== "reflective" && d.roofType !== "pitched") {
    const est = d.roofSqFt ? d.roofSqFt * AE_COMMERCIAL_REBATES.reflectiveRoofPerSqFt : null;
    cards.push({
      id: "roof", impact: d.roofSurface === "dark" ? "high" : "medium", category: "Roof", icon: "Sun",
      title: "Apply a reflective roof coating",
      summary: `Spray-on or paint-on reflective coatings keep heat out. Austin Energy rebates $0.25 per square foot applied${est ? ` — about ${$(est)} for ${d.roofSqFt!.toLocaleString()} sq ft` : ""}.`,
      bullets: ["Best suited to flat or low-slope commercial roofs", ...(tenantNote ? [tenantNote] : [])],
      cta: { label: "Reflective roof rebate details", url: `${BASE}/reflective-roof` },
    });
  }

  if (d.windows !== "efficient") {
    const est = d.windowSqFt ? d.windowSqFt * AE_COMMERCIAL_REBATES.windowMaxPerSqFt : null;
    cards.push({
      id: "windows", impact: d.windows === "single" ? "high" : "medium", category: "Windows", icon: "Zap",
      title: "Treat or replace windows",
      summary: `Solar shading, window film, or efficient windows qualify for up to $2.25 per square foot${est ? ` — up to ${$(est)} for ${d.windowSqFt!.toLocaleString()} sq ft` : ""}.`,
      bullets: ["Window film is usually the lowest-cost option", "Exact rebate depends on the treatment type"],
      cta: { label: "Window rebate details", url: `${BASE}/window` },
    });
  }

  cards.push({
    id: "more", impact: "low", category: "More programs", icon: "Leaf",
    title: "Browse all Austin Energy commercial rebates",
    summary: "Lighting, HVAC, and other commercial programs are listed on Austin Energy's commercial rebates page.",
    bullets: ["Check eligibility and pre-approval rules before starting work"],
    cta: { label: "Commercial rebates & incentives", url: "https://austinenergy.com/energy-efficiency/rebates-incentives" },
  });

  return cards;
}
