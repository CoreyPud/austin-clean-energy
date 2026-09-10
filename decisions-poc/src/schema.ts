// Data model for the Austin climate/energy decisions tracker POC.
//
// Two grains (see README):
//   - RawItem: one per relevant agenda item per document (the staging/evidence layer).
//   - Decision: canonical, deduped across documents/bodies (the output layer).
//
// Every extracted structural field carries provenance ("regex" | "llm") and a
// verification flag, so the dataset is auditable and hallucination is catchable.

export type FieldSource = "regex" | "llm";
export type Significance = "high" | "medium" | "low";
export type Verification = "official" | "reporting_only" | "sealed";

export type DocType =
  | "commission_agenda"
  | "commission_minutes"
  | "council_agenda"
  | "council_minutes"
  | "rca"
  | "resolution"
  | "socrata_vote"
  | "socrata_ciur";

export interface SourceDoc {
  docId: string; // stable id, e.g. "edims:477532"
  docType: DocType;
  body: string; // "Electric Utility Commission", "Austin City Council", ...
  meetingDate: string; // YYYY-MM-DD
  edimsId?: string;
  itemNo?: string | null; // for socrata rows that map to a single item
  url: string;
}

export interface Vote {
  body: string;
  date: string; // YYYY-MM-DD
  result: string; // recommended | approved | failed | postponed | pending
  tally: string | null; // "8-3"
  mover?: string | null;
  second?: string | null;
  dissenters: string[];
  isClosedSession: boolean;
  _source: FieldSource;
  _verified: boolean; // did deterministic code confirm this against source text
}

// Deterministic facts harvested by regex directly from the source text.
// These are ground truth used to audit the LLM's structural claims.
export interface HarvestedFacts {
  dollarAmounts: number[];
  tallies: { tally: string; against: string[]; context: string }[];
  crossRefs: string[]; // YYYYMMDD or YYYYMMDD-NNN references
}

// One extracted item from one document (the LLM's structuring, then audited).
export interface RawItem {
  rawItemId: string; // `${docId}#${itemNo ?? seq}`
  docId: string;
  body: string;
  meetingDate: string;
  itemNo: string | null;
  title: string;
  postingLanguage?: string;
  decisionType: string;
  topic: string;
  isClimate: boolean;
  significance: Significance;
  dollarAmount: number | null;
  vote: Vote | null;
  summary: string;
  crossRefs: string[];
  flags: string[];
  fieldSources: Partial<Record<keyof RawItem, FieldSource>>;
}

export interface DecisionDocumentRef {
  docType: DocType;
  body: string;
  meetingDate: string;
  edimsId?: string;
  url: string;
  itemNo?: string | null;
}

// A citation that points not just at a document but at the exact section within it:
// the locator (item number / field name) and the verbatim quote it was drawn from.
export interface SourceRef {
  docType: DocType;
  url: string;
  edimsId?: string;
  locator: string; // e.g. "item 7", "item 82", "Fiscal Note field"
  quote: string; // the verbatim source text this fact came from
}

// A council decision (complete register: public + closed, hidden flagged as a field).
export interface CouncilDecision {
  id: string;
  meetingDate: string;
  itemNumber: string;
  body: string; // "Austin City Council"
  title: string;
  topic: string;
  isClimate: boolean;
  significance: "major" | "notable" | "routine"; // policy/major action vs routine procurement
  summary: string;
  outcome: string; // approved | approved_on_consent | postponed | withdrawn | conducted_and_approved | failed | no_action
  result: string; // plain-language synopsis of what actually happened (esp. for closed-session items)
  decidedInClosedSession: boolean;
  closedSession: { itemNumber: string; statutes: string[]; disposition: string } | null;
  vote: {
    recorded: boolean;
    tally: string | null;
    dissenters: string[];
    reason?: string; // e.g. "executive_session" when not recorded
    _source: FieldSource;
    _verified: boolean;
  };
  detail: {
    leadDepartment?: string | null;
    funding?: string | null;
    dollarAmount?: number | null;
    priorAction?: string[];
    commissionRecommendation?: string | null;
  };
  verification: Verification;
  flags: string[];
  references: SourceRef[]; // each with locator + quote
}

export interface DecisionLink {
  relation: string; // implements | amends | references
  toKey: string; // YYYYMMDD or YYYYMMDD-NNN
  note?: string;
}

// Canonical merged decision — the output record (one JSON file each).
export interface Decision {
  id: string; // stable slug
  title: string;
  date: string; // date of the most authoritative action
  body: string; // most authoritative body that acted
  decisionType: string;
  topic: string;
  isClimate: boolean;
  significance: Significance;
  dollarAmount: number | null;
  status: string;
  verification: Verification;
  summary: string;
  canonicalKey: string | null; // YYYYMMDD-NNN of the primary agenda item if any
  votes: Vote[];
  documents: DecisionDocumentRef[];
  links: DecisionLink[];
  flags: string[];
  rawItemIds: string[]; // provenance: which raw_items composed this decision
}

export interface RunMeta {
  generatedAt: string;
  llmModel: string;
  counts: { documents: number; rawItems: number; decisions: number; climateDecisions: number };
  reviewQueue: { rawItemId: string; reason: string }[]; // unverified / conflicting fields
}
