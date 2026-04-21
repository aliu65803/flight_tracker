import type { WorkerEnv } from "@flight-tracker/config/worker";
import type { FlightUpsert } from "@flight-tracker/types/domain";

type AeroDataBoxFlight = {
  number?: string | null;
  callSign?: string | null;
  status?: string | null;
  isCargo?: boolean | null;
  aircraft?: {
    reg?: string | null;
    modeS?: string | null;
    model?: string | null;
  } | null;
  airline?: {
    name?: string | null;
    iata?: string | null;
    icao?: string | null;
  } | null;
  departure?: AeroDataBoxMovement | null;
  arrival?: AeroDataBoxMovement | null;
  lastUpdatedUtc?: string | null;
};

type AeroDataBoxAirportFidsResponse = {
  departures?: AeroDataBoxFlight[] | null;
  arrivals?: AeroDataBoxFlight[] | null;
};

type AeroDataBoxMovement = {
  airport?: {
    iata?: string | null;
    icao?: string | null;
    name?: string | null;
    shortName?: string | null;
    municipalityName?: string | null;
    timeZone?: string | null;
  } | null;
  scheduledTime?: {
    local?: string | null;
    utc?: string | null;
  } | null;
  revisedTime?: {
    local?: string | null;
    utc?: string | null;
  } | null;
  predictedTime?: {
    local?: string | null;
    utc?: string | null;
  } | null;
  actualTime?: {
    local?: string | null;
    utc?: string | null;
  } | null;
  runwayTime?: {
    local?: string | null;
    utc?: string | null;
  } | null;
  gate?: string | null;
  terminal?: string | null;
  checkInDesk?: string | null;
  baggageBelt?: string | null;
  runway?: string | null;
  quality?: string[] | null;
};

type AeroDataBoxAirport = {
  iata?: string | null;
  icao?: string | null;
  timeZone?: string | null;
};

const airportTimeZoneCache = new Map<string, string>();

export async function fetchAeroDataBoxFlights(
  env: WorkerEnv,
  watchedAirports: string[],
): Promise<FlightUpsert[]> {
  if (!env.AERODATABOX_API_KEY) {
    throw new Error(
      "Missing AERODATABOX_API_KEY. Add it to your env and set FLIGHT_DATA_SOURCE=aerodatabox.",
    );
  }

  if (watchedAirports.length === 0) {
    return [];
  }

  const responses = await Promise.all(
    watchedAirports.map(async (airport) => {
      const flights = await fetchAirportFids(env, airport);
      return flights;
    }),
  );

  const deduped = new Map<string, FlightUpsert>();

  for (const flights of responses) {
    for (const flight of flights) {
      deduped.set(flight.external_id, flight);
    }
  }

  return [...deduped.values()];
}

