import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Copy, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Props {
  script: string;
  councilName: string;
  councilEmail?: string;
  district: string;
}

const CouncilOutreachCard = ({ script, councilName, councilEmail, district }: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      toast.success("Message copied", {
        description: "Paste it into your email and add your name.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this message:", script);
    }
  };

  const subject = encodeURIComponent(`Constituent message from ${district}`);
  const body = encodeURIComponent(script);
  const mailtoHref = councilEmail
    ? `mailto:${councilEmail}?subject=${subject}&body=${body}`
    : null;

  return (
    <Card className="border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 via-background to-background shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-secondary" />
          Sample message to {councilName}
        </CardTitle>
        <CardDescription>
          A starter outreach note tailored to your interests and your property. Edit before sending —
          the most effective constituent messages sound like you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-relaxed text-foreground">
          {script}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy message"}
          </Button>
          {mailtoHref && (
            <Button asChild className="gap-2 bg-secondary hover:bg-secondary/90">
              <a href={mailtoHref}>
                <Mail className="h-4 w-4" />
                Open in email
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CouncilOutreachCard;
