import { createClient } from "@supabase/supabase-js";
import type { WorkerEnv } from "@flight-tracker/config/worker";

export function createSupabaseAdminClient(env: WorkerEnv) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
