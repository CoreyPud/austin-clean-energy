import { tcadAddressMatch, type TcadAddressMatch } from "../../supabase/functions/_shared/tcad-address";

export const ASSESSMENT_PROPERTY_TYPES = ["single-family", "multi-family", "condo", "commercial", "non-profit"];
const DB_TYPE_MAP: Record<string, string> = {
  single_family: "single-family", multifamily: "multi-family", condo: "condo",
  commercial: "commercial", non_profit: "non-profit",
};

export async function detectAssessmentPropertyType(
  address: string,
  readRows: (match: TcadAddressMatch) => Promise<{ property_type: string | null }[] | null>,
): Promise<string | null> {
  const match = tcadAddressMatch(address);
  if (!match) return null;
  const rows = await readRows(match);
  if (rows?.length !== 1) return null;
  return DB_TYPE_MAP[rows[0].property_type ?? ""] ?? null;
}