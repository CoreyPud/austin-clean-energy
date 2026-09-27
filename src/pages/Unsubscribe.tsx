import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

type State = "loading" | "valid" | "used" | "invalid" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (d?.valid === false && d?.reason === "already_unsubscribed") setState("used");
        else if (r.ok && d?.valid !== false) setState("valid");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setBusy(false);
    if (error) setState("error");
    else if ((data as any)?.reason === "already_unsubscribed") setState("used");
    else setState("done");
  };

  const msg: Record<State, string> = {
    loading: "Checking your link…",
    valid: "Stop receiving emails from Austin Clean Energy?",
    used: "You're already unsubscribed.",
    invalid: "This unsubscribe link is invalid or has expired.",
    done: "You've been unsubscribed. You won't receive further emails.",
    error: "Something went wrong. Please try again later.",
  };

  return (
    <>
      <PageHeader title="Unsubscribe" subtitle="Manage email from Austin Clean Energy." />
      <div className="container mx-auto max-w-xl px-4 py-12 text-center space-y-6">
        <p className="text-lg text-foreground">{msg[state]}</p>
        {state === "valid" && (
          <Button onClick={confirm} disabled={busy}>{busy ? "Unsubscribing…" : "Confirm unsubscribe"}</Button>
        )}
      </div>
    </>
  );
}
