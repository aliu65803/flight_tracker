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
        <h2 style={{ margin: 0 }}>Airport board settings</h2>
        <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
          Pick one or more airports to build a live board for arriving and departing flights.
        </p>
      </div>
      <label style={{ display: "grid", gap: 8 }}>
        Airports to watch
        <input
          defaultValue={current.favorite_airports.join(", ")}
          onChange={(event) => updateDraft("favorite_airports", event.target.value)}
          style={inputStyle}
          placeholder="ORD, JFK, LAX"
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
