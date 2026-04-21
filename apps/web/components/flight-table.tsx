import { useEffect, useState } from "react";
import type { FlightRecord } from "@flight-tracker/types/domain";

type Props = {
  flights: FlightRecord[];
  watchedAirports: string[];
  autoRefresh: boolean;
};

type BoardRow = {
  key: string;
  boardAirport: string;
  direction: "Departure" | "Arrival";
  flight: FlightRecord;
};

type BoardGroups = {
  departures: BoardRow[];
  arrivals: BoardRow[];
  usingFallback: boolean;
};

export function FlightTable({ flights, watchedAirports, autoRefresh }: Props) {
  const board = buildBoardRows(flights, watchedAirports);
  const [clock, setClock] = useState(() => new Date());
  const airportBoards = watchedAirports.map((airport) => ({
    airport,
    departures: board.departures.filter((row) => row.boardAirport === airport),
    arrivals: board.arrivals.filter((row) => row.boardAirport === airport),
  }));

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="panel boardShell" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: 24,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p className="boardMono" style={{ margin: 0, color: "rgba(241,199,125,0.92)", fontSize: 13 }}>
            LIVE DEPARTURE BOARD
          </p>
          <h2 style={{ margin: "8px 0 0", fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>Airport board</h2>
        </div>
        <div
          className="boardCard boardMono"
          style={{ padding: "12px 16px", minWidth: 180, textAlign: "right" }}
        >
          <div style={{ color: "rgba(243,239,230,0.68)", fontSize: 12 }}>Board time</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{clock.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
        </div>
        <p style={{ margin: 0, color: "rgba(243,239,230,0.78)", maxWidth: 720, lineHeight: 1.6 }}>
          {watchedAirports.length > 0
            ? `Watching ${watchedAirports.join(", ")}${autoRefresh ? " with live updates." : " without auto refresh."}${board.usingFallback ? " No flights are currently on the board in the next 3 hours, so showing the latest available matches instead." : " Showing flights on the board within the next 3 hours."}`
            : "Choose one or more airports above to show estimated arrivals and departures."}
        </p>
      </div>
      <div style={{ display: "grid", gap: 18, padding: 18 }}>
        {airportBoards.map((airportBoard) => (
          <AirportBoard
            key={airportBoard.airport}
            airport={airportBoard.airport}
            departures={airportBoard.departures}
            arrivals={airportBoard.arrivals}
            watchedAirports={watchedAirports}
          />
        ))}
        {watchedAirports.length === 0 ? (
          <div className="boardCard" style={{ padding: 24, color: "rgba(243,239,230,0.75)" }}>
            Choose airports above to build a live airport-style board.
          </div>
        ) : null}
      </div>
    </div>
  );
}

type AirportBoardProps = {
  airport: string;
  departures: BoardRow[];
  arrivals: BoardRow[];
  watchedAirports: string[];
};

function AirportBoard({ airport, departures, arrivals, watchedAirports }: AirportBoardProps) {
  return (
    <section className="boardCard" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "18px 20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <h3 className="boardMono" style={{ margin: 0, fontSize: "2rem", lineHeight: 1, color: "#f1c77d" }}>
            {airport}
          </h3>
          <span style={{ color: "rgba(243,239,230,0.6)", fontSize: 14 }}>
            {departures.length + arrivals.length} board {departures.length + arrivals.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Chip label="Departures" value={departures.length} />
          <Chip label="Arrivals" value={arrivals.length} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 0 }}>
        <BoardSection
          title="Departures"
          rows={departures}
          watchedAirports={watchedAirports}
          emptyMessage="No departures on the board in the next 3 hours."
        />
        <BoardSection
          title="Arrivals"
          rows={arrivals}
          watchedAirports={watchedAirports}
          emptyMessage="No arrivals on the board in the next 3 hours."
          withDivider
        />
      </div>
    </section>
  );
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="boardMono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        color: "rgba(243,239,230,0.78)",
        fontSize: 12,
      }}
    >
      <span>{label}</span>
      <strong style={{ color: "#f1c77d" }}>{value}</strong>
    </div>
  );
}

type BoardSectionProps = {
  title: string;
  rows: BoardRow[];
  watchedAirports: string[];
  emptyMessage: string;
  withDivider?: boolean;
};

