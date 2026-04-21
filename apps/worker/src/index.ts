import { setTimeout as sleep } from "node:timers/promises";
import { loadWorkerEnv } from "@flight-tracker/config/worker";
import type { FlightUpsert } from "@flight-tracker/types/domain";
import { createSupabaseAdminClient, loadWatchedAirports } from "./supabase.js";
import { fetchFlights } from "./providers/index.js";

const env = loadWorkerEnv();
const supabase = createSupabaseAdminClient(env);

async function pollOnce() {
  const watchedAirports =
    env.FLIGHT_DATA_SOURCE === "aerodatabox" ? await loadWatchedAirports(supabase) : [];
  const flights = await fetchFlights(env, watchedAirports);

  if (flights.length === 0) {
    console.log(
      env.FLIGHT_DATA_SOURCE === "aerodatabox" && watchedAirports.length === 0
        ? "No watched airports found in user preferences yet."
        : "No flights returned from provider.",
    );
    return;
  }

  const payload: FlightUpsert[] = flights.map((flight) => ({
    external_id: flight.external_id,
    callsign: flight.callsign,
    flight_number: flight.flight_number,
    airline_iata: flight.airline_iata,
    departure_airport: flight.departure_airport,
    arrival_airport: flight.arrival_airport,
    latitude: flight.latitude,
    longitude: flight.longitude,
    altitude_baro: flight.altitude_baro,
    velocity: flight.velocity,
    heading: flight.heading,
    status: flight.status,
    observed_at: flight.observed_at,
    metadata: flight.metadata ?? {},
  }));

  const { error } = await supabase.from("flights").upsert(payload, { onConflict: "external_id" });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  console.log(`Upserted ${payload.length} flights at ${new Date().toISOString()}`);
}

async function main() {
  console.log(`Worker started. Polling every ${env.FLIGHT_POLL_INTERVAL_MS}ms`);

  while (true) {
    try {
      await pollOnce();
    } catch (error) {
      console.error("Polling cycle failed", error);
    }

    await sleep(env.FLIGHT_POLL_INTERVAL_MS);
  }
}

void main();
