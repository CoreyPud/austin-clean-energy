import { Landmark, Users, FileText, Vote as VoteIcon, type LucideIcon } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";

// Replaces the old CouncilNav tab/cross-link row: instead of a persistent sub-nav,
// each council accountability page links to the other three as cards at the bottom,
// matching how every other section of the site cross-links (see AustinAtGlance, Index).
type PageKey = "overview" | "members" | "decisions" | "vote";

const PAGES: Record<PageKey, { to: string; title: string; description: string; cta: string; icon: LucideIcon }> = {
  overview: {
    to: "/council",
    title: "Who Really Influences Council",
    description: "Campaign finance and lobbying by industry, and the companies funding city hall.",
    cta: "See the influence picture",
    icon: Landmark,
  },
  members: {
    to: "/council-members",
    title: "Council Report Card",
    description: "Campaign money and climate votes, broken down member by member.",
    cta: "View members",
    icon: Users,
  },
  decisions: {
    to: "/council-decisions",
    title: "Climate & Energy Decisions",
    description: "Every council climate decision from the meeting minutes, with outcome and vote.",
    cta: "See the decisions",
    icon: FileText,
  },
  vote: {
    to: "/council-vote",
    title: "Vote on Agenda Items",
    description: "Share your opinion on what council is voting on now, then see how others voted.",
    cta: "Cast your vote",
    icon: VoteIcon,
  },
};

export default function CouncilPageCards({ current }: { current: PageKey }) {
  const others = (Object.keys(PAGES) as PageKey[]).filter((k) => k !== current);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">More on council accountability</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {others.map((key) => {
          const p = PAGES[key];
          const Icon = p.icon;
          return (
            <FeatureCard
              key={key}
              to={p.to}
              title={p.title}
              description={p.description}
              cta={p.cta}
              preview={
                <div className="pointer-events-none bg-muted/10 border-b flex flex-col items-center justify-center gap-3 h-[140px]">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              }
            />
          );
        })}
      </div>
    </section>
  );
}
