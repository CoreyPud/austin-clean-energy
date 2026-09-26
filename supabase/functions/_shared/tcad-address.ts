// Matching a Google-formatted address to a TCAD situs_address. Shared by the unified-assessment
// edge function (to find the cached solar row) and the calculator page (to pre-fill property
// type from autocomplete). Keep this file import-free so both Deno and the app can load it.
//
// Google spells street types out ("2307 Hayfield Square") while TCAD abbreviates them
// ("2307 HAYFIELD SQ PFLUGERVILLE TX 78660"), so a plain prefix match on the whole street
// never hits for most addresses. Instead: house number + street name without its final
// word (the type), followed by a space, scoped to the zip. "2307 Hayfield %" in 78660 matches
// "2307 HAYFIELD SQ ..." but not "2307 HAYFIELDS DR ...".

export interface TcadAddressMatch {
  /** ILIKE pattern for tcad_properties.situs_address. */
  pattern: string;
  /** 5-digit zip for tcad_properties.situs_zip, when the address has one. */
  zip: string | null;
}

export function tcadAddressMatch(formattedAddress: string): TcadAddressMatch | null {
  const street = formattedAddress.split(",")[0]
    .replace(/\s+(#|apt\b|unit\b|ste\b|suite\b).*$/i, "")
    .replace(/[%_\\]/g, "")
    .trim();
  const tokens = street.split(/\s+/).filter(Boolean);
  if (tokens.length < 2 || !/^\d+[A-Za-z]?$/.test(tokens[0])) return null;
  // Drop the street type ("Square", "St") when there is one to drop; "123 Main" stays whole.
  const name = tokens.length >= 3 ? tokens.slice(0, -1) : tokens;
  // Last 5-digit group: the house number itself can be five digits ("12400 Metric Blvd").
  const zips = formattedAddress.match(/\b\d{5}\b/g);
  return { pattern: `${name.join(" ")} %`, zip: zips ? zips[zips.length - 1] : null };
}
