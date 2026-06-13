import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Copy, ExternalLink, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSeo } from "@/hooks/use-seo";

const SLACK_INVITE_URL =
  "https://join.slack.com/t/solaraustingroup/shared_invite/zt-40tsu7gxh-8exWmLou1xHM2l3NmfM9hQ";

const INVOLVEMENT_OPTIONS = [
  { value: "outreach_community", label: "Outreach & community building" },
  { value: "data_validation", label: "Data validation" },
  { value: "technical_work", label: "Technical work" },
  { value: "engineering_events", label: "Engineering / volunteering at events" },
] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  involvement_area: z.enum([
    "outreach_community",
    "data_validation",
    "technical_work",
    "engineering_events",
  ]),
  notes: z.string().trim().max(2000).optional(),
});

const JoinCommunity = () => {
  useSeo({
    title: "Join the Austin Clean Energy Community",
    description:
      "Connect with Austin Clean Energy volunteers on Slack. Tell us a little about you and we'll share the invite link.",
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website) return; // bot

    const parsed = schema.safeParse({
      name,
      email,
      involvement_area: area,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Please check the form";
      toast.error(first);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("volunteer_signups").insert({
        name: parsed.data.name,
        email: parsed.data.email,
        involvement_area: parsed.data.involvement_area,
        notes: parsed.data.notes ?? null,
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SLACK_INVITE_URL);
      toast.success("Slack invite link copied");
    } catch {
      toast.error("Could not copy — please copy the link manually");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-6">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Join the Austin Clean Energy Community
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          We're a group of Austin volunteers working to accelerate local clean
          energy progress. Tell us a little about who you are and how you'd like
          to help — once you submit, we'll share the invite link to our Slack
          community where the conversations and coordination happen.
        </p>

        {submitted ? (
          <Card className="border-2 border-secondary/40 bg-gradient-to-br from-secondary/5 via-background to-background">
            <CardContent className="p-8 text-center space-y-5">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-secondary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Thanks for signing up!
                </h2>
                <p className="text-muted-foreground">
                  Click below to join our Slack community. Introduce yourself in{" "}
                  <code className="text-foreground">#introductions</code> when
                  you arrive — we're glad to have you.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <a
                    href={SLACK_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Slack <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" onClick={copyLink} className="gap-2">
                  <Copy className="h-4 w-4" /> Copy invite link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Invite link: <span className="break-all">{SLACK_INVITE_URL}</span>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* honeypot */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">How would you like to get involved?</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger id="area">
                      <SelectValue placeholder="Choose an area" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOLVEMENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">
                    Anything else? (skills, interests, availability) — optional
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tell us a bit more about why you're interested or what you'd like to work on."
                    rows={4}
                    maxLength={2000}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit & get Slack invite"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We'll only use your info to coordinate volunteer efforts — no
                  spam, no sharing.
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JoinCommunity;
