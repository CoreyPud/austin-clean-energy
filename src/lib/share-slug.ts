export const SHARE_CODE_LENGTH = 8;

export const addressSlug = (address: string) =>
  address.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);

export const sharePathFor = (address: string | null | undefined, token: string) => {
  const slug = addressSlug(address ?? "");
  const code = token.slice(0, SHARE_CODE_LENGTH).toLowerCase();
  return `/solar-savings-austin/${slug ? `${slug}-` : ""}${code}`;
};

/** Short code is the final dash-separated segment of the slug. */
export const shareCodeFromSlug = (slug: string | undefined) => {
  const code = slug?.split("-").pop()?.toLowerCase() ?? "";
  return /^[0-9a-f]{8,}$/.test(code) ? code : null;
};
