import LoadEstimatorView from "@/components/load-estimator/LoadEstimator";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function LoadEstimatorPage() {
  useSeo({
    title: "Austin Load Growth Estimator",
    description:
      "Build an Austin Energy load-growth scenario with housing, data centers, industry, EV fleets, and planned development.",
  });

  return (
    <>
      <PageHeader
        title="Load Growth Estimator"
        subtitle="Build a scenario for how housing, data centers, industry, and electric vehicles could change peak demand."
      />
      <LoadEstimatorView />
    </>
  );
}
