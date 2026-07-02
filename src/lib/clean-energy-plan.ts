/**
 * Frontend plan and recommendation generators.
 * Both use the same recommendedKw derived from the user's actual bill,
 * avoiding the backend's cruder 60%-of-max estimate.
 */
import { billToMonthlyKwh } from "@/lib/solar-model";

export function computeRecommendedKw(
  solarInsights: any,
  annualUsageKwh: number,
): number | null {
  if (!solarInsights?.maxPanels || !solarInsights?.panelCapacityWatts) return null;
  const maxKw = Math.round((solarInsights.maxPanels * solarInsights.panelCapacityWatts) / 100) / 10;
  const prodPerKw =
    solarInsights.annualProductionKwh > 0 && maxKw > 0
      ? solarInsights.annualProductionKwh / maxKw
      : 1500;
  const unconstrained = prodPerKw > 0 ? annualUsageKwh / prodPerKw : 0;
  return Math.round(Math.min(Math.max(unconstrained, 2), maxKw) * 2) / 2;
}

interface CardOpts {
  propertyType: string;
  solarInsights: any;
  lifestyleData: any;
  neighborhoodSnapshot: any;
  savings: any;
  recommendedKw: number | null;
}

export function buildRecommendationCards(opts: CardOpts) {
  const { propertyType, solarInsights, lifestyleData, savings, recommendedKw } = opts;
  const isOwner = lifestyleData?.housingStatus !== "rent";
  const hasSolar = lifestyleData?.currentEnergy === "solar-existing";
  const hasEv = lifestyleData?.transportation === "ev";
  const hasSolarPotential = !!solarInsights?.maxPanels;

  const kw = recommendedKw ?? savings?.recommendedSystemKw;

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

  if (!hasSolar && isOwner && hasSolarPotential && savings && kw) {
    cards.push({
      id: "solar",
      impact: "high",
      category: "Home Power",
      title: `Install a ${kw} kW solar system`,
      summary: `Estimated $${savings.annualSavingsUsd.toLocaleString()}/year savings, payback in ~${savings.paybackYears} years after the Austin Energy rebate.`,
      bullets: [
        `Net cost after $${savings.austinEnergyRebateUsd.toLocaleString()} rebate: ~$${savings.netSystemCostUsd.toLocaleString()}`,
        `25-year savings: ~$${savings.twentyFiveYearSavingsUsd.toLocaleString()}`,
      ],
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
