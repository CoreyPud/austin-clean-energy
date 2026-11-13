/** Retain these aliases so bookmarked and shared public links keep working. */
export const PUBLIC_URL_RENAMES = {
  "/property-assessment": "/solar-savings-austin",
  "/area-analysis": "/solar-savings-austin",
  "/recommendations": "/solar-savings-austin",
  "/solar-suite/bom": "/solar-bom",
  "/solar-suite/draft": "/solar-draft",
  "/solar-suite/flow": "/solar-flow",
  "/gets": "/grid-enhancing-technologies",
  "/kwh-cost": "/austin-electricity-price-arbitrage",
  "/atb-options": "/clean-energy-technology-database",
  "/peaker-proforma": "/gas-peaker-plant-cost-calculator",
  "/peak-shave": "/peak-shaving-calculator",
  "/demand-distribution": "/austin-electricity-demand-map",
  "/import-capacity": "/austin-transmission-capacity-calculator",
  "/power-money": "/austin-energy-generation-costs",
  "/clean-canvas": "/clean-energy-ideas-actions",
} as const;

export function renamedPublicUrl(pathname: string, search = "", hash = "") {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const destination = PUBLIC_URL_RENAMES[path as keyof typeof PUBLIC_URL_RENAMES];
  return destination ? `${destination}${search}${hash}` : null;
}