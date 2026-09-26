import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Sun } from "lucide-react";
import heroImage from "@/assets/hero-austin-solar.jpg";
import CampaignPopup from "@/components/CampaignPopup";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useSeo } from "@/hooks/use-seo";
import FeatureCard from "@/components/FeatureCard";
import { EvCostPreview, ImagePreview } from "@/components/FeaturePreviews";

// Card previews come from FeaturePreviews, shared with the section pages that link to the
// same tools.
const CHOICES = [
  {
    to: "/property-assessment",
    title: "Your Solar Potential",
    description: "See what solar could do for your property, including Austin Energy rebates and Federal Incentives.",
    // A real calculator result (roof layout drawn over satellite imagery), captured as a
    // static image so the homepage doesn't load the live map.
    preview: (
      <ImagePreview
        src="/solar-potential-preview.jpg"
        alt="Solar panel layout drawn on a house roof in the calculator"
        placeholder={<Sun className="h-8 w-8 opacity-30" />}
        credit="© Mapbox © Maxar"
      />
    ),
  },
  {
    to: "/what-you-can-do",
    title: "What You Can Do",
    description:
      "Explore clean energy options, compare electric and gas vehicles, and build a personalized clean energy plan.",
    preview: <EvCostPreview />,
  },
  {
    to: "/austin-at-a-glance",
    title: "Austin at a Glance",
    description: "Track solar and EV growth, energy spending, utility decisions, and Austin's clean energy progress.",
    preview: (
      <ImagePreview
        src="/city-map-preview.png"
        alt="Austin solar installations map"
        placeholder={<MapPin className="h-8 w-8 opacity-30" />}
      />
    ),
  },
];

const Index = () => {
  useSeo({
    title: "Austin Clean Energy: Solar Savings and City Progress",
    description:
      "Check solar savings for your home or business in Austin, and follow the city's clean energy progress with real permit, spending, and adoption data.",
  });
  const navigate = useNavigate();
  const [address, setAddress] = useState("");

  const goToAssessment = () => {
    const trimmed = address.trim();
    navigate(trimmed ? `/property-assessment?address=${encodeURIComponent(trimmed)}` : "/property-assessment");
  };

  return (
    <div className="min-h-screen">
      <CampaignPopup />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-secondary/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Help Build Austin's Clean Energy Future
          </h1>
          <p className="text-lg md:text-xl text-white/90 leading-relaxed">
            Austin is in the middle of a clean energy shift. We help you find savings on clean energy, and make the data
            accessible so anyone can be informed on the city's progress, and what it means for your household and
            community.
          </p>
        </div>
      </section>

      {/* Three choices */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
          {CHOICES.map(({ to, title, description, preview }) => (
            <FeatureCard key={title} to={to} title={title} description={description} cta="Get started" preview={preview} />
          ))}
        </div>

        {/* Address search */}
        <div className="max-w-2xl mx-auto mt-14 text-center">
          <h2 className="text-2xl font-bold mb-2">Start with your address</h2>
          <p className="text-muted-foreground mb-5">
            Enter an Austin, Texas address and we will carry it into the assessment so you can pick your options and run
            it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  goToAssessment();
                }
              }}
              className="h-12 flex-1 text-base"
            />
            <Button size="lg" onClick={goToAssessment} className="h-12 sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              Check solar potential
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
