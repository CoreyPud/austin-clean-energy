import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, Calendar, Trophy, Target } from "lucide-react";

interface PersonalizedPlanDisplayProps {
  markdown: string;
}

interface ParsedPlan {
  topMoves: { title: string; description: string }[];
  thisMonth: string[];
  thisYear: string[];
  intro?: string;
  rest?: string; // any unparsed trailing markdown
}

/**
 * Parses the AI personalized plan into the three visual sections.
 * Falls back gracefully when sections are missing.
 *
 * Expected format (from unified-assessment edge function):
 *   **Your Top 3 Moves**
 *   1. **Title**: description...
 *   2. **Title**: description...
 *   3. **Title**: description...
 *
 *   **This Month**
 *   - bullet
 *
 *   **This Year**
 *   - bullet
 */
function parsePlan(md: string): ParsedPlan {
  const result: ParsedPlan = { topMoves: [], thisMonth: [], thisYear: [] };
  if (!md) return result;

  // Split on the bolded section headings (case-insensitive)
  const sectionRegex = /\*\*\s*(Your Top 3 Moves|Top 3 Moves|This Month|This Year)\s*\*\*/gi;
  const matches = [...md.matchAll(sectionRegex)];

  if (matches.length === 0) {
    result.rest = md;
    return result;
  }

  // Anything before the first match is intro
  if (matches[0].index! > 0) {
    const intro = md.slice(0, matches[0].index).trim();
    if (intro) result.intro = intro;
  }

  matches.forEach((m, i) => {
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : md.length;
    const body = md.slice(start, end).trim();
    const heading = m[1].toLowerCase();

    if (heading.includes("top 3")) {
      // Numbered list "1. **Title**: description"
      const items = [...body.matchAll(/^\s*\d+\.\s*(.+)$/gm)];
      result.topMoves = items.map((it) => {
        const raw = it[1].trim();
        const titleMatch = raw.match(/^\*\*(.+?)\*\*\s*[:—-]?\s*(.*)$/s);
        if (titleMatch) {
          return { title: titleMatch[1].trim(), description: titleMatch[2].trim() };
        }
        // Fallback: split on first colon
        const idx = raw.indexOf(":");
        return idx > 0
          ? { title: raw.slice(0, idx).replace(/\*\*/g, "").trim(), description: raw.slice(idx + 1).trim() }
          : { title: raw.replace(/\*\*/g, "").trim(), description: "" };
      });
    } else if (heading.includes("this month")) {
      result.thisMonth = parseBullets(body);
    } else if (heading.includes("this year")) {
      result.thisYear = parseBullets(body);
    }
  });

  return result;
}

function parseBullets(body: string): string[] {
  return body
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => /^[-*•]\s+/.test(l))
    .map((l) => l.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
}

function MarkdownInline({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: (p) => <span {...p} />,
        strong: (p) => <strong {...p} className="text-foreground font-semibold" />,
        a: (p) => (
          <a
            {...p}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          />
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

const PersonalizedPlanDisplay = ({ markdown }: PersonalizedPlanDisplayProps) => {
  const parsed = parsePlan(markdown);
  const hasStructure =
    parsed.topMoves.length > 0 || parsed.thisMonth.length > 0 || parsed.thisYear.length > 0;

  // Fallback to plain markdown render if we can't parse the structure
  if (!hasStructure) {
    return (
      <Card className="border-2 border-primary/30">
        <CardContent className="p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {parsed.intro && (
        <Card className="border bg-muted/30">
          <CardContent className="p-4 text-sm text-foreground/90">
            <MarkdownInline text={parsed.intro} />
          </CardContent>
        </Card>
      )}

      {/* Top 3 Moves */}
      {parsed.topMoves.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Your Top {parsed.topMoves.length} Moves
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {parsed.topMoves.map((move, i) => (
              <Card
                key={i}
                className="relative border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md">
                  {i + 1}
                </div>
                <CardContent className="pt-6 pl-12 p-5">
                  <h4 className="font-semibold text-foreground mb-1.5 leading-tight">
                    {move.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <MarkdownInline text={move.description} />
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* This Month */}
        {parsed.thisMonth.length > 0 && (
          <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-background">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                  This Month
                </h3>
              </div>
              <ul className="space-y-2.5">
                {parsed.thisMonth.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>
                      <MarkdownInline text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* This Year */}
        {parsed.thisYear.length > 0 && (
          <Card className="border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-background">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-secondary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                  This Year
                </h3>
              </div>
              <ol className="space-y-2.5">
                {parsed.thisYear.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-foreground/90">
                    <span className="h-5 w-5 rounded-full bg-secondary/20 text-secondary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>
                      <MarkdownInline text={item} />
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </div>

      {parsed.rest && (
        <Card className="border bg-muted/20">
          <CardContent className="p-4 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{parsed.rest}</ReactMarkdown>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonalizedPlanDisplay;
