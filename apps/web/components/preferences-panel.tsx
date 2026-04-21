"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { UserPreferences } from "@flight-tracker/types/domain";
import { AIRPORT_OPTIONS } from "@/lib/airport-options";

type Props = {
  preferences: UserPreferences | null;
  onChange: (preferences: UserPreferences) => void;
  onSave: (preferences: UserPreferences) => Promise<void>;
};

export function PreferencesPanel({ preferences, onChange, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<UserPreferences | null>(preferences);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  const current = draft ?? preferences;

  useEffect(() => {
    if (draft) {
      onChange(draft);
    }
  }, [draft, onChange]);

  const updateDraft = (key: keyof UserPreferences, value: string | boolean) => {
    if (!current) {
      return;
    }

    if (typeof value === "boolean") {
      setDraft({ ...current, [key]: value });
      return;
    }

    const nextValue = value
      .split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
    setDraft({ ...current, [key]: nextValue });
  };

  const toggleAirport = (airport: string) => {
    if (!current) {
      return;
    }

    const nextAirports = current.favorite_airports.includes(airport)
      ? current.favorite_airports.filter((item) => item !== airport)
      : [...current.favorite_airports, airport];

    setDraft({ ...current, favorite_airports: nextAirports });
  };

  const visibleAirports = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();

    if (!normalizedQuery) {
      return AIRPORT_OPTIONS;
    }

    return AIRPORT_OPTIONS.filter((airport) => {
      return airport.iata.includes(normalizedQuery) || airport.name.toUpperCase().includes(normalizedQuery);
    });
  }, [query]);

  const save = async () => {
    if (!current) {
      return;
    }

    setSaving(true);
    await onSave(current);
    setSaving(false);
  };

  if (!current) {
    return (
      <div className="panel" style={{ padding: 20 }}>
        Loading preferences...
      </div>
    );
  }

  return (
    <div
      className="panel settingsPanel"
      style={{ padding: 22, display: "grid", gap: 18, position: "relative", zIndex: 30 }}
    >
      <div>
        <p style={{ margin: 0, color: "var(--accent-deep)", letterSpacing: 1.4, fontWeight: 700, fontSize: 13 }}>
          PERSONAL BOARD
        </p>
        <h2 style={{ margin: "8px 0 0" }}>Airport board settings</h2>
        <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
          Pick one or more airports to build a live board for arriving and departing flights.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {current.favorite_airports.length > 0
          ? current.favorite_airports.map((airport) => (
              <button
                key={airport}
                type="button"
                onClick={() => toggleAirport(airport)}
                className="boardMono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "rgba(47,108,143,0.08)",
                  color: "var(--accent-deep)",
                  border: "1px solid rgba(47,108,143,0.1)",
                  cursor: "pointer",
                }}
              >
                {airport}
                <span style={{ fontSize: 12, opacity: 0.72 }}>×</span>
              </button>
            ))
          : (
            <span style={{ color: "var(--muted)" }}>No airports selected yet.</span>
            )}
      </div>
      <label style={{ display: "grid", gap: 8 }}>
        Airports to watch
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            style={pickerButtonStyle}
          >
            <span>
              {current.favorite_airports.length > 0
                ? `${current.favorite_airports.length} airport${current.favorite_airports.length === 1 ? "" : "s"} selected`
                : "Choose airports"}
            </span>
            <span className="boardMono" style={{ color: "var(--accent-deep)" }}>
              {pickerOpen ? "−" : "+"}
            </span>
          </button>
          {pickerOpen ? (
            <div style={pickerPanelStyle}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                style={inputStyle}
                placeholder="Search airport or code"
              />
              <div style={{ maxHeight: 260, overflowY: "auto", display: "grid", gap: 6 }}>
                {visibleAirports.map((airport) => {
                  const checked = current.favorite_airports.includes(airport.iata);

                  return (
                    <label
                      key={airport.iata}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: checked ? "rgba(47,108,143,0.08)" : "rgba(255,255,255,0.66)",
                        border: "1px solid rgba(47,108,143,0.08)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "grid", gap: 2 }}>
                        <span className="boardMono" style={{ fontWeight: 700, color: "var(--accent-deep)" }}>
                          {airport.iata}
                        </span>
                        <span style={{ color: "var(--muted)", fontSize: 14 }}>{airport.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAirport(airport.iata)}
                      />
                    </label>
                  );
                })}
                {visibleAirports.length === 0 ? (
                  <div style={{ padding: "12px 8px", color: "var(--muted)" }}>No airports match that search.</div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="checkbox"
          checked={current.auto_refresh}
          onChange={(event) => updateDraft("auto_refresh", event.target.checked)}
        />
        Auto refresh enabled
      </label>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        style={{
          width: "fit-content",
          padding: "12px 18px",
          borderRadius: 999,
          border: "1px solid var(--line)",
          background: "linear-gradient(135deg, var(--accent-deep), #4f89ad)",
          color: "#fffaf2",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {saving ? "Saving..." : "Save airport board"}
      </button>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid var(--line)",
  padding: "12px 14px",
  background: "rgba(255, 255, 255, 0.78)",
  color: "var(--text)",
};

const pickerButtonStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  borderRadius: 14,
  border: "1px solid var(--line)",
  padding: "12px 14px",
  background: "rgba(255, 255, 255, 0.78)",
  color: "var(--text)",
  cursor: "pointer",
};

const pickerPanelStyle: CSSProperties = {
  position: "absolute",
  zIndex: 80,
  top: "calc(100% + 10px)",
  left: 0,
  right: 0,
  padding: 12,
  borderRadius: 18,
  border: "1px solid rgba(47,108,143,0.12)",
  background: "rgba(255, 250, 242, 0.98)",
  boxShadow: "0 18px 40px rgba(90, 83, 67, 0.16)",
  display: "grid",
  gap: 12,
  backdropFilter: "blur(12px)",
};
