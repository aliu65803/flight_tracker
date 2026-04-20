import type { WorkerEnv } from "@flight-tracker/config/worker";
import type { FlightUpsert } from "@flight-tracker/types/domain";

type AviationStackResponse = {
  data?: AviationStackFlight[];
  error?: {
    code?: string | number;
    message?: string;
  };
};

type AviationStackFlight = {
  flight_status?: string | null;
  departure?: {
    airport?: string | null;
    iata?: string | null;
    icao?: string | null;
    scheduled?: string | null;
    estimated?: string | null;
    actual?: string | null;
    delay?: number | null;
  } | null;
  arrival?: {
    airport?: string | null;
    iata?: string | null;
    icao?: string | null;
    scheduled?: string | null;
    estimated?: string | null;
    actual?: string | null;
    delay?: number | null;
  } | null;
  airline?: {
    name?: string | null;
    iata?: string | null;
    icao?: string | null;
  } | null;
  flight?: {
    number?: string | null;
    iata?: string | null;
    icao?: string | null;
  } | null;
  aircraft?: {
    registration?: string | null;
    iata?: string | null;
    icao?: string | null;
    icao24?: string | null;
  } | null;
  live?: {
    updated?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    altitude?: number | null;
    direction?: number | null;
    speed_horizontal?: number | null;
    speed_vertical?: number | null;
    is_ground?: boolean | null;
  } | null;
};

const FEET_PER_METER = 3.28084;
const METERS_PER_SECOND_PER_KILOMETER_PER_HOUR = 1 / 3.6;

export async function fetchAviationStackFlights(env: WorkerEnv): Promise<FlightUpsert[]> {
  if (!env.AVIATIONSTACK_ACCESS_KEY) {
    throw new Error(
      "Missing AVIATIONSTACK_ACCESS_KEY. Add it to your env and set FLIGHT_DATA_SOURCE=aviationstack.",
    );
  }

  const requestUrl = new URL("flights", `${env.AVIATIONSTACK_BASE_URL}/`);
  requestUrl.searchParams.set("access_key", env.AVIATIONSTACK_ACCESS_KEY);
  requestUrl.searchParams.set("flight_status", "active");
  requestUrl.searchParams.set("limit", "100");

  const response = await fetch(requestUrl);

  if (!response.ok) {
    throw new Error(`Aviationstack request failed with ${response.status}`);
  }

  const body = (await response.json()) as AviationStackResponse;

  if (body.error) {
    throw new Error(`Aviationstack error ${body.error.code ?? "unknown"}: ${body.error.message}`);
  }

  return (body.data ?? [])
    .filter((flight) => flight.live?.latitude != null && flight.live?.longitude != null)
    .map((flight) => {
      const latitude = flight.live?.latitude ?? 0;
      const longitude = flight.live?.longitude ?? 0;
      const altitudeMeters = flight.live?.altitude ?? null;
      const speedKph = flight.live?.speed_horizontal ?? null;
      const departureCode = flight.departure?.iata ?? flight.departure?.icao ?? flight.departure?.airport ?? null;
      const arrivalCode = flight.arrival?.iata ?? flight.arrival?.icao ?? flight.arrival?.airport ?? null;

      return {
        external_id: getExternalId(flight),
        callsign: flight.flight?.icao ?? flight.flight?.iata ?? null,
        flight_number: flight.flight?.iata ?? flight.flight?.number ?? flight.flight?.icao ?? null,
        airline_iata: flight.airline?.iata ?? flight.airline?.icao ?? null,
        departure_airport: departureCode,
        arrival_airport: arrivalCode,
        latitude,
        longitude,
        altitude_baro: altitudeMeters == null ? null : altitudeMeters * FEET_PER_METER,
        velocity:
          speedKph == null ? null : speedKph * METERS_PER_SECOND_PER_KILOMETER_PER_HOUR,
        heading: flight.live?.direction ?? null,
        status: normalizeStatus(flight),
        observed_at:
          flight.live?.updated ??
          flight.departure?.actual ??
          flight.departure?.estimated ??
          flight.departure?.scheduled ??
          new Date().toISOString(),
        metadata: {
          provider: "aviationstack",
          airline_name: flight.airline?.name ?? null,
          departure_name: flight.departure?.airport ?? null,
          arrival_name: flight.arrival?.airport ?? null,
          departure_delay_minutes: flight.departure?.delay ?? null,
          arrival_delay_minutes: flight.arrival?.delay ?? null,
          aircraft_registration: flight.aircraft?.registration ?? null,
          aircraft_iata: flight.aircraft?.iata ?? null,
          aircraft_icao: flight.aircraft?.icao ?? null,
          aircraft_icao24: flight.aircraft?.icao24 ?? null,
          speed_vertical_m_s:
            flight.live?.speed_vertical == null
              ? null
              : flight.live.speed_vertical * METERS_PER_SECOND_PER_KILOMETER_PER_HOUR,
        },
      };
    });
}

function getExternalId(flight: AviationStackFlight) {
  return (
    flight.aircraft?.icao24 ??
    flight.flight?.icao ??
    flight.flight?.iata ??
    [
      flight.airline?.iata ?? flight.airline?.icao ?? "unknown-airline",
      flight.flight?.number ?? "unknown-flight",
      flight.departure?.iata ?? flight.departure?.icao ?? "unknown-departure",
      flight.arrival?.iata ?? flight.arrival?.icao ?? "unknown-arrival",
    ].join(":")
  );
}

function normalizeStatus(flight: AviationStackFlight) {
  if (flight.live?.is_ground === true) {
    return "on_ground";
  }

  return flight.flight_status ?? "active";
}
