import { SharedProjectProvider } from "@/lib/shared-project";
import { useSeo } from "@/hooks/use-seo";
import { SolarBomEstimator } from "@/components/solar-suite/solar-bom-estimator";
import { SolarDraftStudio } from "@/components/solar-suite/solar-draft-studio";
import { SolarFlowPm } from "@/components/solar-suite/solar-flow-pm";
import { LinkedPropertyBar } from "@/components/solar-suite/LinkedPropertyBar";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <SharedProjectProvider>
    <LinkedPropertyBar />
    {children}
  </SharedProjectProvider>
);

export const SolarBomPage = () => {
  useSeo({ title: "SolarBOM Pro", description: "Estimate commercial flat-roof solar modules, inverters, racking, ballast, electrical materials, weight, and cost." });
  return <Shell><SolarBomEstimator /></Shell>;
};

export const SolarDraftPage = () => {
  useSeo({ title: "SolarPlanStudio Pro", description: "Draft and review a commercial solar permit plan set." });
  return <Shell><SolarDraftStudio /></Shell>;
};

export const SolarFlowPage = () => {
  useSeo({ title: "SolarFlow PM", description: "Manage commercial solar schedules, dependencies, tasks, and permission-to-operate milestones." });
  return <Shell><SolarFlowPm /></Shell>;
};
