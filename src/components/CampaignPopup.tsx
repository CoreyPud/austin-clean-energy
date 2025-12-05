import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const CampaignPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the popup in this session
    const dismissed = sessionStorage.getItem("campaign-popup-dismissed");
    if (!dismissed) {
      // Show popup after a short delay
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (open) {
      // Load Action Network CSS
      const link = document.createElement("link");
      link.href = "https://actionnetwork.org/css/style-embed-v3.css";
      link.rel = "stylesheet";
      link.type = "text/css";
      document.head.appendChild(link);

      // Load Action Network script
      const script = document.createElement("script");
      script.src =
        "https://actionnetwork.org/widgets/v5/letter/stop-the-austin-gas-peaker-boondoggle-before-you-have-to-pay-for-it?format=js&source=widget";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.head.removeChild(link);
        document.body.removeChild(script);
      };
    }
  }, [open]);

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      sessionStorage.setItem("campaign-popup-dismissed", "true");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-destructive">
            Take Action: Stop Austin Gas Peakers
          </DialogTitle>
          <DialogDescription>
            Join the campaign to stop costly gas peaker plants in Austin. Your voice matters!
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div
            id="can-letter-area-stop-the-austin-gas-peaker-boondoggle-before-you-have-to-pay-for-it"
            style={{ width: "100%" }}
          >
            {/* Action Network widget loads here */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignPopup;
