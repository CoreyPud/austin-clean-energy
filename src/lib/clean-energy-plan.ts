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

interface PlanOpts {
  lifestyleData: any;
  solarInsights: any;
  savings: any;
  neighborhoodSnapshot: any;
  councilMember: any;
  recommendedKw: number | null;
}

export function buildPersonalizedPlan(opts: PlanOpts): string {
  const { lifestyleData, solarInsights, savings, neighborhoodSnapshot, councilMember, recommendedKw } = opts;

  const isOwner = lifestyleData?.housingStatus === "own";
  const hasSolar = lifestyleData?.currentEnergy === "solar-existing";
  const hasEv = lifestyleData?.transportation === "ev";
  const interests: string[] = lifestyleData?.interests || [];
  const hasSolarPotential = !!solarInsights?.maxPanels;

  // Use frontend-derived recommendedKw; fall back to backend savings estimate
  const kw = recommendedKw ?? savings?.recommendedSystemKw;
  const annualSavings = savings?.annualSavingsUsd
    ? `$${Math.round(savings.annualSavingsUsd).toLocaleString()}/yr`
    : "";
  const payback = savings?.paybackYears ? `~${savings.paybackYears} yr payback` : "";

  const moves: Array<{ title: string; description: string }> = [];

  if (isOwner && !hasSolar && hasSolarPotential && kw) {
    moves.push({
      title: `Install a ${kw} kW solar system`,
      description: `Your roof can support it${annualSavings ? `, saving roughly ${annualSavings}` : ""}. After Austin Energy's $2,500 rebate${payback ? `, ${payback}` : ""}.`,
    });
  }

  if (!hasEv) {
    moves.push({
      title: "Switch to an electric vehicle",
      description:
        "Replacing one gas car cuts 4–6 tons of CO₂/year — the biggest single lifestyle change. Austin Energy offers up to $1,200 for a home Level 2 charger.",
    });
  }

  moves.push({
    title: "Get a free home energy audit",
    description:
      "Austin's heat makes AC efficiency your #1 bill driver. A free AE audit identifies the highest-ROI fixes — typical savings are 15–30% on cooling costs.",
  });

  if (!isOwner && moves.length < 3) {
    moves.push({
      title: "Enroll in GreenChoice",
      description:
        "Power your unit with 100% renewable energy through Austin Energy's GreenChoice program. No rooftop access required.",
    });
  }

  if (moves.length < 3 && hasSolarPotential) {
    moves.push({
      title: "Pair solar with battery storage",
      description:
        "A 10 kWh battery keeps critical loads on during outages and shifts usage off-peak. Best installed at the same time as your solar panels.",
    });
  }

  if (moves.length < 3) {
    moves.push({
      title: "Electrify your gas appliances",
      description:
        "Heat pump water heaters use ~60% less energy than gas. Induction stoves eliminate indoor combustion pollution. Federal IRA rebates may apply.",
    });
  }

  const top3 = moves.slice(0, 3);

  const thisMonth: string[] = [];
  if (isOwner && !hasSolar && hasSolarPotential) {
    thisMonth.push("Get 2–3 quotes from Austin Energy's participating solar contractors");
  } else if (!isOwner) {
    thisMonth.push("Sign up for Austin Energy's GreenChoice program online — takes 5 minutes");
  }
  thisMonth.push("Schedule your free Austin Energy home energy audit at austinenergy.com");
  if (!hasEv && (interests.includes("ev") || interests.includes("transit"))) {
    thisMonth.push("Compare EV models and check AE's Level 2 charger rebate (up to $1,200)");
  }
  if (councilMember?.name && councilMember?.email) {
    thisMonth.push(
      `Email ${councilMember.district} representative ${councilMember.name} about expanding Austin's solar and EV rebates`,
    );
  } else {
    thisMonth.push("Review your Austin Energy account for current rebates and incentives");
  }

  const thisYear: string[] = [];
  if (isOwner && !hasSolar && hasSolarPotential && kw) {
    thisYear.push(`Install your ${kw} kW system and lock in the $2,500 Austin Energy rebate`);
  }
  if (!hasEv) {
    thisYear.push("Budget for or lease your first EV — home charging costs less than half of gasoline");
  }
  thisYear.push(
    "Replace your oldest gas appliance with an electric or heat pump model when it needs replacement",
  );
  if (isOwner && hasSolarPotential) {
    thisYear.push("Get a battery storage quote — AE offers a rebate and it pairs best with solar");
  }

  const movesText = top3.map((m, i) => `${i + 1}. **${m.title}**: ${m.description}`).join("\n");
  const monthText = thisMonth.slice(0, 2).map((b) => `- ${b}`).join("\n");
  const yearText = thisYear.slice(0, 2).map((b) => `- ${b}`).join("\n");

  return `**Your Top 3 Moves**\n${movesText}\n\n**This Month**\n${monthText}\n\n**This Year**\n${yearText}`;
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
      cta: { label: "Austin Energy EV Programs", url: "https://austinenergy.com/green-power/plug-in-austin" },
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
      cta: {
        label: "Austin Energy Solar Rebate",
        url: "https://austinenergy.com/green-power/solar-solutions/for-your-home",
      },
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
