import IRPPlanningInterface from "@/components/irp-planning/IRPPlanningInterface";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function AustinIRPPlanning() {
  useSeo({ title: "Austin IRP Planning", description: "Explore Austin Energy resource-planning inputs, system costs, resource mix, capacity balance, and forward price-pressure scenarios with source notes." });
  return <>
    <PageHeader title="Austin IRP Planning" subtitle="Integrated resource planning for Austin Energy: load, supply, costs, and reliability." backTo="/austin-at-a-glance" backLabel="Back to Austin at a Glance" />
    <div className="max-w-5xl mx-auto px-4 pt-6"><p className="text-sm text-muted-foreground border-l-2 border-accent pl-4">Independent planning tool, not an official Austin Energy IRP. Source claims and assumptions are supplied with this model; they have not been independently verified here. Missing inputs and incomplete comparisons are flagged below.</p></div>
    <IRPPlanningInterface />
  </>;
}