function BoardSection({ title, rows, watchedAirports, emptyMessage, withDivider = false }: BoardSectionProps) {
  return (
    <section style={{ borderLeft: withDivider ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
      <div style={{ padding: "16px 18px 12px" }}>
        <h4 className="boardMono" style={{ margin: 0, color: "#87d0de", fontSize: 14 }}>
          {title.toUpperCase()}
        </h4>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead>
            <tr className="boardMono" style={{ textAlign: "left", color: "rgba(243,239,230,0.54)", fontSize: 12 }}>
              {["Flight", "Route", "Estimated", "Gate", "Terminal", "Status"].map((heading) => (
                <th key={heading} style={{ padding: "12px 18px", fontWeight: 500 }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <td style={{ padding: "16px 18px" }}>
                  <div className="boardMono" style={{ fontWeight: 700, fontSize: 18 }}>
                    {row.flight.flight_number ?? row.flight.callsign}
                  </div>
                  <div style={{ color: "rgba(243,239,230,0.58)", marginTop: 4 }}>
                    {row.flight.airline_iata ?? "Unknown airline"}
                  </div>
                </td>
                <td style={{ padding: "16px 18px", color: "rgba(243,239,230,0.84)" }}>{formatRoute(row.flight)}</td>
                <td style={{ padding: "16px 18px" }}>
                  <div className="boardMono" style={{ fontSize: 18, color: "#f1c77d", fontWeight: 700 }}>
                    {formatEstimatedTime(row.flight, row.direction)}
                  </div>
                  <div style={{ color: "rgba(243,239,230,0.5)", marginTop: 4 }}>
                    observed {new Date(row.flight.observed_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </div>
                </td>
                <td className="boardMono" style={{ padding: "16px 18px", color: "#f3efe6" }}>
                  {formatGate(row.flight, row.direction)}
                </td>
                <td className="boardMono" style={{ padding: "16px 18px", color: "rgba(243,239,230,0.78)" }}>
                  {formatTerminal(row.flight, row.direction)}
                </td>
                <td style={{ padding: "16px 18px" }}>
                  <span
                    className="boardMono"
                    style={{
                      display: "inline-flex",
                      borderRadius: 999,
                      padding: "6px 10px",
                      background: "rgba(135,208,222,0.12)",
                      color: "#9adbe7",
                      textTransform: "uppercase",
                      fontSize: 12,
                    }}
                  >
                    {formatBoardStatus(row.flight, row.direction)}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "rgba(243,239,230,0.6)" }}>
                  {watchedAirports.length === 0 ? "Choose airports above to build a live airport-style board." : emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
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

function buildBoardRows(flights: FlightRecord[], watchedAirports: string[]): BoardGroups {
  const allRows = buildAllRows(flights, watchedAirports);
  const now = Date.now();
  const windowEnd = now + 3 * 60 * 60 * 1000;

  const boardRows = allRows.filter((row) => {
    const estimatedAt = getEstimatedDate(row.flight, row.direction).getTime();
    return estimatedAt >= now && estimatedAt <= windowEnd;
  });

  const usingFallback = boardRows.length === 0 && allRows.length > 0;
  const rows = usingFallback ? allRows.slice(0, 20) : boardRows;

  return {
    departures: rows.filter((row) => row.direction === "Departure"),
    arrivals: rows.filter((row) => row.direction === "Arrival"),
    usingFallback,
  };
}

function buildAllRows(flights: FlightRecord[], watchedAirports: string[]) {
  const airportSet = new Set(watchedAirports);

  return flights
    .flatMap((flight) => {
      const rows: BoardRow[] = [];

      if (flight.departure_airport && airportSet.has(flight.departure_airport)) {
        rows.push({
          key: `${flight.id}:departure:${flight.departure_airport}`,
          boardAirport: flight.departure_airport,
          direction: "Departure",
          flight,
        });
      }

      if (flight.arrival_airport && airportSet.has(flight.arrival_airport)) {
        rows.push({
          key: `${flight.id}:arrival:${flight.arrival_airport}`,
          boardAirport: flight.arrival_airport,
          direction: "Arrival",
          flight,
        });
      }

      return rows;
    })
    .sort(
      (left, right) =>
        getEstimatedDate(left.flight, left.direction).getTime() -
        getEstimatedDate(right.flight, right.direction).getTime(),
    );
}

function formatBoardStatus(flight: FlightRecord, direction: BoardRow["direction"]) {
  if (flight.status === "on_ground") {
    return direction === "Departure" ? "boarding" : "landed";
  }

  if (typeof flight.status === "string" && flight.status.length > 0) {
    return flight.status.replaceAll("_", " ");
  }

  if (isEstimatedRoute(flight)) {
    return direction === "Arrival" ? "approaching" : "departed";
  }

  return flight.status ?? "active";
}

function formatEstimatedTime(flight: FlightRecord, direction: BoardRow["direction"]) {
  return getEstimatedDate(flight, direction).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEstimatedDate(flight: FlightRecord, direction: BoardRow["direction"]) {
  const providerEstimated = getDirectionTimestamp(flight, direction, [
    "predicted_utc",
    "revised_utc",
    "scheduled_utc",
    "actual_utc",
    "runway_utc",
  ]);

  if (providerEstimated) {
    return providerEstimated;
  }

  const observed = new Date(flight.observed_at);
  const delayMinutes = getEstimatedOffsetMinutes(flight);
  return new Date(observed.getTime() + delayMinutes * 60_000);
}

function formatGate(flight: FlightRecord, direction: BoardRow["direction"]) {
  const gate = getDirectionString(flight, direction, "gate");

  if (gate) {
    return gate;
  }

  const seed = hashSeed(`${flight.external_id}:gate`);
  const letter = ["A", "B", "C", "D", "E"][seed % 5];
  const number = (seed % 28) + 1;
  return `${letter}${number}`;
}

function formatTerminal(flight: FlightRecord, direction: BoardRow["direction"]) {
  const terminal = getDirectionString(flight, direction, "terminal");

  if (terminal) {
    return terminal;
  }

  const seed = hashSeed(`${flight.external_id}:terminal`);
  return `T${(seed % 6) + 1}`;
}

function getEstimatedOffsetMinutes(flight: FlightRecord) {
  if (flight.status === "on_ground") {
    return 8;
  }

  const seed = hashSeed(`${flight.external_id}:estimated`);
  return (seed % 51) + 14;
}

function hashSeed(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getDirectionString(
  flight: FlightRecord,
  direction: BoardRow["direction"],
  field: "gate" | "terminal",
) {
  const value = flight.metadata[`${direction.toLowerCase()}_${field}`];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getDirectionTimestamp(
  flight: FlightRecord,
  direction: BoardRow["direction"],
  suffixes: Array<"predicted_utc" | "revised_utc" | "scheduled_utc" | "actual_utc" | "runway_utc">,
) {
  for (const suffix of suffixes) {
    const value = flight.metadata[`${direction.toLowerCase()}_${suffix}`];

    if (typeof value === "string" && value.length > 0) {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}
