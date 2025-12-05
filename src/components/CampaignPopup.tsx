import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ============================================
// CAMPAIGN POPUP CONFIGURATION
// Edit these values to control popup behavior
// ============================================
export const CAMPAIGN_CONFIG = {
  // Set to true to enable the popup
  enabled: false,
  
  // Delay in milliseconds before showing popup (2000 = 2 seconds)
  delayMs: 2000,
  
  // Session storage key for tracking dismissal
  storageKey: "campaign-popup-dismissed",
  
  // Campaign content
  title: "Take Action: Stop Austin Gas Peakers",
  description: "Join the campaign to stop costly gas peaker plants in Austin. Your voice matters!",
  
  // Action Network widget ID
  widgetId: "stop-the-austin-gas-peaker-boondoggle-before-you-have-to-pay-for-it",
};
// ============================================

const CampaignPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Exit early if popup is disabled
    if (!CAMPAIGN_CONFIG.enabled) return;

    // Check if user has already dismissed the popup in this session
    const dismissed = sessionStorage.getItem(CAMPAIGN_CONFIG.storageKey);
    if (!dismissed) {
      const timer = setTimeout(() => setOpen(true), CAMPAIGN_CONFIG.delayMs);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    // Load Action Network CSS
    const link = document.createElement("link");
    link.href = "https://actionnetwork.org/css/style-embed-v3.css";
    link.rel = "stylesheet";
    link.type = "text/css";
    document.head.appendChild(link);

    // Load Action Network script
    const script = document.createElement("script");
    script.src = `https://actionnetwork.org/widgets/v5/letter/${CAMPAIGN_CONFIG.widgetId}?format=js&source=widget`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, [open]);

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      sessionStorage.setItem(CAMPAIGN_CONFIG.storageKey, "true");
    }
  };

  // Don't render anything if disabled
  if (!CAMPAIGN_CONFIG.enabled) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-destructive">
            {CAMPAIGN_CONFIG.title}
          </DialogTitle>
          <DialogDescription>
            {CAMPAIGN_CONFIG.description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div
            id={`can-letter-area-${CAMPAIGN_CONFIG.widgetId}`}
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
