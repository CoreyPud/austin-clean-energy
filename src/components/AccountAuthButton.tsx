import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";

interface AccountAuthButtonProps {
  /** Supply the parent's user when it already owns authentication state. */
  user?: User | null;
  loading?: boolean;
  onSignIn?: () => void | Promise<unknown>;
  onSignOut?: () => void | Promise<unknown>;
  signInLabel?: string;
}

const headerButtonClass = "shrink-0 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground";

/** Top-right Google account control for public pages with signed-in features. */
export default function AccountAuthButton({ user: controlledUser, loading = false, onSignIn, onSignOut, signInLabel = "Sign in" }: AccountAuthButtonProps) {
  const [internalUser, setInternalUser] = useState<User | null>(null);
  const controlled = controlledUser !== undefined;

  useEffect(() => {
    if (controlled) return;
    supabase.auth.getSession().then(({ data }) => setInternalUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setInternalUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [controlled]);

  const user = controlled ? controlledUser : internalUser;

  const signIn = async () => {
    try {
      if (onSignIn) { await onSignIn(); return; }
      // This default is used only on public pages; private pages supply their existing handler.
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.href });
      if (result.error) toast.error("Unable to sign in with Google right now");
    } catch {
      toast.error("Unable to sign in with Google right now");
    }
  };

  const signOut = async () => {
    try {
      if (onSignOut) { await onSignOut(); return; }
      const { error } = await supabase.auth.signOut();
      if (error) toast.error("Unable to sign out right now");
    } catch {
      toast.error("Unable to sign out right now");
    }
  };

  if (loading) return <Button type="button" variant="outline" size="sm" disabled className={headerButtonClass} aria-label="Checking sign-in status"><Loader2 className="h-4 w-4 animate-spin sm:mr-2" /><span className="hidden sm:inline">Checking…</span></Button>;

  return <Button type="button" variant="outline" size="sm" className={headerButtonClass} aria-label={user ? "Sign out" : signInLabel} title={user ? "Sign out" : signInLabel} onClick={() => void (user ? signOut() : signIn())}>
    {user ? <LogOut className="h-4 w-4 sm:mr-2" /> : <LogIn className="h-4 w-4 sm:mr-2" />}
    <span className="hidden sm:inline">{user ? "Sign out" : signInLabel}</span>
  </Button>;
}
