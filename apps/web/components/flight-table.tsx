import type { FlightRecord } from "@flight-tracker/types/domain";

type Props = {
  flights: FlightRecord[];
};

export function FlightTable({ flights }: Props) {
  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div style={{ padding: 20, borderBottom: "1px solid var(--line)" }}>
        <h2 style={{ margin: 0 }}>Realtime Flights</h2>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)" }}>
              {["Flight", "Route", "Altitude", "Velocity", "Observed", "Status"].map((heading) => (
                <th key={heading} style={{ padding: "14px 20px", fontWeight: 500 }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flights.map((flight) => (
              <tr key={flight.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ fontWeight: 700 }}>{flight.flight_number ?? flight.callsign}</div>
                  <div style={{ color: "var(--muted)" }}>{flight.airline_iata ?? "Unknown airline"}</div>
                </td>
                <td style={{ padding: "16px 20px" }}>
                  {formatRoute(flight)}
                </td>
                <td style={{ padding: "16px 20px" }}>
                  {flight.altitude_baro ? `${Math.round(flight.altitude_baro)} ft` : "n/a"}
                </td>
                <td style={{ padding: "16px 20px" }}>
                  {flight.velocity ? `${Math.round(flight.velocity)} m/s` : "n/a"}
                </td>
                <td style={{ padding: "16px 20px" }}>
                  {new Date(flight.observed_at).toLocaleTimeString()}
                </td>
                <td style={{ padding: "16px 20px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      borderRadius: 999,
                      padding: "6px 10px",
                      background: "rgba(110,243,197,0.12)",
                      color: "var(--accent-2)",
                    }}
                  >
                    {flight.status ?? "airborne"}
                  </span>
                </td>
              </tr>
            ))}
            {flights.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "var(--muted)" }}>
                  No flights yet. Start the worker and enable Supabase Realtime on `public.flights`.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatRoute(flight: FlightRecord) {
  const estimatedPrefix = isEstimatedRoute(flight) ? "Estimated " : "";

  if (flight.departure_airport && flight.arrival_airport) {
    return `${estimatedPrefix}${flight.departure_airport} to ${flight.arrival_airport}`;
  }

  if (flight.departure_airport) {
    return `${estimatedPrefix}departing ${flight.departure_airport}`;
  }

  if (flight.arrival_airport) {
    return `${estimatedPrefix}arriving ${flight.arrival_airport}`;
  }

  const originCountry = getOriginCountry(flight);

  if (originCountry) {
    return `Route unavailable, tracked over ${originCountry}`;
  }

  return "Route unavailable";
}

function getOriginCountry(flight: FlightRecord) {
  const value = flight.metadata.origin_country;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isEstimatedRoute(flight: FlightRecord) {
  return flight.metadata.route_estimated === true;
}
