import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FeatureCardProps {
  to: string;
  title: string;
  description: string;
  cta: string;
  preview: React.ReactNode;
}

const FeatureCard = ({ to, title, description, cta, preview }: FeatureCardProps) => (
  <Link to={to} className="group block">
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border hover:border-primary/40 overflow-hidden flex flex-col h-full">
      {preview}
      <CardContent className="pt-4 pb-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-semibold text-xl mb-2">{title}</h3>
          <p className="text-base text-muted-foreground">{description}</p>
        </div>
        <div className="flex justify-end mt-auto pt-2">
          <Button variant="ghost" className="group-hover:bg-primary group-hover:text-white transition-colors">
            {cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default FeatureCard;
