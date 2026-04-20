"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import type { UserPreferences } from "@flight-tracker/types/domain";

type Props = {
  preferences: UserPreferences | null;
  onSave: (preferences: UserPreferences) => Promise<void>;
};

export function PreferencesPanel({ preferences, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<UserPreferences | null>(preferences);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  const current = draft ?? preferences;

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
    <div className="panel" style={{ padding: 20, display: "grid", gap: 18 }}>
      <div>
        <h2 style={{ margin: 0 }}>Personalized filters</h2>
        <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
          Use comma-separated values to tune the feed for the signed-in user.
        </p>
      </div>
      <label style={{ display: "grid", gap: 8 }}>
        Favorite airlines
        <input
          defaultValue={current.favorite_airlines.join(", ")}
          onChange={(event) => updateDraft("favorite_airlines", event.target.value)}
          style={inputStyle}
          placeholder="AA, UA, DL"
        />
      </label>
      <label style={{ display: "grid", gap: 8 }}>
        Favorite airports
        <input
          defaultValue={current.favorite_airports.join(", ")}
          onChange={(event) => updateDraft("favorite_airports", event.target.value)}
          style={inputStyle}
          placeholder="ORD, JFK, LAX"
        />
      </label>
      <label style={{ display: "grid", gap: 8 }}>
        Tracked flight numbers
        <input
          defaultValue={current.tracked_flight_numbers.join(", ")}
          onChange={(event) => updateDraft("tracked_flight_numbers", event.target.value)}
          style={inputStyle}
          placeholder="AA100, UA2411"
        />
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
          padding: "10px 16px",
          borderRadius: 999,
          border: "1px solid var(--line)",
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          color: "#04111d",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {saving ? "Saving..." : "Save preferences"}
      </button>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid var(--line)",
  padding: "12px 14px",
  background: "rgba(3, 8, 18, 0.8)",
  color: "var(--text)",
};
