import SeeThePeak from "@/features/load-curves/SeeThePeak";
import { useSeo } from "@/hooks/use-seo";

export default function BuildingLoadCurves() {
  useSeo({
    title: "See the Peak: Building Load Curves With and Without a Battery",
    description: "See how a battery reshapes a commercial building's daily demand and what that does to Austin Energy demand charges, by building type.",
  });
  return <SeeThePeak />;
}
