import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type CourseAuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  displayName: string | null;
  isAdmin: boolean;
};

export function useCourseAuth(): CourseAuthState & { signOut: () => Promise<void> } {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setDisplayName(null);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const metaName = (session?.user?.user_metadata as { display_name?: string } | undefined)?.display_name ?? null;
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
      if (!profile) {
        await supabase
          .from("profiles")
          .upsert({ id: userId, display_name: metaName, email: session?.user?.email ?? null }, { onConflict: "id" });
      }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (cancelled) return;
      setDisplayName(profile?.display_name ?? metaName ?? session?.user?.email ?? null);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { loading, session, user: session?.user ?? null, displayName, isAdmin, signOut };
}
