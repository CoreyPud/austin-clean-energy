import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import FinancingComparison from "@/features/solar-options/FinancingComparison";

export default function AustinSolarFinancing() {
  useSeo({ title: "Austin Solar Financing | Austin Clean Energy", description: "Compare Standard Offer hosting, ownership with a loan, and an equipment lease with Value of Solar for Austin commercial, nonprofit, and multifamily properties." });
  return <div className="min-h-screen bg-background text-foreground">
    <PageHeader title="Austin Solar Financing" subtitle="Standard Offer, ownership with a loan, or an equipment lease." backTo="/austin-solar-options" backLabel="Austin Solar Options" />
    <main className="mx-auto max-w-6xl space-y-7 px-4 py-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-2"><h2 className="text-2xl font-bold">Three paths for your property</h2><p className="text-muted-foreground">For commercial, nonprofit, and multifamily properties. The best fit depends on who pays the electricity bill, whether you want to own the equipment, and your financing preference.</p></div>
          <Button asChild><Link to="/austin-solar-options">Find my solar option<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
        <FinancingComparison />
      </section>
      <section className="space-y-3 border-b border-border pb-6 text-sm">
        <h2 className="text-lg font-semibold">Before comparing proposals</h2>
        <p><strong>Multifamily:</strong> Value of Solar credits may go to tenant accounts rather than the landlord. Tenant savings are not owner income; a lease requires agreement about who pays it.</p>
        <p><strong>Lease pricing is not yet available.</strong> The x% example is an illustration, not a quote. No lease term, escalator, maintenance package, buyout, or investment return is assumed.</p>
        <p><strong>Eligibility and incentives:</strong> Austin Energy approval, system size, interconnection, and contract terms must be confirmed. Austin Energy rebates and any eligible commercial or nonprofit federal benefits depend on the program and solar owner; they are not guaranteed host receipts. No federal residential homeowner tax credit is assumed.</p>
      </section>
      <aside className="space-y-3 text-sm text-muted-foreground">
        <p>Sources: Austin Energy solar program descriptions and the ownership/hosting assumptions used in Austin Solar Options. Site-specific savings are planning estimates, not verified commercial tariff calculations or financing offers.</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Button asChild variant="link" className="h-auto whitespace-normal px-0"><a href="https://austinenergy.com/green-power/solar-solutions" target="_blank" rel="noopener noreferrer">Austin Energy solar programs<ExternalLink className="ml-2 h-4 w-4 shrink-0" /></a></Button>
          <Button asChild variant="link" className="h-auto whitespace-normal px-0"><a href="https://austinenergy.com/green-power/solar-solutions/solar-standard-offer-program" target="_blank" rel="noopener noreferrer">Standard Offer program<ExternalLink className="ml-2 h-4 w-4 shrink-0" /></a></Button>
        </div>
      </aside>
    </main>
  </div>;
}