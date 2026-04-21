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
  const [previewPreferences, setPreviewPreferences] = useState<UserPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activePreferences = previewPreferences ?? preferences;
  const watchedAirports = activePreferences?.favorite_airports ?? [];
  const watchedAirportKey = watchedAirports.join("|");

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
        const fallbackPreferences = defaultUserPreferences(userId);
        setPreferences(fallbackPreferences);
        setPreviewPreferences(fallbackPreferences);
        setError(formatSupabaseError(queryError));
        return;
      }

      const nextPreferences = (data as UserPreferences | null) ?? defaultUserPreferences(userId);
      setPreferences(nextPreferences);
      setPreviewPreferences(nextPreferences);
    };

    void loadPreferences();
  }, [authLoaded, session, sessionLoaded, userId]);

  useEffect(() => {
    if (!sessionLoaded || !session) {
      return;
    }

    const supabase = createBrowserSupabaseClient(async () => session.getToken());
    const watchedAirportList = [...new Set(watchedAirports.map((airport) => airport.trim().toUpperCase()))];

    const loadFlights = async () => {
      if (watchedAirportList.length === 0) {
        setFlights([]);
        return;
      }

      const watchedAirportFilter = watchedAirportList.join(",");
      const { data, error: queryError } = await supabase
        .from("flights")
        .select("*")
        .or(`departure_airport.in.(${watchedAirportFilter}),arrival_airport.in.(${watchedAirportFilter})`)
        .order("observed_at", { ascending: false })
        .limit(2500);

      if (queryError) {
        setError(formatSupabaseError(queryError));
        return;
      }

      setFlights((data ?? []) as FlightRecord[]);
    };

    void loadFlights();

    if (!activePreferences?.auto_refresh) {
      return;
    }

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

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activePreferences?.auto_refresh, session, sessionLoaded, watchedAirportKey]);

  const savePreferences = async (nextPreferences: UserPreferences) => {
    if (!session || !userId) {
      return;
    }

    const supabase = createBrowserSupabaseClient(async () => session.getToken());
    const payload = {
      clerk_user_id: userId,
      favorite_airlines: [],
      favorite_airports: nextPreferences.favorite_airports,
      tracked_flight_numbers: [],
      auto_refresh: nextPreferences.auto_refresh,
    };

    const { data, error: upsertError } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "clerk_user_id" })
      .select("*")
      .single();

    if (upsertError) {
      setPreferences(nextPreferences);
      setPreviewPreferences(nextPreferences);
      setError(formatSupabaseError(upsertError));
      return;
    }

    setError(null);
    setPreferences(data as UserPreferences);
    setPreviewPreferences(data as UserPreferences);
  };

  const filteredFlights = useMemo(() => flights, [flights]);

  if (!authLoaded || !sessionLoaded) {
    return (
      <div className="panel" style={{ padding: 20 }}>
        Loading account...
      </div>
    );
  }

  return (
    <>
      <PreferencesPanel
        preferences={preferences}
        onChange={setPreviewPreferences}
        onSave={savePreferences}
      />
      {error ? (
        <div className="panel" style={{ padding: 20, borderColor: "rgba(255,128,128,0.3)" }}>
          {error}
        </div>
      ) : null}
      <FlightTable
        flights={filteredFlights}
        watchedAirports={watchedAirports}
        autoRefresh={activePreferences?.auto_refresh ?? true}
      />
    </>
  );
}

function formatSupabaseError(error: Pick<PostgrestError, "message" | "code">) {
  if (error.code === "PGRST301") {
    return "Supabase rejected the Clerk token. Check Supabase Authentication > Third-Party Auth > Clerk and make sure your Clerk instance is connected for Supabase compatibility.";
  }

  return error.message;
}
