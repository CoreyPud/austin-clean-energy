import LoadZoneOutlook from "@/components/load-zone-outlook/LoadZoneOutlook";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function AustinLoadZoneOutlook() {
  useSeo({
    title: "Austin Load Zone Outlook",
    description: "Explore Austin's 2026–2045 wholesale electricity price scenarios, generation and large-load projects, contract replacement, and source limitations.",
  });

  return <>
    <PageHeader
      title="Austin Load Zone Outlook"
      subtitle="Austin Energy’s wholesale electricity price scenarios for 2026–2045, with supply investments and large-load growth."
      backTo="/austin-at-a-glance"
      backLabel="Back to Austin at a Glance"
    />
    <div className="max-w-5xl mx-auto px-4 pt-6">
      <p className="text-sm text-muted-foreground border-l-2 border-accent pl-4">
        Independent scenarios, not an official Austin Energy or ERCOT forecast. Supplied source claims have not been independently verified here. The map uses partial snapshots, not live feeds; some locations are approximate. Referenced source workbooks are not included on this site.
      </p>
    </div>
    <LoadZoneOutlook />
  </>;
}