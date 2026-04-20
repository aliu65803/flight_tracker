import { createClient } from "@supabase/supabase-js";

type AccessTokenGetter = () => Promise<string | null>;

export function createBrowserSupabaseClient(accessToken: AccessTokenGetter) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      accessToken,
    },
  );
}
