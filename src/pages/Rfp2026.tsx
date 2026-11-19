import BatterySiteMap from "@/features/rfp-2026/BatterySiteMap";
import { useSeo } from "@/hooks/use-seo";

export default function Rfp2026() {
  useSeo({
    title: "Austin DER Planning | Battery Priority Site Map",
    description: "Screening map of Austin buildings where batteries could pair with existing or new rooftop solar, ranked by solar and ZIP-level new load growth.",
  });
  return <BatterySiteMap />;
}
