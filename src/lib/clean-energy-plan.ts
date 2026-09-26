/**
 * Frontend recommendation cards. The solar card is built from the calculator's own figures
 * (SolarSummary, derived from the same model and system size the page shows) so the card
 * can never disagree with the numbers above it.
 */

/** The calculator's current solar numbers, as shown on the page (cash purchase basis). Also
 *  sent to the unified-assessment edge function so its council outreach script quotes the
 *  same figures. Field names match that function's `savings` shape. */
export interface SolarSummary {
  recommendedSystemKw: number;
  /** Owner's year-1 bill savings. Null for multifamily, where the credits go to tenants. */
  annualSavingsUsd: number | null;
  /** Year-1 Value of Solar credits to tenants; multifamily only. */
  tenantCreditsUsd: number | null;
  grossSystemCostUsd: number;
  austinEnergyRebateUsd: number;
  netSystemCostUsd: number;
  paybackYears: number | null;
  /** Net cumulative savings at the end of the modeled horizon; null for multifamily. */
  lifetimeNetSavingsUsd: number | null;
  horizonYears: number;
}

interface CardOpts {
  propertyType: string;
  solarInsights: any;
  lifestyleData: any;
  neighborhoodSnapshot: any;
  solar: SolarSummary | null;
}

export function buildRecommendationCards(opts: CardOpts) {
  const { propertyType, solarInsights, lifestyleData, solar } = opts;
  const isOwner = lifestyleData?.housingStatus !== "rent";
  const hasSolar = lifestyleData?.currentEnergy === "solar-existing";
  const hasEv = lifestyleData?.transportation === "ev";
  const hasSolarPotential = !!solarInsights?.maxPanels;

  const cards: any[] = [];

  if (!hasEv) {
    cards.push({
      id: "ev",
      impact: "high",
      category: "Transportation",
      title: "Switch to an EV",
      summary: "Replacing one gas car with an EV cuts ~4-6 tons of CO₂/year — the single biggest individual climate action.",
      bullets: [
        "Austin Energy rebates up to $1,200 for home Level 2 chargers",
        "EV-friendly time-of-use electricity rates from Austin Energy",
      ],
      cta: { label: "Compare EV vs. Gas Costs", url: "/ev-comparison" },
      icon: "Car",
    });
  }

  if (!hasSolar && isOwner && hasSolarPotential && solar) {
    const $ = (n: number) => `$${Math.round(n).toLocaleString()}`;
    const summary = solar.tenantCreditsUsd != null
      ? `About ${$(solar.tenantCreditsUsd)} a year in Value of Solar bill credits for your tenants.`
      : solar.annualSavingsUsd != null
      ? `About ${$(solar.annualSavingsUsd)} a year in bill savings${solar.paybackYears
          ? `, paying for itself in about ${solar.paybackYears} years`
          : `, but it doesn't pay for itself within ${solar.horizonYears} years at these assumptions`}.`
      : "";
    const bullets = [
      solar.austinEnergyRebateUsd > 0
        ? `Net cost after the ${$(solar.austinEnergyRebateUsd)} Austin Energy rebate: about ${$(solar.netSystemCostUsd)}`
        : `Install cost: about ${$(solar.grossSystemCostUsd)}`,
    ];
    if (solar.lifetimeNetSavingsUsd != null) {
      bullets.push(`${solar.horizonYears}-year net savings: about ${$(solar.lifetimeNetSavingsUsd)}`);
    }
    cards.push({
      id: "solar",
      impact: "high",
      category: "Home Power",
      title: `Install a ${solar.recommendedSystemKw} kW solar system`,
      summary,
      bullets,
      cta: { label: "Calculate Solar Savings", url: "/property-assessment" },
      icon: "Sun",
    });
  } else if (!hasSolar && isOwner && !hasSolarPotential) {
    cards.push({
      id: "solar",
      impact: "high",
      category: "Home Power",
      title: "Explore rooftop solar",
      summary: "Austin averages 220+ sunny days a year. Austin Energy offers rebates up to $4,000 and the federal tax credit covers 30% of installation costs.",
      bullets: [
        "Austin Energy solar rebate: up to $4,000",
        "Federal Investment Tax Credit: 30% of system cost",
      ],
      cta: { label: "See your roof's potential", url: "/property-assessment" },
      icon: "Sun",
    });
  } else if (!isOwner) {
    cards.push({
      id: "green-power",
      impact: "medium",
      category: "Home Power",
      title: "Enroll in GreenChoice",
      summary: "Renters can power their unit with 100% renewable energy via Austin Energy's GreenChoice program.",
      bullets: [
        "No rooftop access required",
        "Lock in renewable energy rates",
      ],
      cta: { label: "Sign up for GreenChoice", url: "https://austinenergy.com/green-power/greenchoice" },
      icon: "Leaf",
    });
  }

  cards.push({
    id: "efficiency",
    impact: "high",
    category: "Efficiency",
    title: "Get a free home energy audit",
    summary: "Austin's heat makes AC efficiency the #1 driver of your bill. A free audit identifies the highest-ROI fixes.",
    bullets: [
      "Free for AE customers — required before some rebates",
      "Typical savings: 15-30% on cooling costs",
    ],
    cta: {
      label: "Schedule a Home Energy Audit",
      url: "https://austinenergy.com/energy-efficiency/rebates-incentives/residential/home-improvements/home-energy-savings",
    },
    icon: "Wrench",
  });

  if (hasSolar || hasSolarPotential) {
    cards.push({
      id: "battery",
      impact: "medium",
      category: "Resilience",
      title: "Add battery storage",
      summary: "Pair a 10 kWh battery with solar to keep critical loads running during outages and shift usage off-peak.",
      bullets: [
        "Austin Energy battery rebate available",
        "Best installed at the same time as solar",
      ],
      cta: {
        label: "Austin Energy Battery Rebate",
        url: "https://austinenergy.com/green-power/solar-solutions/for-your-home/battery-storage-incentive",
      },
      icon: "Battery",
    });
  }

  cards.push({
    id: "electrification",
    impact: "medium",
    category: "Appliances",
    title: "Electrify gas appliances",
    summary: "Replace gas water heaters, furnaces, and stoves with heat pumps and induction over time.",
    bullets: [
      "Heat pump water heaters use ~60% less energy",
      "Induction stoves eliminate indoor combustion pollution",
    ],
    cta: { label: "Heat Pump Rebates", url: "https://austinenergy.com/energy-efficiency/rebates-incentives" },
    icon: "Zap",
  });

  cards.push({
    id: "advocacy",
    impact: "medium",
    category: "Advocacy",
    title: "Contact your council member",
    summary: "Local policy decisions on permitting, rebates, and the Austin Energy Resource Plan shape what's possible at home.",
    bullets: [
      "Show up to City Council on climate budget items",
      "Ask Austin Energy to expand solar + storage rebates",
    ],
    cta: { label: "Get involved with Environment Texas", url: "https://environmentamerica.org/texas/" },
    icon: "Megaphone",
  });

  return cards;
}
