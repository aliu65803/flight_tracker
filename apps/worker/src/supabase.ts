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

export async function loadWatchedAirports(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
) {
  const { data, error } = await supabase.from("user_preferences").select("favorite_airports");

  if (error) {
    throw new Error(`Supabase preferences query failed: ${error.message}`);
  }

  return Array.from(
    new Set(
      (data ?? [])
        .flatMap((row) =>
          Array.isArray(row.favorite_airports) ? row.favorite_airports : [],
        )
        .filter((airport): airport is string => typeof airport === "string" && airport.length > 0)
        .map((airport) => airport.trim().toUpperCase()),
    ),
  );
}
