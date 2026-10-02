import GetsVsPeakerView from "@/components/gets-vs-peaker/GetsVsPeaker";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function GetsPage() {
  useSeo({
    title: "GETs vs. Peaker",
    description:
      "How grid-enhancing technologies compare with a gas peaker for adding capacity to Austin's grid.",
  });
  return (
    <>
      <PageHeader title="GETs vs. Peaker" subtitle="Can grid-enhancing technologies do the job of a new gas peaker?" />
      <GetsVsPeakerView />
    </>
  );
}
