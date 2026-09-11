import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackToHomeProps {
  to?: string;
  label?: string;
}

/** Small back link shown at the top of a page so visitors can return home. */
const BackToHome = ({ to = "/", label = "Back to Home" }: BackToHomeProps) => (
  <nav className="container mx-auto px-4 pt-4">
    <Button variant="ghost" asChild className="gap-2 text-foreground hover:text-primary">
      <Link to={to}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  </nav>
);

export default BackToHome;
