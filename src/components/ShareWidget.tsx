import { useEffect, useRef, useState } from "react";
import { Share2, X, Twitter, Linkedin, Mail, MoreHorizontal, Sun } from "lucide-react";
import { toast } from "sonner";

const ShareWidget = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const title = typeof document !== "undefined" ? document.title : "Austin Clean Energy";
  const shareText = "Austin Clean Energy Opportunity Dashboard — data-driven insights for local clean energy.";

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const encoded = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(title);

  const xUrl = `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedText}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
  const mailUrl = `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encoded}`;

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

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: shareText, url });
      } catch {
        /* cancelled */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Share this page"
          className="absolute bottom-16 right-0 w-[min(92vw,360px)] rounded-2xl bg-background border border-border shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-foreground leading-tight">Austin Clean Energy</div>
                <div className="text-xs text-muted-foreground">austincleanenergy.net</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close share panel"
              className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border-l-4 border-primary bg-primary/5 px-4 py-3 mb-4">
            <div className="text-[10px] font-bold tracking-wider text-primary mb-1">SHARE THIS PAGE</div>
            <div className="text-sm font-semibold text-foreground line-clamp-2">{title}</div>
            <div className="text-xs text-muted-foreground mt-1 truncate">☀ austincleanenergy.net</div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <a
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border py-3 hover:bg-muted transition-colors"
            >
              <Twitter className="h-5 w-5" />
              <span className="text-sm font-medium">Post on X</span>
            </a>
            <a
              href={liUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border py-3 hover:bg-muted transition-colors"
            >
              <Linkedin className="h-5 w-5" />
              <span className="text-sm font-medium">LinkedIn</span>
            </a>
            <a
              href={fbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border py-3 hover:bg-muted transition-colors"
            >
              <Facebook className="h-5 w-5" />
              <span className="text-sm font-medium">Facebook</span>
            </a>
            <a
              href={mailUrl}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border py-3 hover:bg-muted transition-colors"
            >
              <Mail className="h-5 w-5" />
              <span className="text-sm font-medium">Email</span>
            </a>
          </div>

          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border py-3 mb-3 hover:bg-muted transition-colors"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-sm font-medium">More…</span>
          </button>

          <div className="flex gap-2">
            <div className="flex-1 min-w-0 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground truncate">
              {url}
            </div>
            <button
              onClick={handleCopy}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Share this page"
        aria-expanded={open}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center ring-4 ring-primary/15"
      >
        {open ? <X className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default ShareWidget;
