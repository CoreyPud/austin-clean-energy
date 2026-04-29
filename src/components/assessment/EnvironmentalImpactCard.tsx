import { Card, CardContent } from "@/components/ui/card";
import { environmentalImpact } from "@/lib/solar-model";

interface Props {
  annualSolarKwh: number;
}

const EnvironmentalImpactCard = ({ annualSolarKwh }: Props) => {
  const impact = environmentalImpact(annualSolarKwh);

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardContent className="pt-5 pb-5">
        <p className="text-xs text-muted-foreground mb-4">
          By going solar, your system will avoid{" "}
          <span className="font-semibold text-foreground">{impact.metricTonsCo2}</span> metric tons of
          CO₂e per year, equivalent to:
        </p>
        <div className="grid grid-cols-3 gap-6">
          <ImpactStat
            icon={
              <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M0.5 20.5L32.5 0.5L64.5 20.5H0.5Z" fill="white" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="25.5" y="12.5" width="14" height="4" fill="#E5E7EB" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="2.5" y="20.5" width="1" height="44" rx="0.5" fill="#111827"/>
                <rect x="61.5" y="20.5" width="1" height="44" rx="0.5" fill="#111827"/>
                <path d="M12.2545 39.5077C11.4767 38.1744 12.4385 36.5 13.9821 36.5H51.0179C52.5615 36.5 53.5233 38.1744 52.7455 39.5077L48.0788 47.5077C47.7204 48.1222 47.0626 48.5 46.3513 48.5H18.6487C17.9374 48.5 17.2796 48.1222 16.9212 47.5077L12.2545 39.5077Z" fill="#111827"/>
                <path d="M8.5 48.5C8.5 44.0817 12.0817 40.5 16.5 40.5H48.5C52.9183 40.5 56.5 44.0817 56.5 48.5V57.5H8.5V48.5Z" fill="#FF7B68" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.4107 33.8444C17.1491 31.2722 19.5017 29.5 22.1778 29.5H42.8222C45.4983 29.5 47.8509 31.2722 48.5893 33.8444L50.5 40.5H14.5L16.4107 33.8444Z" fill="white" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="50.5" cy="51.5" r="3" fill="white" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="14.5" cy="51.5" r="3" fill="white" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21.5 53.6818C21.5 49.1631 25.1631 45.5 29.6818 45.5H35.3182C39.8369 45.5 43.5 49.1631 43.5 53.6818C43.5 54.1337 43.1337 54.5 42.6818 54.5H22.3182C21.8663 54.5 21.5 54.1337 21.5 53.6818Z" fill="white" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.5 57.5H17.5V61.5C17.5 63.1569 16.1569 64.5 14.5 64.5C12.8431 64.5 11.5 63.1569 11.5 61.5V57.5Z" fill="#E5E7EB" stroke="#111827"/>
                <path d="M47.5 57.5H53.5V61.5C53.5 63.1569 52.1569 64.5 50.5 64.5C48.8431 64.5 47.5 63.1569 47.5 61.5V57.5Z" fill="#E5E7EB" stroke="#111827"/>
                <path d="M46.5 40.5C46.5 37.7386 44.0376 35.5 41 35.5C37.9624 35.5 35.5 37.7386 35.5 40.5" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            value={impact.carMilesAvoided.toLocaleString()}
            label="Car miles avoided"
          />
          <ImpactStat
            icon={
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M18 4L8.5 20.5H16L4.5 38.5H11.5L1.5 53.5H40.5L29 37H36.5L24 20L31 19L18 4Z" fill="#26C0B4" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 53.5H25V62H17V53.5Z" fill="#F98316" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="42" y="5" width="20" height="43" rx="10" fill="#CCF6F0" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M48 37L52 40.5V61.5" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M49 61.5H55" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            value={impact.treesEquivalent.toLocaleString()}
            label="Trees planted"
          />
          <ImpactStat
            icon={
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M18 52.6182C18 52.2394 18.214 51.8931 18.5528 51.7237L31.5528 45.2237C31.8343 45.083 32.1657 45.083 32.4472 45.2237L45.4472 51.7237C45.786 51.8931 46 52.2394 46 52.6182V55.0001C46 55.5524 45.5523 56.0001 45 56.0001H19C18.4477 56.0001 18 55.5524 18 55.0001V52.6182Z" fill="#85AFF6" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 36.0787C2 34.9191 2.64201 33.8591 3.65836 33.3405L31.5528 19.1077C31.8343 18.9641 32.1657 18.9641 32.4472 19.1077L60.3416 33.3405C61.358 33.8591 62 34.9191 62 36.0787V40.9789C62 41.6624 61.3543 42.1527 60.7127 41.9563L32.2873 33.2541C32.0999 33.1967 31.9001 33.1967 31.7127 33.2541L3.28735 41.9563C2.64574 42.1527 2 41.6624 2 40.9789V36.0787Z" fill="#85AFF6" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M56 28.5V26C56 25.4477 55.5523 25 55 25H52C51.4477 25 51 25.4477 51 26V26.5" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 28.5V26C8 25.4477 8.44772 25 9 25H12C12.5523 25 13 25.4477 13 26V26.5" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M26 9C26 7 29 1 32 1C35 1 38 7 38 9C38 12.1855 38 42.0071 38 54.0206C38 56.782 35.7614 59 33 59H31C28.2386 59 26 56.782 26 54.0206C26 42.0071 26 12.1855 26 9Z" fill="white" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M30.3729 52.8517C30.4463 52.3621 30.8668 52 31.3618 52H32.6395C33.1345 52 33.555 52.3621 33.6284 52.8517L34.5929 59.2815C34.8385 60.9191 34.0763 62.7153 32.4391 62.9642C32.2883 62.9871 32.1411 63 32.0006 63C31.8602 63 31.7129 62.9871 31.5622 62.9642C29.925 62.7153 29.1628 60.9191 29.4084 59.2815L30.3729 52.8517Z" fill="#85AFF6" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M53.5 46V55.5" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M53.5 57.5V59.5" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 45V49.5" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 51.5V58.5" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M29.5 8.49997C31 7 33 7.00001 34.5 8.49997" stroke="#111827" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            value={impact.flightsAvoided.toLocaleString()}
            label="Long haul flights avoided"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const ImpactStat = ({
  icon, value, label,
}: {
  icon: React.ReactNode; value: string; label: string;
}) => (
  <div className="text-center space-y-1">
    <div className="flex justify-center mb-2">{icon}</div>
    <div className="text-2xl font-bold tabular-nums">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

export default EnvironmentalImpactCard;
