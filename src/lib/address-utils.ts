// USPS official directional abbreviations
const DIRECTIONALS: Record<string, string> = {
  N: "North", S: "South", E: "East", W: "West",
  NE: "Northeast", NW: "Northwest", SE: "Southeast", SW: "Southwest",
};

// USPS official street suffix abbreviations (most common subset)
const STREET_TYPES: Record<string, string> = {
  ALY: "Alley", AVE: "Avenue", BCH: "Beach", BLVD: "Boulevard",
  BND: "Bend", BR: "Branch", BRK: "Brook", BTM: "Bottom",
  BYP: "Bypass", CIR: "Circle", CLF: "Cliff", CMN: "Common",
  COR: "Corner", CP: "Camp", CPE: "Cape", CRES: "Crescent",
  CRK: "Creek", CRSE: "Course", CRST: "Crest", CSWY: "Causeway",
  CT: "Court", CTR: "Center", CTS: "Courts", CURV: "Curve",
  CV: "Cove", CVS: "Coves", CYN: "Canyon", DL: "Dale",
  DR: "Drive", DRS: "Drives", DV: "Divide", EST: "Estate",
  ESTS: "Estates", EXPY: "Expressway", EXT: "Extension",
  FLD: "Field", FLDS: "Fields", FLT: "Flat", FLTS: "Flats",
  FRD: "Ford", FRG: "Forge", FRK: "Fork", FRKS: "Forks",
  FRST: "Forest", FRY: "Ferry", FT: "Fort", FWY: "Freeway",
  GDN: "Garden", GDNS: "Gardens", GLN: "Glen", GRN: "Green",
  GRV: "Grove", GTWY: "Gateway", HL: "Hill", HLS: "Hills",
  HOLW: "Hollow", HTS: "Heights", HVN: "Haven", HWY: "Highway",
  IS: "Island", ISLE: "Isle", JCT: "Junction", KNL: "Knoll",
  KY: "Key", LCK: "Lock", LDG: "Lodge", LGT: "Light",
  LK: "Lake", LKS: "Lakes", LN: "Lane", LNDG: "Landing",
  LOOP: "Loop", MDW: "Meadow", MDWS: "Meadows", ML: "Mill",
  MLS: "Mills", MNR: "Manor", MNRS: "Manors", MT: "Mount",
  MTN: "Mountain", NCK: "Neck", OPAS: "Overpass", OVAL: "Oval",
  PARK: "Park", PASS: "Pass", PATH: "Path", PIKE: "Pike",
  PKWY: "Parkway", PL: "Place", PLN: "Plain", PLNS: "Plains",
  PLZ: "Plaza", PR: "Prairie", PRT: "Port", PT: "Point",
  RD: "Road", RDG: "Ridge", RDS: "Roads", RIV: "River",
  RNCH: "Ranch", ROW: "Row", RPD: "Rapid", RPDS: "Rapids",
  RTE: "Route", RUN: "Run", SHL: "Shoal", SHR: "Shore",
  SHRS: "Shores", SKWY: "Skyway", SMT: "Summit", SPG: "Spring",
  SPGS: "Springs", SPUR: "Spur", SQ: "Square", SQS: "Squares",
  ST: "Street", STA: "Station", STRM: "Stream", STS: "Streets",
  TER: "Terrace", TPKE: "Turnpike", TRCE: "Trace", TRL: "Trail",
  TRLS: "Trails", TUNL: "Tunnel", UN: "Union", VIA: "Viaduct",
  VIS: "Vista", VL: "Ville", VLG: "Village", VLY: "Valley",
  VW: "View", VWS: "Views", WALK: "Walk", WAY: "Way",
  WAYS: "Ways", WL: "Well", WLS: "Wells", XING: "Crossing",
  XRDS: "Crossroads",
};

function titleWord(w: string): string {
  if (!w) return w;
  // Ordinals like 1ST, 2ND, 3RD, 4TH — digit stays, suffix lowercases
  if (/^\d/.test(w)) return w[0] + w.slice(1).toLowerCase();
  return w[0].toUpperCase() + w.slice(1).toLowerCase();
}

/**
 * Converts an all-caps Travis County assessor address to a Google-compatible
 * formatted address by expanding USPS abbreviations and applying title case.
 *
 * Input:  "7002 WHEELER BRANCH TRL AUSTIN TX 78749"
 * Output: "7002 Wheeler Branch Trail, Austin, TX 78749"
 */
export function formatAssessorAddress(raw: string | null | undefined): string {
  if (!raw) return "";

  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return raw;

  // TCAD sometimes puts the directional before the house number: "W 6636 MAIN ST"
  // Reorder to standard form: "6636 W MAIN ST"
  if (DIRECTIONALS[tokens[0]?.toUpperCase()] && /^\d/.test(tokens[1] ?? "")) {
    const [dir, num, ...rest] = tokens;
    tokens.splice(0, tokens.length, num, dir, ...rest);
  }

  // Strip trailing zip (5 digits)
  const zip = /^\d{5}$/.test(tokens[tokens.length - 1]) ? tokens.pop()! : "";

  // Strip trailing state (2 uppercase letters)
  const state = tokens.length > 0 && /^[A-Z]{2}$/.test(tokens[tokens.length - 1])
    ? tokens.pop()!
    : "";

  // Strip city: last remaining token if it's not a known street type
  const maybeCityToken = tokens[tokens.length - 1]?.toUpperCase();
  const city = maybeCityToken && !STREET_TYPES[maybeCityToken] && /^[A-Z]+$/.test(maybeCityToken)
    ? tokens.pop()!
    : "";

  if (tokens.length === 0) return raw;

  // Expand and title-case the street tokens
  const n = tokens.length;
  const street = tokens.map((w, i) => {
    const up = w.toUpperCase();

    // Directional prefix: position 1 (right after street number)
    if (i === 1 && DIRECTIONALS[up]) return DIRECTIONALS[up];

    // Last token: street type or directional suffix
    if (i === n - 1) {
      if (STREET_TYPES[up]) return STREET_TYPES[up];
      if (DIRECTIONALS[up]) return DIRECTIONALS[up];
    }

    // Second-to-last: directional suffix when last token is a street type
    if (i === n - 2 && DIRECTIONALS[up] && STREET_TYPES[tokens[n - 1].toUpperCase()]) {
      return DIRECTIONALS[up];
    }

    return titleWord(w);
  }).join(" ");

  // Reassemble: "123 South Lamar Blvd, Austin, TX 78749"
  const parts = [street];
  if (city) parts.push(titleWord(city));
  if (state) parts.push(state);  // state stays uppercase (TX)
  if (zip)   parts[parts.length - 1] += " " + zip;

  // Join city/state/zip with commas, street with first comma
  if (parts.length === 1) return parts[0];
  return parts[0] + ", " + parts.slice(1).join(", ");
}
