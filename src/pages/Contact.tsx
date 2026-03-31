import { Mail, Phone, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";

const Contact = () => {
  useSeo({
    title: "Contact Us",
    description:
      "Get in touch with the Austin Clean Energy team. We are volunteers driving awareness and education about Austin's clean energy future.",
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="container mx-auto px-4 py-4">
        <Button variant="ghost" asChild className="gap-2 text-foreground hover:text-primary">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </nav>

      <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-2xl">
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Austin Clean Energy is a volunteer-driven effort dedicated to raising
          awareness and education about the clean energy future that is possible
          right here in Austin. Whether you have questions, feedback, or ideas
          for collaboration, don't hesitate to reach out.
        </p>

        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <a
                  href="tel:+15183202601"
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  518-320-2601
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a
                  href="mailto:david.levesque@solaraustin.org"
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  david.levesque@solaraustin.org
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Contact;
