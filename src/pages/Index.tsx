import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Lightbulb, MapPin, Search } from "lucide-react";
import heroImage from "@/assets/hero-austin-solar.jpg";
import CampaignPopup from "@/components/CampaignPopup";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useSeo } from "@/hooks/use-seo";
import FeatureCard from "@/components/FeatureCard";
import { CalculatorPreview, PlanCategoriesPreview, ImagePreview } from "@/components/FeaturePreviews";

// Card previews come from FeaturePreviews, shared with the section pages that link to the
// same tools.
const CHOICES = [
  {
    to: "/solar-savings-austin",
    title: "Your Solar Potential",
    description: "See what solar could do for your property, including Austin Energy rebates and Federal Incentives.",
    preview: <CalculatorPreview />,
  },
  {
    to: "/what-you-can-do",
    title: "What You Can Do",
    description:
      "Explore clean energy options, compare electric and gas vehicles, and build a personalized clean energy plan.",
    preview: <PlanCategoriesPreview />,
  },
  {
    to: "/austin-at-a-glance",
    title: "Forecasts & Tools",
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
    navigate(trimmed ? `/solar-savings-austin?address=${encodeURIComponent(trimmed)}` : "/solar-savings-austin");
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
            Enter your Austin address to see your roof's solar potential.
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

      {/* Community ideas module */}
      <section className="container mx-auto px-4 pb-14">
        <Link to="/clean-energy-ideas-actions" className="group block">
          <Card className="overflow-hidden border transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-7 sm:p-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Lightbulb className="h-7 w-7 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="mb-2 text-2xl font-bold">Reliable, Affordable, and Clean Energy Ideas &amp; Actions</h2>
                <p className="text-base text-muted-foreground">
                  Share your own clean energy ideas for Austin, add the resources that back them up, vote on what
                  neighbors propose, and join the discussion.
                </p>
              </div>
              <Button
                size="lg"
                className="shrink-0 transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
              >
                Explore community ideas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </Link>
      </section>
    </div>
  );
};

export default Index;
