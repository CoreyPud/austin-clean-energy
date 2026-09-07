import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import PropertyPage from "./PropertyPage";

/**
 * Renders PropertyPage as a Zillow-style modal on top of Explore, single-sourcing the same
 * property detail page used for direct/shared links. Only mounted when the route was reached
 * with a background location in state (see App.tsx's AppRoutes) -- a direct visit to
 * /property/:pid renders PropertyPage as a normal full page instead.
 */
export default function PropertyOverlay() {
  const navigate = useNavigate();
  const close = () => navigate(-1);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 overflow-y-auto"
      onClick={close}
    >
      <div className="min-h-full flex items-start justify-center p-2 sm:p-6">
        <div
          className="relative w-full max-w-5xl bg-background rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={close}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md border border-border text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-h-[92vh] overflow-y-auto">
            <PropertyPage />
          </div>
        </div>
      </div>
    </div>
  );
}
