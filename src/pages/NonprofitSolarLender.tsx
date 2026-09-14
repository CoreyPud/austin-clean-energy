import NonprofitSolarLenderView from "@/components/nonprofit-solar-lender/NonprofitSolarLender";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function NonprofitSolarLenderPage() {
  useSeo({
    title: "Non-Profit Solar Bridge Loan Calculator | Austin",
    description:
      "Model a 25-year non-profit solar pro forma with an Austin Energy rebate, IRS Direct Pay, and a bridge loan repaid from utility bill savings.",
  });

  return (
    <>
      <PageHeader
        title="Non-Profit Solar Bridge Loan Calculator"
        subtitle="Model how a bridge loan, the Austin Energy rebate, and IRS Direct Pay combine to fund a non-profit solar project over 25 years."
      />
      <NonprofitSolarLenderView />
    </>
  );
}
