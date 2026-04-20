"use client";

import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, useAuth, useSession } from "@clerk/nextjs";
import type { PostgrestError } from "@supabase/supabase-js";
import type { FlightRecord, UserPreferences } from "@flight-tracker/types/domain";
import { defaultUserPreferences } from "@flight-tracker/types/preferences";
import { FlightTable } from "@/components/flight-table";
import { PreferencesPanel } from "@/components/preferences-panel";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function FlightDashboard() {
  return (
    <section id="dashboard" style={{ display: "grid", gap: 24 }}>
      <SignedOut>
        <div className="panel" style={{ padding: 24 }}>
          Sign in with Clerk to load your RLS-protected Supabase preferences and live flight feed.
        </div>
      </SignedOut>
      <SignedIn>
        <AuthenticatedFlightDashboard />
      </SignedIn>
    </section>
  );
}

function AuthenticatedFlightDashboard() {
  const { isLoaded: authLoaded, userId } = useAuth();
  const { isLoaded: sessionLoaded, session } = useSession();
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoaded || !sessionLoaded || !userId || !session) {
      return;
    }

    const supabase = createBrowserSupabaseClient(async () => session.getToken());

    const loadPreferences = async () => {
      const { data, error: queryError } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("clerk_user_id", userId)
        .maybeSingle();

      if (queryError) {
        setPreferences(defaultUserPreferences(userId));
        setError(formatSupabaseError(queryError));
        return;
      }

      setPreferences((data as UserPreferences | null) ?? defaultUserPreferences(userId));
    };

    void loadPreferences();
  }, [authLoaded, session, sessionLoaded, userId]);

  useEffect(() => {
    if (!sessionLoaded || !session) {
      return;
    }

    const supabase = createBrowserSupabaseClient(async () => session.getToken());

    const loadFlights = async () => {
      const { data, error: queryError } = await supabase
        .from("flights")
        .select("*")
        .order("observed_at", { ascending: false })
        .limit(50);

      if (queryError) {
        setError(formatSupabaseError(queryError));
        return;
      }

      setFlights((data ?? []) as FlightRecord[]);
    };

    const channel = supabase
      .channel("realtime:flights")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flights" },
        () => {
          void loadFlights();
        },
      )
      .subscribe();

    void loadFlights();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session, sessionLoaded]);

  const savePreferences = async (nextPreferences: UserPreferences) => {
    if (!session || !userId) {
      return;
    }

    const supabase = createBrowserSupabaseClient(async () => session.getToken());
    const payload = {
      clerk_user_id: userId,
      favorite_airlines: nextPreferences.favorite_airlines,
      favorite_airports: nextPreferences.favorite_airports,
      tracked_flight_numbers: nextPreferences.tracked_flight_numbers,
      auto_refresh: nextPreferences.auto_refresh,
    };

    const { data, error: upsertError } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "clerk_user_id" })
      .select("*")
      .single();

    if (upsertError) {
      setPreferences(nextPreferences);
      setError(formatSupabaseError(upsertError));
      return;
    }

    setError(null);
    setPreferences(data as UserPreferences);
  };

  const filteredFlights = useMemo(() => {
    if (!preferences) {
      return flights;
    }

    const airlineSet = new Set(preferences.favorite_airlines);
    const airportSet = new Set(preferences.favorite_airports);
    const flightSet = new Set(preferences.tracked_flight_numbers);

    if (airlineSet.size === 0 && airportSet.size === 0 && flightSet.size === 0) {
      return flights;
    }

    return flights.filter((flight) => {
      return (
        airlineSet.has(flight.airline_iata ?? "") ||
        airportSet.has(flight.departure_airport ?? "") ||
        airportSet.has(flight.arrival_airport ?? "") ||
        flightSet.has(flight.flight_number ?? "")
      );
    });
  }, [flights, preferences]);

  if (!authLoaded || !sessionLoaded) {
    return (
      <div className="panel" style={{ padding: 20 }}>
        Loading account...
      </div>
    );
  }

  return (
    <>
      <PreferencesPanel preferences={preferences} onSave={savePreferences} />
      {error ? (
        <div className="panel" style={{ padding: 20, borderColor: "rgba(255,128,128,0.3)" }}>
          {error}
        </div>
      ) : null}
      <FlightTable flights={filteredFlights} />
    </>
  );
}

function formatSupabaseError(error: Pick<PostgrestError, "message" | "code">) {
  if (error.code === "PGRST301") {
    return "Supabase rejected the Clerk token. Check Supabase Authentication > Third-Party Auth > Clerk and make sure your Clerk instance is connected for Supabase compatibility.";
  }

  return error.message;
}
