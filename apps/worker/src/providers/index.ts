import type { WorkerEnv } from "@flight-tracker/config/worker";
import type { FlightUpsert } from "@flight-tracker/types/domain";
import { fetchAeroDataBoxFlights } from "./aerodatabox.js";
import { fetchAviationStackFlights } from "./aviationstack.js";
import { fetchOpenSkyFlights } from "./opensky.js";

export async function fetchFlights(
  env: WorkerEnv,
  watchedAirports: string[] = [],
): Promise<FlightUpsert[]> {
  switch (env.FLIGHT_DATA_SOURCE) {
    case "opensky":
      return fetchOpenSkyFlights(env);
    case "aviationstack":
      return fetchAviationStackFlights(env);
    case "aerodatabox":
      return fetchAeroDataBoxFlights(env, watchedAirports);
    default:
      throw new Error(`Unsupported FLIGHT_DATA_SOURCE: ${env.FLIGHT_DATA_SOURCE}`);
  }
}
