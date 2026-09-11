import PeakerVsBatteryView from "@/components/peaker-vs-battery/PeakerVsBattery";
import { useSeo } from "@/hooks/use-seo";

export default function PeakerVsBatteryPage() {
  useSeo({
    title: "Peaker vs. Battery: Austin Dispatch Economics",
    description:
      "Real Austin LZ_AEN price data comparing a 400 MW gas peaker with a 485 MW battery on hours run, revenue, and cost.",
  });

  return <PeakerVsBatteryView />;
}
