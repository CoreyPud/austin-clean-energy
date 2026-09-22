import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Lightbulb, BarChart3, Search } from "lucide-react";
import heroImage from "@/assets/hero-austin-solar.jpg";
import CampaignPopup from "@/components/CampaignPopup";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useSeo } from "@/hooks/use-seo";

const CHOICES = [
  {
    to: "/property-assessment",
    icon: Home,
    title: "Residential Solar",
    description: "See your home's solar potential, including Austin Energy rebates, and Federal Incentives.",
  },
  {
    to: "/what-you-can-do",
    icon: Lightbulb,
    title: "What You Can Do",
    description:
      "Explore clean energy options, compare electric and gas vehicles, and build a personalized clean energy plan.",
  },
  {
    to: "/austin-at-a-glance",
    icon: BarChart3,
    title: "Austin at a Glance",
    description: "Track solar and EV growth, energy spending, utility decisions, and Austin's clean energy progress.",
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
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {CHOICES.map(({ to, icon: Icon, title, description }) => (
            <Link
              key={title}
              to={to}
              className="group flex flex-col items-start gap-4 rounded-xl border bg-card p-7 text-left transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold leading-snug">{title}</h2>
              <p className="text-base text-muted-foreground">{description}</p>
              <span className="mt-auto pt-3 inline-flex items-center text-sm font-medium text-primary">
                Get started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
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
