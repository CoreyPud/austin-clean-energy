import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hotIdeas, type CleanCanvasIdea } from "./model";

export function HotTopics({ supported, opposed, onSelect }: { supported: CleanCanvasIdea[]; opposed: CleanCanvasIdea[]; onSelect: (idea: CleanCanvasIdea) => void }) {
  return <section aria-labelledby="hot-topics-heading" className="mb-8 border-b pb-6">
    <h2 id="hot-topics-heading" className="text-2xl font-semibold">Hot topics</h2>
    <div className="mt-4 grid gap-6 sm:grid-cols-2">
      {([{ choice: "support", label: "Top 5 supported", ideas: supported, Icon: ThumbsUp }, { choice: "oppose", label: "Top 5 not supported", ideas: opposed, Icon: ThumbsDown }] as const).map(({ choice, label, ideas, Icon }) => {
        const ranked = hotIdeas(ideas, choice);
        return <div key={choice} className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" />{label}</h3>
          {ranked.length ? <ol className="mt-2 divide-y">{ranked.map((idea, index) => <li key={idea.id}>
            <Button variant="ghost" className="h-auto w-full justify-start gap-2 whitespace-normal px-0 py-3 text-left" onClick={() => onSelect(idea)}>
              <span className="shrink-0 text-muted-foreground">{index + 1}.</span><span className="min-w-0 flex-1 break-words">{idea.title}</span><span className="shrink-0 text-xs text-muted-foreground">{choice === "support" ? idea.support_count : idea.oppose_count} {choice === "support" ? "support" : "oppose"}</span>
            </Button>
          </li>)}</ol> : <p className="mt-3 text-sm text-muted-foreground">No {choice === "support" ? "support" : "oppose"} votes yet.</p>}
        </div>;
      })}
    </div>
  </section>;
}