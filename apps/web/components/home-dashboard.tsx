"use client";

import dynamic from "next/dynamic";

const ClerkDashboard = dynamic(
  () => import("@/components/flight-dashboard").then((mod) => mod.FlightDashboard),
  {
    ssr: false,
    loading: () => (
      <section id="dashboard" style={{ display: "grid", gap: 24 }}>
        <div className="panel" style={{ padding: 24 }}>Loading dashboard...</div>
      </section>
    ),
  },
);

export function HomeDashboard({ clerkEnabled }: { clerkEnabled: boolean }) {
  if (!clerkEnabled) {
    return (
      <section id="dashboard" style={{ display: "grid", gap: 24 }}>
        <div className="panel" style={{ padding: 24 }}>
          Clerk is not configured yet. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and restart the
          dev server.
        </div>
      </section>
    );
  }

  return <ClerkDashboard />;
}
