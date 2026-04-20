import type { FlightUpsert } from "@flight-tracker/types/domain";
import { AIRPORT_REFERENCES, type AirportReference } from "./airport-reference.js";

type RouteEstimate = {
  departureAirport: string | null;
  arrivalAirport: string | null;
  metadata: Record<string, unknown>;
};

type Candidate = {
  airport: AirportReference;
  distanceKm: number;
  bearingDeg: number;
  angleDeltaDeg: number;
};

const EARTH_RADIUS_KM = 6371;

export function estimateRouteFromPosition(flight: FlightUpsert): RouteEstimate {
  const nearest = getCandidates(flight.latitude, flight.longitude)
    .filter((candidate) => candidate.distanceKm <= 350)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const heading = flight.heading;
  const altitudeFeet = flight.altitude_baro ?? 0;
  const verticalRate = getNumberMetadata(flight.metadata, "vertical_rate");
  const status = flight.status ?? "airborne";
  const onGround = status === "on_ground";

  const nearestAirport = nearest[0] ?? null;
  const forward = heading == null ? null : pickDirectionalCandidate(nearest, heading);
  const backward = heading == null ? null : pickDirectionalCandidate(nearest, oppositeHeading(heading));

  let departureAirport: string | null = null;
  let arrivalAirport: string | null = null;

  if (onGround && nearestAirport && nearestAirport.distanceKm <= 25) {
    departureAirport = nearestAirport.airport.iata;
    arrivalAirport = nearestAirport.airport.iata;
  } else if (isClimbing(altitudeFeet, verticalRate)) {
    departureAirport = pickClosestAirport(nearest, 120)?.iata ?? backward?.airport.iata ?? null;
    arrivalAirport = forward?.airport.iata ?? null;
  } else if (isDescending(altitudeFeet, verticalRate)) {
    departureAirport = backward?.airport.iata ?? null;
    arrivalAirport = pickClosestAirport(nearest, 120)?.iata ?? forward?.airport.iata ?? null;
  } else {
    departureAirport = backward?.airport.iata ?? null;
    arrivalAirport = forward?.airport.iata ?? null;

    if (!departureAirport && nearestAirport && nearestAirport.distanceKm <= 50) {
      departureAirport = nearestAirport.airport.iata;
    }

    if (!arrivalAirport && nearestAirport && nearestAirport.distanceKm <= 50) {
      arrivalAirport = nearestAirport.airport.iata;
    }
  }

  return {
    departureAirport,
    arrivalAirport,
    metadata: {
      route_estimated: Boolean(departureAirport || arrivalAirport),
      route_estimation_reason: describeReason(onGround, altitudeFeet, verticalRate),
      route_estimation_nearest_airport: nearestAirport?.airport.iata ?? null,
      route_estimation_nearest_distance_km: round(nearestAirport?.distanceKm ?? null),
      route_estimation_forward_airport: forward?.airport.iata ?? null,
      route_estimation_backward_airport: backward?.airport.iata ?? null,
    },
  };
}

function getCandidates(latitude: number, longitude: number): Candidate[] {
  return AIRPORT_REFERENCES.map((airport) => {
    const distanceKm = haversineKm(latitude, longitude, airport.latitude, airport.longitude);
    const bearingDeg = initialBearingDeg(latitude, longitude, airport.latitude, airport.longitude);
    return {
      airport,
      distanceKm,
      bearingDeg,
      angleDeltaDeg: 0,
    };
  });
}

function pickDirectionalCandidate(candidates: Candidate[], targetHeading: number) {
  return candidates
    .map((candidate) => ({
      ...candidate,
      angleDeltaDeg: headingDeltaDeg(candidate.bearingDeg, targetHeading),
    }))
    .filter((candidate) => candidate.angleDeltaDeg <= 65 && candidate.distanceKm <= 500)
    .sort((a, b) => scoreCandidate(a) - scoreCandidate(b))[0] ?? null;
}

function pickClosestAirport(candidates: Candidate[], maxDistanceKm: number) {
  return candidates.find((candidate) => candidate.distanceKm <= maxDistanceKm)?.airport ?? null;
}

function scoreCandidate(candidate: Candidate) {
  return candidate.distanceKm + candidate.angleDeltaDeg * 2.5;
}

function isClimbing(altitudeFeet: number, verticalRate: number | null) {
  return altitudeFeet <= 18000 && (verticalRate == null ? altitudeFeet <= 6000 : verticalRate > 3);
}

function isDescending(altitudeFeet: number, verticalRate: number | null) {
  return altitudeFeet <= 18000 && verticalRate != null && verticalRate < -3;
}

function describeReason(onGround: boolean, altitudeFeet: number, verticalRate: number | null) {
  if (onGround) {
    return "nearest-airport-on-ground";
  }

  if (isClimbing(altitudeFeet, verticalRate)) {
    return "low-altitude-climb-heading";
  }

  if (isDescending(altitudeFeet, verticalRate)) {
    return "low-altitude-descent-heading";
  }

  return "heading-proximity";
}

function getNumberMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "number" ? value : null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function initialBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return normalizeHeading((Math.atan2(y, x) * 180) / Math.PI);
}

function headingDeltaDeg(a: number, b: number) {
  const delta = Math.abs(a - b) % 360;
  return delta > 180 ? 360 - delta : delta;
}

function oppositeHeading(heading: number) {
  return normalizeHeading(heading + 180);
}

function normalizeHeading(heading: number) {
  return ((heading % 360) + 360) % 360;
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function round(value: number | null) {
  return value == null ? null : Math.round(value * 10) / 10;
}

