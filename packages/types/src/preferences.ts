import type { UserPreferences } from "./domain";

export function defaultUserPreferences(clerkUserId: string): UserPreferences {
  return {
    clerk_user_id: clerkUserId,
    favorite_airlines: [],
    favorite_airports: [],
    tracked_flight_numbers: [],
    auto_refresh: true,
  };
}
