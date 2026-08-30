import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, Users, ExternalLink } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import {
  LEADERS,
  SOURCES,
  FUEL_COLOR,
  FUEL_LABEL,
  sortedMilestones,
  milestonesByContract,
  sortedRetirements,
  type Milestone,
} from "@/lib/people-with-power";


const NOT_DOCUMENTED = (
  <span className="text-muted-foreground italic">not documented</span>
);

const SourceLinks = ({ keys }: { keys: string[] }) => (
  <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
    {keys.map((k) => {
      const s = SOURCES[k];
      if (!s) return null;
      return (
        <a
          key={k}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          title={s.label}
        >
          {s.label.split("—")[0].trim()}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    })}
  </span>
);

const Swatch = ({ fuel }: { fuel: Milestone["fuel"] }) => (
  <span
    className="inline-block h-3 w-3 shrink-0 rounded-sm align-middle"
    style={{ backgroundColor: FUEL_COLOR[fuel] }}
    aria-hidden
  />
);




const PeopleWithPower = () => {
  useSeo({
    title: "People With Power: Who Ran Austin Energy",
    description:
      "Which Austin Energy general manager was in office when coal, nuclear, wind, solar, biomass and batteries first entered the utility's portfolio — with sourced background on each leader.",
  });

  const milestones = sortedMilestones();
  const byContract = milestonesByContract();
  const retirements = sortedRetirements();



  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="People With Power"
        subtitle="Every fuel Austin Energy added arrived on somebody's watch. This page lines up the utility's leadership with the first appearance of each type of generation — and says plainly where the public record runs out."
        contentClassName="max-w-6xl mx-auto px-4"
      />

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>About party affiliation</AlertTitle>
          <AlertDescription>
            Austin Energy general managers are appointed city staff hired by the city manager, not
            elected officials — and Texas does not register voters by party. So there is no public
            party affiliation to report for any of them, and none is shown here. What is documented
            is their professional track and the perspective they publicly brought to the job, which
            is what the cards below cover.
          </AlertDescription>
        </Alert>

        {/* Contract-date table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Who was leading Austin Energy when the contract was signed
            </CardTitle>
            <CardDescription>
              Sorted by the date the deal was authorized, not the date the plant started running.
              The contract date is the one that reflects who actually made the decision — projects
              routinely come online years later, under someone else.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Resource</th>
                  <th className="py-2 pr-3">Contract date</th>
                  <th className="py-2 pr-3">Leading Austin Energy at contract</th>
                  <th className="py-2 pr-3">First operation</th>
                  <th className="py-2">Sources</th>
                </tr>
              </thead>
              <tbody>
                {byContract.map((m) => (
                  <tr
                    key={`c-${m.resource}`}
                    className="border-b border-border/60 align-top"
                  >
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <Swatch fuel={m.fuel} />
                        {FUEL_LABEL[m.fuel]}
                      </span>
                      <span className="block text-xs text-muted-foreground">{m.resource}</span>
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      <span className="font-medium text-foreground">
                        {m.contractDate ?? NOT_DOCUMENTED}
                      </span>
                      {m.contractNote && (
                        <span className="mt-1 block text-muted-foreground">{m.contractNote}</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {m.contractLeader ?? NOT_DOCUMENTED}
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap text-xs text-muted-foreground">
                      {m.year}
                      {m.leader && (
                        <span className="mt-1 block">under {m.leader}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <SourceLinks keys={m.contractSources} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Retirements table */}
        <Card>
          <CardHeader>
            <CardTitle>Plants retired and wound down</CardTitle>
            <CardDescription>
              Shutting a plant is a decision too, and it often outlives the leader who made it.
              Sorted by when the closure was decided.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Plant</th>
                  <th className="py-2 pr-3">Closure decided</th>
                  <th className="py-2 pr-3">Leading Austin Energy at the decision</th>
                  <th className="py-2 pr-3">Actually stopped</th>
                  <th className="py-2 pr-3">What happened</th>
                  <th className="py-2">Sources</th>
                </tr>
              </thead>
              <tbody>
                {retirements.map((r) => (
                  <tr key={`r-${r.resource}`} className="border-b border-border/60 align-top">
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <Swatch fuel={r.fuel} />
                        {FUEL_LABEL[r.fuel]}
                      </span>
                      <span className="block text-xs text-muted-foreground">{r.resource}</span>
                    </td>
                    <td className="py-3 pr-3 text-xs font-medium text-foreground">
                      {r.decisionDate ?? NOT_DOCUMENTED}
                    </td>
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {r.decisionLeader ?? NOT_DOCUMENTED}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      <span className="text-foreground">{r.closedDate}</span>
                      <span className="mt-1 block text-muted-foreground">
                        {r.closedLeader ? `under ${r.closedLeader}` : "leader at shutdown not documented"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 max-w-sm text-muted-foreground">
                      {r.what}
                      {r.note && (
                        <span className="mt-1 block text-xs italic">{r.note}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <SourceLinks keys={r.sources} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>



        {/* Tenure list */}
        <Card>
          <CardHeader>
            <CardTitle>Documented tenures</CardTitle>
            <CardDescription>
              Gaps are eras where no named utility director is documented in public sources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {LEADERS.map((l) => (
                  <tr key={l.name} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-medium text-foreground">{l.name}</td>
                    <td className="py-2 text-muted-foreground">{l.tenure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>


        {/* Fuel-firsts table */}
        <Card>
          <CardHeader>
            <CardTitle>Who was in charge when each fuel arrived</CardTitle>
            <CardDescription>
              One row per first-of-its-kind addition. Where the leader at the time cannot be
              sourced, the row says so instead of naming a likely candidate.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Resource</th>
                  <th className="py-2 pr-3">Year</th>
                  <th className="py-2 pr-3">What happened</th>
                  <th className="py-2 pr-3">Utility leader</th>
                  <th className="py-2">Sources</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr
                    key={`${m.resource}-${m.year}`}
                    className="border-b border-border/60 align-top"
                  >
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <Swatch fuel={m.fuel} />
                        {FUEL_LABEL[m.fuel]}
                      </span>
                      <span className="block text-xs text-muted-foreground">{m.resource}</span>
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap font-mono text-xs">{m.year}</td>
                    <td className="py-3 pr-3 max-w-sm text-muted-foreground">{m.what}</td>
                    <td className="py-3 pr-3">
                      <span className="font-medium text-foreground">
                        {m.leader ?? NOT_DOCUMENTED}
                      </span>
                      {m.note && (
                        <span className="mt-1 block text-xs text-muted-foreground">{m.note}</span>
                      )}
                      {m.framing && (
                        <span className="mt-1 block text-xs text-foreground/80">
                          “{m.framing}”
                        </span>
                      )}
                      {!m.framing && m.leader && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          No public quote from the leader about this decision is documented.
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <SourceLinks keys={m.sources} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Leader cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">The people</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Background is drawn from contemporaneous reporting and city records. The “perspective”
            line is a characterization of how each leader publicly framed the job — it is
            interpretation, not a quote, and each card links to what it is based on.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {LEADERS.map((l) => (
              <Card key={l.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{l.name}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {l.tenure}
                    </Badge>
                  </div>
                  <CardDescription>{l.title}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Came from
                    </span>
                    <p className="text-foreground">{l.cameFrom ?? NOT_DOCUMENTED}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Background
                    </span>
                    <p className="text-foreground">{l.background ?? NOT_DOCUMENTED}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Perspective they brought
                    </span>
                    <p className="text-foreground">{l.perspective ?? NOT_DOCUMENTED}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Party affiliation
                    </span>
                    <p className="text-muted-foreground">
                      Not applicable — appointed staff, no public party record.
                    </p>
                  </div>
                  <SourceLinks keys={l.sources} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Caveats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to read this, and what is missing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Pre-1990 records are thin. The gas plants at Seaholm and Holly, the 1979 Fayette coal
              startup and the 1988 nuclear startup all predate the well-documented general manager
              era, so no individual is named for them here. The Decker gas station's original
              in-service year could not be sourced precisely and is therefore not listed as a
              separate milestone.
            </p>
            <p>
              Being in office when a resource came online is not the same as having decided on it.
              Generation projects take years to a decade; the person at the ribbon-cutting is often
              not the person who signed the contract. Battery storage is shown spanning two leaders
              for exactly that reason.
            </p>
            <p>
              Wind is a special case: the early West Texas capacity serving the Austin area came
              through regional contracting rather than an Austin Energy build, and sources disagree
              on whether the first phase came online in 1996 or 1999.
            </p>
            <p>
              For the dollars behind these resources, see the{" "}
              <a href="/power-money" className="text-primary hover:underline">
                Power Money
              </a>{" "}
              page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PeopleWithPower;
