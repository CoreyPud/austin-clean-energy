import { useState } from "react";
import { Share2, Twitter, Linkedin, Facebook, Mail, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ShareWidget = () => {
  const [copied, setCopied] = useState(false);
  // Read on open, not on render: this widget is mounted once in App and doesn't re-render on
  // client-side navigation, so render-time values go stale (wrong page title and URL).
  const [page, setPage] = useState({ url: "", title: "Austin Clean Energy" });
  const { url, title } = page;
  const handleOpenChange = (open: boolean) => {
    if (open) setPage({ url: window.location.href, title: document.title });
  };
  const shareText = "Austin Clean Energy Opportunity Dashboard: data-driven insights for local clean energy.";

  const encoded = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    { label: "X", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedText}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: "Email", icon: Mail, href: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encoded}` },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  // navigator.share is unreliable inside iframes and on desktop, so only offer it on mobile.
  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof window !== "undefined" &&
    window.top === window.self &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: shareText, url });
    } catch {
      // Cancelled or failed; the copy field is right there as a fallback.
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      <Popover onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button size="icon" className="h-11 w-11 rounded-full shadow-md" aria-label="Share this page">
            <Share2 className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-[min(92vw,340px)] space-y-4"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div>
            <p className="text-sm font-medium">Share this page</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{title}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {targets.map(({ label, icon: Icon, href }) => (
              <Button key={label} variant="outline" size="sm" className="justify-start" asChild>
                <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer">
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              </Button>
            ))}
            {canNativeShare && (
              <Button variant="outline" size="sm" className="justify-start col-span-2" onClick={handleNativeShare}>
                <MoreHorizontal className="h-4 w-4" />
                More options
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Input readOnly value={url} className="h-9 text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button size="sm" className="h-9 shrink-0" onClick={handleCopy}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ShareWidget;
