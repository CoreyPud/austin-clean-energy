import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Check, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  address: string;
}

const ShareAssessmentCard = ({ address }: Props) => {
  const [copied, setCopied] = useState(false);

  const buildShareUrl = () => {
    const url = new URL(window.location.href);
    url.pathname = "/property-assessment";
    url.searchParams.set("address", address);
    return url.toString();
  };

  const handleCopy = async () => {
    const shareUrl = buildShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied", {
        description: "Share it with a neighbor exploring clean energy.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: prompt
      window.prompt("Copy this link:", shareUrl);
    }
  };

  const handleNativeShare = async () => {
    const shareUrl = buildShareUrl();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "My Austin clean energy profile",
          text: `See clean energy options for ${address}`,
          url: shareUrl,
        });
      } catch {
        // user cancelled — no-op
      }
    } else {
      handleCopy();
    }
  };

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Card className="border-2 border-border shadow-sm">
      <CardContent className="py-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="rounded-full bg-primary/10 p-3 shrink-0">
            <Share2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">
              Help a neighbor explore their options
            </h3>
            <p className="text-sm text-muted-foreground">
              Share this profile so others on your block can see what's possible at their address.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            {canNativeShare && (
              <Button onClick={handleNativeShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareAssessmentCard;
