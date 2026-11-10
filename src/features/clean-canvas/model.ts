import { z } from "zod";

export const CLEAN_CANVAS_TOPICS = [
  "Energy supply",
  "Grid & storage",
  "Energy efficiency",
  "Transportation",
  "Housing & buildings",
  "Community & equity",
  "Other",
] as const;

export type CleanCanvasTopic = (typeof CLEAN_CANVAS_TOPICS)[number];
export type VoteChoice = "support" | "oppose";
export type IdeaSort = "supported" | "newest" | "discussed";

const webAddress = z.string().trim().max(1000, "Link must be less than 1,000 characters").refine((value) => {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !!url.hostname;
  } catch {
    return false;
  }
}, "Enter a complete HTTP or HTTPS web address");

export const resourceSchema = z.object({
  label: z.string().trim().min(1, "Add a label for this resource").max(120, "Label must be less than 120 characters"),
  url: webAddress,
});

export const ideaSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(160, "Title must be less than 160 characters"),
  description: z.string().trim().min(20, "Add at least 20 characters so others can understand the idea").max(4000, "Description must be less than 4,000 characters"),
  topic: z.enum(CLEAN_CANVAS_TOPICS),
  author_name: z.string().trim().min(2, "Display name must be at least 2 characters").max(80, "Display name must be less than 80 characters"),
  resources: z.array(resourceSchema).max(5, "Add up to five supporting links"),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment first").max(2000, "Comments must be less than 2,000 characters"),
  author_name: z.string().trim().min(2, "Display name must be at least 2 characters").max(80, "Display name must be less than 80 characters"),
});

export type CleanCanvasResource = z.infer<typeof resourceSchema>;

export interface CleanCanvasIdea {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  description: string;
  topic: string;
  resources: CleanCanvasResource[];
  support_count: number;
  oppose_count: number;
  comment_count: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CleanCanvasComment {
  id: string;
  idea_id: string;
  parent_id: string | null;
  author_id: string;
  author_name: string;
  body: string;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export function ideaFromRow(row: Omit<CleanCanvasIdea, "resources"> & { resources: unknown }): CleanCanvasIdea {
  const parsed = z.array(resourceSchema).safeParse(row.resources);
  return { ...row, resources: parsed.success ? parsed.data : [] };
}

export function filterAndSortIdeas(
  ideas: CleanCanvasIdea[],
  options: { query: string; topic: string; sort: IdeaSort },
): CleanCanvasIdea[] {
  const query = options.query.trim().toLocaleLowerCase();
  return ideas
    .filter((idea) => !options.topic || idea.topic === options.topic)
    .filter((idea) => {
      if (!query) return true;
      return [idea.title, idea.description, idea.author_name, idea.topic, ...idea.resources.map((r) => r.label)]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    })
    .sort((a, b) => {
      if (options.sort === "newest") return b.created_at.localeCompare(a.created_at);
      if (options.sort === "discussed") return b.comment_count - a.comment_count || b.created_at.localeCompare(a.created_at);
      return b.support_count - b.oppose_count - (a.support_count - a.oppose_count)
        || b.support_count - a.support_count
        || b.created_at.localeCompare(a.created_at);
    });
}

/** Clicking the current choice withdraws it; choosing the other side changes it. */
export function nextVote(current: VoteChoice | null, incoming: VoteChoice): VoteChoice | null {
  return current === incoming ? null : incoming;
}