async function fetchAirportFids(env: WorkerEnv, airportCode: string) {
  const timeZone = await getAirportTimeZone(env, airportCode);
  const now = new Date();
  const fromLocal = formatInTimeZone(now, timeZone);
  const toLocal = formatInTimeZone(new Date(now.getTime() + 12 * 60 * 60 * 1000), timeZone);
  const requestUrl = new URL(
    `flights/airports/iata/${encodeURIComponent(airportCode)}/${encodeURIComponent(fromLocal)}/${encodeURIComponent(toLocal)}`,
    `${env.AERODATABOX_BASE_URL}/`,
  );

  requestUrl.searchParams.set("direction", "Both");
  requestUrl.searchParams.set("withLeg", "true");
  requestUrl.searchParams.set("withCancelled", "true");
  requestUrl.searchParams.set("withCodeshared", "true");

  const response = await fetch(requestUrl, {
    headers: {
      "x-magicapi-key": env.AERODATABOX_API_KEY!,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`AeroDataBox request failed for ${airportCode} with ${response.status}`);
  }

  const body = (await response.json()) as AeroDataBoxAirportFidsResponse;
  const departures = (body.departures ?? []).map((flight) =>
    mapFlight(flight, airportCode, "departure"),
  );
  const arrivals = (body.arrivals ?? []).map((flight) =>
    mapFlight(flight, airportCode, "arrival"),
  );

  return [...departures, ...arrivals];
}

async function getAirportTimeZone(env: WorkerEnv, airportCode: string) {
  const cached = airportTimeZoneCache.get(airportCode);

  if (cached) {
    return cached;
  }

  const requestUrl = new URL(
    `airports/iata/${encodeURIComponent(airportCode)}`,
    `${env.AERODATABOX_BASE_URL}/`,
  );
  const response = await fetch(requestUrl, {
    headers: {
      "x-magicapi-key": env.AERODATABOX_API_KEY!,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `AeroDataBox airport lookup failed for ${airportCode} with ${response.status}`,
    );
  }

  const body = (await response.json()) as AeroDataBoxAirport;
  const timeZone = body.timeZone;

  if (!timeZone) {
    throw new Error(`AeroDataBox did not return a timezone for ${airportCode}`);
  }

  airportTimeZoneCache.set(airportCode, timeZone);
  return timeZone;
}

function mapFlight(
  flight: AeroDataBoxFlight,
  boardAirport: string,
  boardDirection: "departure" | "arrival",
): FlightUpsert {
  const departureAirport =
    flight.departure?.airport?.iata ??
    flight.departure?.airport?.icao ??
    (boardDirection === "departure" ? boardAirport : null);
  const arrivalAirport =
    flight.arrival?.airport?.iata ??
    flight.arrival?.airport?.icao ??
    (boardDirection === "arrival" ? boardAirport : null);
  const latitude = 0;
  const longitude = 0;

  return {
    external_id: getExternalId(flight, boardAirport),
    callsign: flight.callSign ?? null,
    flight_number: flight.number ?? flight.callSign ?? null,
    airline_iata: flight.airline?.iata ?? flight.airline?.icao ?? null,
    departure_airport: departureAirport,
    arrival_airport: arrivalAirport,
    latitude,
    longitude,
    altitude_baro: null,
    velocity: null,
    heading: null,
    status: normalizeStatus(flight.status),
    observed_at:
      flight.lastUpdatedUtc ??
      flight.departure?.predictedTime?.utc ??
      flight.departure?.revisedTime?.utc ??
      flight.departure?.scheduledTime?.utc ??
      flight.arrival?.predictedTime?.utc ??
      flight.arrival?.revisedTime?.utc ??
      flight.arrival?.scheduledTime?.utc ??
      new Date().toISOString(),
    metadata: {
      provider: "aerodatabox",
      board_airport: boardAirport,
      board_direction: boardDirection,
      is_cargo: flight.isCargo ?? false,
      airline_name: flight.airline?.name ?? null,
      aircraft_registration: flight.aircraft?.reg ?? null,
      aircraft_modes: flight.aircraft?.modeS ?? null,
      aircraft_model: flight.aircraft?.model ?? null,
      departure_name: flight.departure?.airport?.name ?? null,
      arrival_name: flight.arrival?.airport?.name ?? null,
      departure_timezone: flight.departure?.airport?.timeZone ?? null,
      arrival_timezone: flight.arrival?.airport?.timeZone ?? null,
      departure_scheduled_utc: flight.departure?.scheduledTime?.utc ?? null,
      departure_revised_utc: flight.departure?.revisedTime?.utc ?? null,
      departure_predicted_utc: flight.departure?.predictedTime?.utc ?? null,
      departure_actual_utc: flight.departure?.actualTime?.utc ?? null,
      departure_runway_utc: flight.departure?.runwayTime?.utc ?? null,
      departure_terminal: flight.departure?.terminal ?? null,
      departure_gate: flight.departure?.gate ?? null,
      departure_check_in_desk: flight.departure?.checkInDesk ?? null,
      departure_runway: flight.departure?.runway ?? null,
      departure_quality: flight.departure?.quality ?? [],
      arrival_scheduled_utc: flight.arrival?.scheduledTime?.utc ?? null,
      arrival_revised_utc: flight.arrival?.revisedTime?.utc ?? null,
      arrival_predicted_utc: flight.arrival?.predictedTime?.utc ?? null,
      arrival_actual_utc: flight.arrival?.actualTime?.utc ?? null,
      arrival_runway_utc: flight.arrival?.runwayTime?.utc ?? null,
      arrival_terminal: flight.arrival?.terminal ?? null,
      arrival_gate: flight.arrival?.gate ?? null,
      arrival_baggage_belt: flight.arrival?.baggageBelt ?? null,
      arrival_runway: flight.arrival?.runway ?? null,
      arrival_quality: flight.arrival?.quality ?? [],
    },
  };
}

function getExternalId(flight: AeroDataBoxFlight, boardAirport: string) {
  return (
    flight.aircraft?.modeS ??
    [
      flight.number ?? flight.callSign ?? "unknown-flight",
      flight.departure?.airport?.iata ?? flight.departure?.airport?.icao ?? "unknown-departure",
      flight.arrival?.airport?.iata ?? flight.arrival?.airport?.icao ?? "unknown-arrival",
      flight.departure?.scheduledTime?.utc ??
        flight.arrival?.scheduledTime?.utc ??
        flight.lastUpdatedUtc ??
        boardAirport,
    ].join(":")
  );
}

function normalizeStatus(status: string | null | undefined) {
  if (!status) {
    return "active";
  }

  return status
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

function formatInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}
