import type { WorkerEnv } from "@flight-tracker/config/worker";
import type { FlightUpsert } from "@flight-tracker/types/domain";
import { fetchAviationStackFlights } from "./aviationstack.js";
import { fetchOpenSkyFlights } from "./opensky.js";

export async function fetchFlights(env: WorkerEnv): Promise<FlightUpsert[]> {
  switch (env.FLIGHT_DATA_SOURCE) {
    case "opensky":
      return fetchOpenSkyFlights(env);
    case "aviationstack":
      return fetchAviationStackFlights(env);
    default:
      throw new Error(`Unsupported FLIGHT_DATA_SOURCE: ${env.FLIGHT_DATA_SOURCE}`);
  }
}
