// Current Austin City Council (2025). council_members isn't populated in the DB,
// and names differ across sources — campaign finance uses "Last, First"
// (`Velasquez, Jose`), the voting record uses "First Last" with accents
// (`José Velásquez`). This roster carries both so the pages can join.
export interface CouncilMember {
  district: number;        // 0 = Mayor
  name: string;            // display
  title: string;
  slug: string;
  financePrefix: string;   // matches campaign_finance_summary.recipient (startsWith)
  voterName: string;       // matches council_vote_dissents.voter_name (exact)
}

export const COUNCIL_MEMBERS: CouncilMember[] = [
  { district: 0,  name: "Kirk Watson",            title: "Mayor",          slug: "kirk-watson",            financePrefix: "Watson, Kirk",          voterName: "Kirk Watson" },
  { district: 1,  name: "Natasha Harper-Madison",  title: "Council Member", slug: "natasha-harper-madison", financePrefix: "Harper-Madison",        voterName: "Natasha Harper-Madison" },
  { district: 2,  name: "Vanessa Fuentes",         title: "Council Member", slug: "vanessa-fuentes",        financePrefix: "Fuentes, Vanessa",      voterName: "Vanessa Fuentes" },
  { district: 3,  name: "José Velásquez",          title: "Council Member", slug: "jose-velasquez",         financePrefix: "Velasquez, Jose",       voterName: "José Velásquez" },
  { district: 4,  name: "José \"Chito\" Vela",     title: "Council Member", slug: "jose-vela",              financePrefix: "Vela, Jose",            voterName: "José \"Chito\" Vela" },
  { district: 5,  name: "Ryan Alter",              title: "Council Member", slug: "ryan-alter",             financePrefix: "Alter, Ryan",           voterName: "Ryan Alter" },
  { district: 6,  name: "Krista Laine",            title: "Council Member", slug: "krista-laine",           financePrefix: "Laine, Krista",         voterName: "Krista Laine" },
  { district: 7,  name: "Mike Siegel",             title: "Council Member", slug: "mike-siegel",            financePrefix: "Siegel, Mike",          voterName: "Mike Siegel" },
  { district: 8,  name: "Paige Ellis",             title: "Council Member", slug: "paige-ellis",            financePrefix: "Ellis, Paige",          voterName: "Paige Ellis" },
  { district: 9,  name: "Zohaib \"Zo\" Qadri",     title: "Council Member", slug: "zohaib-qadri",           financePrefix: "Qadri, Zohaib",         voterName: "Zohaib \"Zo\" Qadri" },
  { district: 10, name: "Marc Duchen",             title: "Council Member", slug: "marc-duchen",            financePrefix: "Duchen, Marc",          voterName: "Marc Duchen" },
];

export const memberByDistrict = (d: number) => COUNCIL_MEMBERS.find(m => m.district === d);
export const memberBySlug = (s: string) => COUNCIL_MEMBERS.find(m => m.slug === s);

export const fmtUSD = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1_000 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`;

// Mirror of supabase/functions/_shared/sector-tags.ts labels (display side).
export const SECTOR_LABEL: Record<string, string> = {
  real_estate: "Real estate & development",
  legal_lobbying: "Legal & lobbying",
  energy_fossil: "Energy & utilities",
  clean_energy: "Clean energy",
  finance: "Finance & insurance",
  tech: "Technology",
  healthcare: "Healthcare",
  labor: "Labor",
  hospitality_retail: "Hospitality & retail",
  public_education: "Public sector & education",
  nonprofit: "Nonprofit",
  unaffiliated: "Retired / not employed",
  other: "Other",
};

