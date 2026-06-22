import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { EVResults } from "@/lib/ev-model";

interface Props {
  results: EVResults;
}

const FG   = "hsl(var(--foreground))";
const PRI  = "hsl(var(--primary))";
const BG   = "hsl(var(--background))";
const MUT  = "hsl(var(--muted))";
const MUTFG = "hsl(var(--muted-foreground))";
const SEC  = "hsl(var(--secondary))";

const EVEnvironmentalImpact = ({ results }: Props) => {
  const [showMethodology, setShowMethodology] = useState(false);
  const { co2AvoidedKgPerYear, treesEquivalent, flightsEquivalent, gasCo2KgPerYear, evCo2KgPerYear } = results;

  const metricTons = (co2AvoidedKgPerYear / 1000).toFixed(1);

  return (
    <Card className="border-2 border-primary/20 shadow-md bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="pt-5 pb-5">
        <p className="text-sm text-muted-foreground mb-4">
          Switching to an EV avoids{" "}
          <span className="font-semibold text-foreground">{metricTons} metric tons</span>{" "}
          of CO₂ per year compared to driving a gas vehicle, equivalent to:
        </p>

        <div className="grid grid-cols-3 gap-6 mb-4">
          {/* Trees */}
          <ImpactStat
            icon={
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M18 4L8.5 20.5H16L4.5 38.5H11.5L1.5 53.5H40.5L29 37H36.5L24 20L31 19L18 4Z" fill={PRI} stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 53.5H25V62H17V53.5Z" fill={MUTFG} stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="42" y="5" width="20" height="43" rx="10" fill={MUT} stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M48 37L52 40.5V61.5" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M49 61.5H55" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            value={treesEquivalent.toLocaleString()}
            label="Trees planted"
          />

          {/* Flights */}
          <ImpactStat
            icon={
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M18 52.6182C18 52.2394 18.214 51.8931 18.5528 51.7237L31.5528 45.2237C31.8343 45.083 32.1657 45.083 32.4472 45.2237L45.4472 51.7237C45.786 51.8931 46 52.2394 46 52.6182V55.0001C46 55.5524 45.5523 56.0001 45 56.0001H19C18.4477 56.0001 18 55.5524 18 55.0001V52.6182Z" fill={SEC} stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 36.0787C2 34.9191 2.64201 33.8591 3.65836 33.3405L31.5528 19.1077C31.8343 18.9641 32.1657 18.9641 32.4472 19.1077L60.3416 33.3405C61.358 33.8591 62 34.9191 62 36.0787V40.9789C62 41.6624 61.3543 42.1527 60.7127 41.9563L32.2873 33.2541C32.0999 33.1967 31.9001 33.1967 31.7127 33.2541L3.28735 41.9563C2.64574 42.1527 2 41.6624 2 40.9789V36.0787Z" fill={SEC} stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M56 28.5V26C56 25.4477 55.5523 25 55 25H52C51.4477 25 51 25.4477 51 26V26.5" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 28.5V26C8 25.4477 8.44772 25 9 25H12C12.5523 25 13 25.4477 13 26V26.5" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M26 9C26 7 29 1 32 1C35 1 38 7 38 9C38 12.1855 38 42.0071 38 54.0206C38 56.782 35.7614 59 33 59H31C28.2386 59 26 56.782 26 54.0206C26 42.0071 26 12.1855 26 9Z" fill={BG} stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M30.3729 52.8517C30.4463 52.3621 30.8668 52 31.3618 52H32.6395C33.1345 52 33.555 52.3621 33.6284 52.8517L34.5929 59.2815C34.8385 60.9191 34.0763 62.7153 32.4391 62.9642C32.2883 62.9871 32.1411 63 32.0006 63C31.8602 63 31.7129 62.9871 31.5622 62.9642C29.925 62.7153 29.1628 60.9191 29.4084 59.2815L30.3729 52.8517Z" fill={SEC} stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M53.5 46V55.5" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M53.5 57.5V59.5" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 45V49.5" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 51.5V58.5" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M29.5 8.49997C31 7 33 7.00001 34.5 8.49997" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            value={flightsEquivalent.toLocaleString()}
            label="Round-trip flights avoided"
          />

          {/* CO2 */}
          <ImpactStat
            icon={
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <circle cx="32" cy="32" r="28" fill={PRI} fillOpacity="0.15" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="32" cy="32" r="16" fill={PRI} fillOpacity="0.3" stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 32 L32 20 L40 32 L32 44 Z" fill={PRI} stroke={FG} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            value={`${Math.round(co2AvoidedKgPerYear).toLocaleString()} kg`}
            label="CO₂ avoided per year"
          />
        </div>

        <div className="border-t pt-3">
          <button
            onClick={() => setShowMethodology(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMethodology ? "rotate-180" : ""}`} />
            How did we calculate this?
          </button>

          {showMethodology && (
            <div className="mt-3 text-xs text-muted-foreground leading-relaxed space-y-1.5">
              <p>
                <strong className="text-foreground">Gas emissions:</strong> EPA standard of 8.89 kg CO₂ per gallon of gasoline burned.
                Your gas vehicle produces {Math.round(gasCo2KgPerYear).toLocaleString()} kg CO₂/year.
              </p>
              <p>
                <strong className="text-foreground">EV emissions:</strong> Austin Energy grid intensity of 200 kg CO₂ per MWh —
                roughly 55% carbon-free (wind, solar, nuclear), about half the ERCOT grid average.
                Your EV produces {Math.round(evCo2KgPerYear).toLocaleString()} kg CO₂/year charging on Austin Energy.
              </p>
              <p>
                <strong className="text-foreground">Equivalencies:</strong> Trees absorb ~21 kg CO₂/year.
                Round-trip flights use the EPA average of 255 kg CO₂ per passenger for a typical domestic round trip.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ImpactStat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="text-center space-y-1">
    <div className="flex justify-center mb-2">{icon}</div>
    <div className="text-2xl font-bold tabular-nums text-primary">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

export default EVEnvironmentalImpact;
