import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle } from "lucide-react";

const FORM_ACTION =
  "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfDDzb_DouZV7dw-ZokNcF7Hf3Bhbsz-y-qhTwlEKSfr6uYVQ/formResponse";

const ContactCtaCard = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !message.trim()) return;
    setSubmitting(true);
    const body = new URLSearchParams({
      "entry.1386205263": email.trim(),
      "entry.261471367": name.trim(),
      "entry.1001404696": message.trim(),
    });
    try {
      await fetch(FORM_ACTION, { method: "POST", mode: "no-cors", body });
    } catch {}
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <Card className="border-2 border-secondary/30 shadow-md bg-gradient-to-br from-secondary/5 via-background to-background">
      <CardContent className="p-6">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle className="h-8 w-8 text-secondary" />
            <p className="font-semibold text-foreground">Thanks for contacting us — we'll be in touch!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xl font-bold text-foreground mb-1">Want help navigating your options?</p>
              <p className="text-sm text-muted-foreground">
                We're not a solar company — we're an independent resource here to help Austin homeowners
                understand rebates, incentives, and what questions to ask installers.
              </p>
            </div>
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Textarea
              placeholder="What questions do you have? (rebates, installers, your situation, timeline…)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              required
            />
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90"
            >
              {submitting ? "Sending…" : "Get in touch"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCtaCard;
