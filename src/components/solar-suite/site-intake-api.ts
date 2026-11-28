import { supabase } from "@/integrations/supabase/client";
import { SITE_BUCKET, SITE_CATEGORIES, readSiteNotes, siteFolder, type SiteCategory, type SiteNotes } from "./site-intake-model";

export type SiteFile = { category: SiteCategory; path: string; name: string; url: string; isImage: boolean };

export async function loadSiteFiles(userId: string, savedId: string): Promise<SiteFile[]> {
  const groups = await Promise.all(SITE_CATEGORIES.map(async ({ key }) => {
    const folder = siteFolder(userId, savedId, key);
    const files: SiteFile[] = [];
    let offset = 0;
    while (true) {
      const { data, error } = await supabase.storage.from(SITE_BUCKET).list(folder, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      for (const file of data ?? []) {
        if (!file.id) continue;
        files.push({ category: key, path: `${folder}/${file.name}`, name: file.name.replace(/^[0-9a-f-]{36}_/i, ""), url: "", isImage: /image\/(jpeg|png|webp)/.test(file.metadata?.mimetype ?? "") });
      }
      if ((data?.length ?? 0) < 100) break;
      offset += 100;
    }
    return files;
  }));
  const files = groups.flat();
  if (!files.length) return files;
  const { data, error } = await supabase.storage.from(SITE_BUCKET).createSignedUrls(files.map(f => f.path), 3600);
  if (error) throw error;
  return files.map((file, index) => ({ ...file, url: data?.[index]?.signedUrl ?? "" }));
}

export async function loadSiteNotes(savedId: string): Promise<SiteNotes> {
  const { data, error } = await supabase.from("solar_site_intake").select("notes").eq("saved_assessment_id", savedId).maybeSingle();
  if (error) throw error;
  return readSiteNotes(data?.notes);
}

export async function saveSiteNotes(userId: string, savedId: string, notes: SiteNotes) {
  const { error } = await supabase.from("solar_site_intake").upsert({ saved_assessment_id: savedId, user_id: userId, notes, updated_at: new Date().toISOString() });
  if (error) throw error;
}