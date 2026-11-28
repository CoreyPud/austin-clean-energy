export const SITE_CATEGORIES = [
  { key: "meter", label: "Revenue meter", question: "Where is the revenue meter, and is its label readable?" },
  { key: "roof", label: "Roof", question: "What is the roof material, condition, and approximate age? Are there access restrictions or obstructions?" },
  { key: "transformer", label: "Transformer", question: "Where is the transformer, and what voltage or capacity is shown on its nameplate?" },
  { key: "bill", label: "Utility bill", question: "Are there multiple meters or accounts, and who pays the electricity bill?" },
  { key: "other", label: "Other notes", question: "What else should the solar team know about this site?" },
] as const;

export type SiteCategory = typeof SITE_CATEGORIES[number]["key"];
export type SiteNotes = Record<SiteCategory, string>;
export const SITE_BUCKET = "solar-site-files";
export const SITE_FILE_LIMIT = 20 * 1024 * 1024;
export const SITE_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];

export function readSiteNotes(value: unknown): SiteNotes {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(SITE_CATEGORIES.map(({ key }) => [key, typeof source[key] === "string" ? source[key] : ""])) as SiteNotes;
}

export function siteFolder(userId: string, savedId: string, category: SiteCategory): string {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(userId) || !uuid.test(savedId) || !SITE_CATEGORIES.some(c => c.key === category)) throw new Error("Select a saved property first.");
  return `${userId}/${savedId}/${category}`;
}

export function validateSiteFile(file: { size: number; type: string }): string | null {
  if (!SITE_FILE_TYPES.includes(file.type)) return "Choose a JPG, PNG, WebP, HEIC photo or a PDF.";
  if (file.size > SITE_FILE_LIMIT) return "Each file must be 20 MB or smaller.";
  if (file.size === 0) return "This file is empty. Please choose another file.";
  return null;
}