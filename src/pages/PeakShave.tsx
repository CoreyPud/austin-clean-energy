import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function PeakShavePage() {
  useSeo({
    title: "Peak Shave Calculator | Austin Clean Energy",
    description: "Estimate how a battery can shave building peak demand and cut demand charges.",
  });
  const ref = useRef<HTMLIFrameElement>(null);
  const [h, setH] = useState(1600);
  useEffect(() => {
    const id = setInterval(() => {
      const d = ref.current?.contentDocument?.documentElement;
      if (d && d.scrollHeight && Math.abs(d.scrollHeight - h) > 4) setH(d.scrollHeight);
    }, 500);
    return () => clearInterval(id);
  }, [h]);
  return (
    <>
      <PageHeader
        title="Peak Shave Calculator"
        subtitle="See how a battery can lower your building's peak demand and demand charges."
      />
      <iframe ref={ref} src="/tools/peak-shave-calculator.html" title="Peak Shave Calculator"
        className="w-full border-0 block" style={{ height: h }} />
    </>
  );
}
