import { z } from "zod";

export const CLEAN_CANVAS_TOPICS = [
  "Energy supply",
  "Grid & storage",
  "Energy efficiency",
  "Transportation",
  "Housing & buildings",
  "Community & equity",
  "Policy, strategy, personnel",
  "Other",
] as const;

export type CleanCanvasTopic = (typeof CLEAN_CANVAS_TOPICS)[number];
export type VoteChoice = "support" | "oppose";
export type IdeaSort = "supported" | "newest" | "discussed";

export const IDEA_LEVELS = [
  { value: "local", label: "Local — Austin" },
  { value: "state", label: "State — Texas" },
  { value: "federal", label: "Federal — United States" },
] as const;

export const ideaDetailsSchema = z.object({
  problem: z.string().trim().min(1, "Describe the problem"),
  solution: z.string().trim().min(1, "Describe the solution"),
  beneficiaries: z.string().trim().min(1, "Tell us who it would help"),
  tradeoffs: z.string().trim().min(1, "Describe any tradeoffs, or say none known"),
  level: z.enum(["local", "state", "federal"], { errorMap: () => ({ message: "Select Local, State, or Federal" }) }),
});

export type IdeaDetails = z.infer<typeof ideaDetailsSchema>;

/** Human-readable storage preserves the existing description contract and older ideas. */
export function describeIdea(details: IdeaDetails): string {
  const level = IDEA_LEVELS.find((item) => item.value === details.level);
  return `Idea level: ${level?.label}\n\nWhat is the problem?\n${details.problem}\n\nWhat is the solution?\n${details.solution}\n\nWho would it help?\n${details.beneficiaries}\n\nAre there any tradeoffs?\n${details.tradeoffs}`;
}

export function detailsFromDescription(description: string): Partial<IdeaDetails> {
  const match = /^Idea level: (Local — Austin|State — Texas|Federal — United States)\n\nWhat is the problem\?\n([\s\S]*?)\n\nWhat is the solution\?\n([\s\S]*?)\n\nWho would it help\?\n([\s\S]*?)\n\nAre there any tradeoffs\?\n([\s\S]*)$/.exec(description);
  if (!match) return { problem: description };
  return { level: IDEA_LEVELS.find((item) => item.label === match[1])?.value, problem: match[2], solution: match[3], beneficiaries: match[4], tradeoffs: match[5] };
}

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
  topics: z.array(z.enum(CLEAN_CANVAS_TOPICS)).min(1, "Select at least one topic").max(CLEAN_CANVAS_TOPICS.length).refine((topics) => new Set(topics).size === topics.length, "Select each topic only once"),
  examples_elsewhere: z.string().trim().max(4000, "Examples must be less than 4,000 characters").default(""),
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
  topics: string[];
  examples_elsewhere: string;
  resources: CleanCanvasResource[];
  support_count: number;
  oppose_count: number;
  comment_count: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
  edit_count: number;
  edited_at: string | null;
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

export function ideaFromRow(row: Omit<CleanCanvasIdea, "resources" | "topics" | "edit_count" | "edited_at"> & { resources: unknown; topics: string[] | null; edit_count?: number; edited_at?: string | null }): CleanCanvasIdea {
  const parsed = z.array(resourceSchema).safeParse(row.resources);
  return { ...row, edit_count: row.edit_count ?? 0, edited_at: row.edited_at ?? null, topics: row.topics?.length ? row.topics : [row.topic], resources: parsed.success ? parsed.data : [] };
}

/** Activity timestamps also change on votes/comments; only authored edits change this date. */
export function ideaDisplayDate(idea: CleanCanvasIdea): string {
  return idea.edited_at ?? idea.created_at;
}

export function filterAndSortIdeas(
  ideas: CleanCanvasIdea[],
  options: { query: string; topic: string; sort: IdeaSort },
): CleanCanvasIdea[] {
  const query = options.query.trim().toLocaleLowerCase();
  return ideas
    .filter((idea) => !options.topic || idea.topics.includes(options.topic))
    .filter((idea) => {
      if (!query) return true;
      return [idea.title, idea.description, idea.author_name, ...idea.topics, idea.examples_elsewhere, ...idea.resources.map((r) => r.label)]
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

export function hotIdeas(ideas: CleanCanvasIdea[], choice: VoteChoice): CleanCanvasIdea[] {
  const count = choice === "support" ? "support_count" : "oppose_count";
  return ideas.filter((idea) => idea.visible && idea[count] > 0)
    .sort((a, b) => b[count] - a[count] || b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id)).slice(0, 5);
}

export const importedIdeaSchema = ideaSchema.pick({ title: true, description: true, topics: true, examples_elsewhere: true });
