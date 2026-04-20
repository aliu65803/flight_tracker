export type FlightRecord = {
  id: string;
  external_id: string;
  callsign: string | null;
  flight_number: string | null;
  airline_iata: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  latitude: number;
  longitude: number;
  altitude_baro: number | null;
  velocity: number | null;
  heading: number | null;
  status: string | null;
  observed_at: string;
  metadata: Record<string, unknown>;
};

export type FlightUpsert = Omit<FlightRecord, "id">;

export type UserPreferences = {
  clerk_user_id: string;
  favorite_airlines: string[];
  favorite_airports: string[];
  tracked_flight_numbers: string[];
  auto_refresh: boolean;
};

export type UserTrackedFlight = {
  id: string;
  clerk_user_id: string;
  flight_number: string;
  airline_iata: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  label: string | null;
  active: boolean;
};
