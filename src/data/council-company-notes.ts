// Editorial context for the companies-of-interest list. The lobby subject-matter
// data can't say WHY a firm lobbies (reports over-select ~every subject), so these
// short, factual descriptions are hand-written and kept separate from the
// auto-generated donation numbers in council-companies.json. Keyed by the lowercased
// company name from that file. "why" describes the firm's typical business before the
// city (by what it does) — not an accusation of any specific deal.
// Descriptions verified via web research (Aug 2026) against company sites, Wikipedia,
// and Austin Monitor. Note interests vary: most are real estate/development (zoning &
// entitlements), but Texas Disposal/HNTB/HDR seek city contracts, C3 needs event
// permits, and Apple pursues incentives — the influence isn't monolithic.

export interface CompanyNote { display?: string; what: string; why: string }

export const COMPANY_NOTES: Record<string, CompanyNote> = {
  "armbrust & brown": {
    what: "One of Austin's most active land-use law and lobbying firms.",
    why: "Represents developers and landowners before the council on zoning, entitlements, and land-use cases.",
  },
  "endeavor real estate group": {
    what: "One of Austin's largest commercial real estate developers (projects include The Domain).",
    why: "Its developments hinge on council decisions about zoning, entitlements, and incentives.",
  },
  "c3 presents": {
    display: "C3 Presents",
    what: "Austin live-events producer (Austin City Limits Festival, Lollapalooza); owned by Live Nation since 2014.",
    why: "Depends on city permits and Zilker Park use agreements for large festivals.",
  },
  "presidium group": {
    what: "Multifamily real estate developer and investor.",
    why: "Needs rezoning and development approvals for its projects.",
  },
  "texas disposal systems": {
    what: "Waste, recycling, and landfill company.",
    why: "Holds and competes for city waste and recycling contracts.",
  },
  "aquila commercial": {
    what: "Austin commercial real estate brokerage and development-services firm.",
    why: "Engaged on commercial development and land-use matters.",
  },
  "riverside resources": {
    what: "Real estate development firm.",
    why: "Seeks zoning and entitlement approvals for developments.",
  },
  "apple": {
    what: "Technology company with a major Austin campus.",
    why: "Interests include campus expansion, infrastructure, and economic-development agreements.",
  },
  "stratus properties": {
    display: "Stratus Properties",
    what: "Austin-based real estate development company (Barton Creek–area projects).",
    why: "Large development entitlements and zoning decisions.",
  },
  "journeyman group": {
    what: "Real estate development firm.",
    why: "Development and rezoning approvals.",
  },
  "hntb corporation": {
    what: "National infrastructure and transportation engineering firm.",
    why: "Bids on city transportation and public-works contracts.",
  },
  "barshop & oles company": {
    display: "Barshop & Oles",
    what: "Austin commercial real estate development and investment firm.",
    why: "Commercial development and land-use approvals.",
  },
  "austin habitat for humanity": {
    what: "Nonprofit affordable-housing builder.",
    why: "Engaged on affordable-housing policy, land, and permitting.",
  },
  "hdr": {
    what: "Engineering and infrastructure design firm.",
    why: "Competes for city infrastructure and public-works contracts.",
  },
};

export const noteFor = (name: string): CompanyNote | undefined => COMPANY_NOTES[name.toLowerCase()];
