import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
  contentClassName?: string;
}

const PageHeader = ({
  title,
  subtitle,
  backTo = "/",
  backLabel = "Back to Home",
  contentClassName = "max-w-5xl mx-auto px-4",
}: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-primary via-secondary to-accent">
      <div className={`${contentClassName} py-10`}>
        <div className="flex items-start justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(backTo)}
            className="-ml-3 text-white hover:bg-white/10"
          >
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            {backLabel}
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-white/70" />
            <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">
              Austin Clean Energy
            </span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{title}</h1>
        {subtitle && (
          <p className="text-white/80 max-w-2xl text-lg md:text-xl leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
