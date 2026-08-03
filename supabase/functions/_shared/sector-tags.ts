// Keyword sector classification for campaign donors and lobbyist clients.
// Deterministic and import-free (shared by edge functions / scripts). Rules are
// ordered — first match wins, most specific first — so e.g. "solar" beats the
// generic "energy" bucket. Sectors are chosen for the influence/climate story;
// everything unmatched falls to "other", and non-employers to "unaffiliated".

export type Sector =
  | "real_estate" | "legal_lobbying" | "energy_fossil" | "clean_energy"
  | "finance" | "tech" | "healthcare" | "labor" | "hospitality_retail"
  | "public_education" | "nonprofit" | "unaffiliated" | "other";

export const SECTOR_LABEL: Record<Sector, string> = {
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

// Sectors worth surfacing prominently for the "who funds them" story.
export const KEY_SECTORS: Sector[] = ["real_estate", "energy_fossil", "clean_energy", "legal_lobbying", "labor", "finance"];

const RULES: [Sector, RegExp][] = [
  ["unaffiliated",     /\b(retired|not employed|unemployed|self[- ]?employed|self|homemaker|none|n\/a)\b|^self$/i],
  ["clean_energy",     /\b(solar|renewable|photovoltaic|wind energy|geothermal|clean energy|ev charging|electric vehicle|battery storage)\b/i],
  ["real_estate",      /\b(real estate|realty|realtor|develop(er|ment|ment)|homebuilder|home build|construction|propert(y|ies)|land ?develop|land use|brokerage|endeavor|commercial real|residential real|builder|investment\/develop)\b/i],
  ["legal_lobbying",   /\b(law|lawyer|attorney|legal|llp|counsel|lobby|government (affairs|relations)|public affairs|consult(ant|ing))\b/i],
  ["energy_fossil",    /\b(oil|gas|petroleum|pipeline|refin(e|ing)|utility|utilities|energy|power (company|plant)|electric coop|exxon|chevron|nrg|vistra)\b/i],
  ["labor",            /\b(union|afl[- ]?cio|firefighters?( association)?|police (association|union)|ibew|teamsters|labor|afscme|laborers)\b/i],
  ["finance",          /\b(bank|capital|invest(ment|or)?|financial|finance|insurance|wealth|equity|asset manage|securities|mortgage)\b/i],
  ["tech",             /\b(tech(nology)?|software|semiconductor|dell|google|apple|microsoft|oracle|ibm|amazon|meta|silicon|startup|data|cyber)\b/i],
  ["healthcare",       /\b(health|medical|hospital|clinic|pharma|physician|dental|dentist|nurse|therapy|biotech|medicine)\b/i],
  ["hospitality_retail",/\b(restaurant|hotel|hospitality|retail|bar|brewery|cafe|catering|food service|store)\b/i],
  ["public_education", /\b(city of austin|travis county|williamson county|state of texas|isd|independent school|university|college|government|county|municipal|public school|\bcity\b)\b/i],
  ["nonprofit",        /\b(non[- ]?profit|nonprofit|foundation|church|ministry|charity|advocacy|coalition|institute|association)\b/i],
];

export function classifySector(employer?: string | null, occupation?: string | null): Sector {
  const text = `${employer ?? ""} ${occupation ?? ""}`.trim();
  if (!text) return "unaffiliated";
  for (const [sector, re] of RULES) if (re.test(text)) return sector;
  return "other";
}

// Lobbyist clients carry a business_desc that's often already a category.
export function classifyClient(clientName?: string | null, businessDesc?: string | null): Sector {
  return classifySector(`${clientName ?? ""} ${businessDesc ?? ""}`, null);
}
