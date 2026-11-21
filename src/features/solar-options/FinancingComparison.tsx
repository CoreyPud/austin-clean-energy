const rows = [
  { label: "Who owns the solar?", values: ["Third-party developer / investor", "You — the property owner", "Third-party leasing provider"] },
  { label: "Does it reduce the electricity bill?", values: ["No. Generation payments go to the solar owner; your bill stays separate.", "Yes, through Austin Energy Value of Solar credits.", "Yes, through Value of Solar credits, minus your lease payments."] },
  { label: "How does the property benefit?", values: ["Negotiated roof rent or revenue sharing. Utility payments are not automatically host income.", "Bill credits and long-term ownership, after loan payments and operating costs.", "Bill credits without purchasing the equipment, after lease payments and any separately charged costs."] },
  { label: "Financing commitment", values: ["A hosting agreement with the developer; host costs depend on the proposal.", "A loan to purchase the system; lender approval and terms required.", "An equipment lease rather than a purchase loan; provider approval and terms required."] },
  { label: "Who handles maintenance?", values: ["Generally the solar owner, as specified in the hosting contract.", "You arrange and budget for maintenance, insurance, and replacements.", "Must be confirmed in the lease; do not assume maintenance is included."] },
  { label: "Good starting point", values: ["A warehouse or landlord-owned site where tenants pay the electricity bill.", "A school or business that pays its bill, wants ownership, and can finance the purchase.", "A business that pays its bill but prefers not to take a purchase loan or own the equipment."] },
  { label: "Main tradeoffs", values: ["No bill reduction or equipment ownership. Long-term roof access and host payments need negotiation.", "Debt obligation and responsibility for system performance and operating costs.", "No equipment ownership. Escalators, buyout, roof access, and end-of-term obligations need review."] },
  { label: "Pricing available here", values: ["Host income needs a developer proposal; no host payment is assumed.", "Site-specific planning estimates in Austin Solar Options; not a lender or installer quote.", "Placeholder only: x% of the dollar value of annual VoS bill savings. Retained savings = (100 − x)%, before other costs."] },
];

export default function FinancingComparison() {
  return <div className="overflow-x-auto border-y border-border">
    <table className="w-full min-w-[720px] table-fixed text-left text-sm" aria-label="Three solar financing options">
      <thead className="bg-muted">
        <tr>
          <th scope="col" className="w-[19%] px-4 py-5 font-semibold">Compare</th>
          <th scope="col" className="w-[27%] px-4 py-5 font-semibold text-primary">Standard Offer</th>
          <th scope="col" className="w-[27%] px-4 py-5 font-semibold">Loan + Value of Solar</th>
          <th scope="col" className="w-[27%] px-4 py-5 font-semibold">Equipment lease + Value of Solar</th>
        </tr>
      </thead>
      <tbody>{rows.map(row => <tr key={row.label} className="border-t border-border even:bg-muted/30">
        <th scope="row" className="align-top px-4 py-4 font-medium">{row.label}</th>
        {row.values.map((value, index) => <td key={index} className="align-top px-4 py-4 leading-relaxed text-muted-foreground">{value}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}