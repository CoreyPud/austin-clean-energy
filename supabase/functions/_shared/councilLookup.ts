/**
 * Council Lookup Utility
 *
 * Resolves an Austin council district from lat/lng using the City of Austin
 * public ArcGIS service, then parses the council-members.md knowledge file
 * to return contact info for that district.
 *
 * The ArcGIS lookup is the always-fresh fallback for the district mapping; the
 * markdown content is admin-editable in the Knowledge Base UI.
 */

import { councilMembersContent } from "./knowledgeContent.ts";

export interface CouncilMember {
  district: string; // e.g. "District 5" or "Mayor"
  districtNumber: number | null; // 1-10, or null for mayor
  name: string;
  email: string;
  phone: string;
  officePage: string;
  priorities: string;
  source: "knowledge-base" | "arcgis-fallback";
}

// City of Austin "Council Districts Fill" feature service.
// The previous URL (COA_SINGLE_MEMBER_DISTRICTS_FY2014) no longer exists and returns
// HTTP 400 ("Invalid URL"), causing every lookup to silently fall back to the Mayor.
const ARCGIS_URL =
  "https://services.arcgis.com/0L95CJ0VTaxqcmED/ArcGIS/rest/services/BOUNDARIES_single_member_districts/FeatureServer/0/query";

/**
 * Query Austin's public ArcGIS service for the council district at a coordinate.
 * Returns the district number (1-10) or null if not found.
 */
export async function lookupDistrictByCoords(
  lat: number,
  lng: number,
): Promise<number | null> {
  try {
    const params = new URLSearchParams({
      where: "1=1",
      geometryType: "esriGeometryPoint",
      geometry: JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 },
      }),
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "COUNCIL_DISTRICT,COUNCIL_DISTRICT_NUMBER,DISTRICT_NUMBER",
      returnGeometry: "false",
      f: "json",
    });

    const response = await fetch(`${ARCGIS_URL}?${params.toString()}`);
    if (!response.ok) {
      console.warn("ArcGIS council lookup failed:", response.status);
      return null;
    }

    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const attrs = feature.attributes || {};
    const raw =
      attrs.COUNCIL_DISTRICT ??
      attrs.COUNCIL_DISTRICT_NUMBER ??
      attrs.DISTRICT_NUMBER;

    const parsed = parseInt(String(raw), 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 10) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn("ArcGIS council lookup error:", err);
    return null;
  }
}

/**
 * Parse the council-members.md content into a map of section -> field values.
 */
function parseCouncilMarkdown(markdown: string): Map<string, Record<string, string>> {
  const sections = new Map<string, Record<string, string>>();
  const lines = markdown.split("\n");

  let current: string | null = null;
  let fields: Record<string, string> = {};

  const flush = () => {
    if (current) sections.set(current, fields);
  };

  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^##\s+(Mayor|District\s+\d{1,2})\s*$/i);
    if (heading) {
      flush();
      current = heading[1].replace(/\s+/g, " ").replace(/^district/i, "District");
      if (/^mayor$/i.test(current)) current = "Mayor";
      fields = {};
      continue;
    }
    if (!current) continue;

    const fieldMatch = line.match(/^\*\*(Name|Email|Phone|Office Page|Current Priorities):\*\*\s*(.*)$/);
    if (fieldMatch) {
      fields[fieldMatch[1]] = fieldMatch[2].trim();
    }
  }
  flush();
  return sections;
}

/**
 * Get the council member for a given district number, or the mayor if districtNumber is null.
 * Pass in admin-edited markdown (from knowledge_files DB) to override the embedded fallback.
 */
export function getCouncilMember(
  districtNumber: number | null,
  markdownOverride?: string,
): CouncilMember {
  const markdown = markdownOverride || councilMembersContent;
  const sections = parseCouncilMarkdown(markdown);

  const key = districtNumber === null ? "Mayor" : `District ${districtNumber}`;
  const fields = sections.get(key) || {};

  const officePage =
    fields["Office Page"] ||
    (districtNumber === null
      ? "https://www.austintexas.gov/department/mayor"
      : `https://www.austintexas.gov/department/district-${districtNumber}`);

  return {
    district: key,
    districtNumber,
    name: fields["Name"] || (districtNumber === null ? "Mayor of Austin" : `District ${districtNumber} Council Member`),
    email: fields["Email"] || "",
    phone: fields["Phone"] || "",
    officePage,
    priorities: fields["Current Priorities"] || "",
    source: markdownOverride ? "knowledge-base" : "arcgis-fallback",
  };
}

/**
 * One-shot lookup: coords -> district -> council member.
 */
export async function resolveCouncilMember(
  lat: number,
  lng: number,
  markdownOverride?: string,
): Promise<CouncilMember & { lookupSucceeded: boolean }> {
  const districtNumber = await lookupDistrictByCoords(lat, lng);
  const member = getCouncilMember(districtNumber, markdownOverride);
  return {
    ...member,
    lookupSucceeded: districtNumber !== null,
  };
}
