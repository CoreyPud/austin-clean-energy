import InnovationGapView from "@/components/innovation-gap/InnovationGap";
import { intro } from "@/components/innovation-gap/innovation-gap-data";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function InnovationGapPage() {
  useSeo({
    title: "Innovation Gap",
    description: "Compare Austin Energy's program milestones with peer utilities across batteries, solar, vehicle-to-grid, grid-enhancing technologies, and geothermal.",
  });

  return (
    <>
      <PageHeader title={intro.title} subtitle={intro.dek} backTo="/austin-at-a-glance" backLabel="Back to Resources" />
      <InnovationGapView />
    </>
  );
}