import type { WorkerEnv } from "@flight-tracker/config/worker";
import type { FlightUpsert } from "@flight-tracker/types/domain";
import { estimateRouteFromPosition } from "./route-heuristics.js";

type OpenSkyState = [
  string,
  string | null,
  string | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  boolean | null,
  number | null,
  number | null,
  number | null,
  number[] | null,
  number | null,
  string | null,
  boolean | null,
  number | null,
];

type OpenSkyResponse = {
  states: OpenSkyState[] | null;
};

export async function fetchOpenSkyFlights(env: WorkerEnv): Promise<FlightUpsert[]> {
  const response = await fetch(`${env.OPENSKY_BASE_URL}/states/all`, {
    headers: env.OPENSKY_USERNAME
      ? {
          Authorization: `Basic ${Buffer.from(
            `${env.OPENSKY_USERNAME}:${env.OPENSKY_PASSWORD ?? ""}`,
          ).toString("base64")}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`OpenSky request failed with ${response.status}`);
  }

  const body = (await response.json()) as OpenSkyResponse;

  return (body.states ?? [])
    .filter((state) => state[5] !== null && state[6] !== null)
    .slice(0, 100)
    .map((state) => {
      const callsign = state[1]?.trim() ?? null;
      const originCountry = state[2] ?? null;
      const latitude = state[6] ?? 0;
      const longitude = state[5] ?? 0;
      const observedAt = state[4] ? new Date(state[4] * 1000).toISOString() : new Date().toISOString();
      const baseFlight: FlightUpsert = {
        external_id: state[0],
        callsign,
        flight_number: callsign,
        airline_iata: callsign?.slice(0, 2) ?? null,
        departure_airport: null,
        arrival_airport: null,
        latitude,
        longitude,
        altitude_baro: state[7],
        velocity: state[9],
        heading: state[10],
        status: state[8] ? "on_ground" : "airborne",
        observed_at: observedAt,
        metadata: {
          provider: "opensky",
          origin_country: originCountry,
          geo_altitude: state[13],
          vertical_rate: state[11],
        },
      };
      const routeEstimate = estimateRouteFromPosition(baseFlight);

      return {
        ...baseFlight,
        departure_airport: routeEstimate.departureAirport,
        arrival_airport: routeEstimate.arrivalAirport,
        metadata: {
          ...baseFlight.metadata,
          ...routeEstimate.metadata,
        },
      };
    });
}
