import LoadEstimatorView from "@/components/load-estimator/LoadEstimator";
import BackToHome from "@/components/BackToHome";
import { useSeo } from "@/hooks/use-seo";

export default function LoadEstimatorPage() {
  useSeo({
    title: "Austin Load Growth Estimator",
    description:
      "Build an Austin Energy load-growth scenario with housing, data centers, industry, EV fleets, and planned development.",
  });

  return (
    <>
      <BackToHome />
      <LoadEstimatorView />
    </>
  );
}
