import Link from "next/link";
import { AuthCtaButton } from "@/components/auth-cta-button";
import { HomeDashboard } from "@/components/home-dashboard";

export default function HomePage() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="shell">
      <section
        className="panel heroPanel"
        style={{
          padding: 36,
          display: "grid",
          gap: 28,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ margin: 0, color: "var(--accent-deep)", letterSpacing: 1.8, fontWeight: 700 }}>
              DEPARTURES AND ARRIVALS
            </p>
            <h1 style={{ margin: "10px 0 0", fontSize: "clamp(2.8rem, 6vw, 5rem)", lineHeight: 0.92 }}>
              Airport board
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {clerkEnabled ? <AuthCtaButton /> : null}
          </div>
        </div>
        <p style={{ margin: 0, color: "var(--muted)", maxWidth: 720, lineHeight: 1.6 }}>
          Build a personal departures board around the airports you care about and watch estimated
          arrivals and departures refresh throughout the day.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {[
            ["Live board", "Real-time rows shaped into a departures-style display"],
            ["Airport focus", "Watch only the terminals and runways that matter to you"],
            ["Travel feel", "Warmer, lounge-inspired visuals instead of generic app chrome"],
          ].map(([title, copy]) => (
            <div
              key={title}
              style={{
                padding: "16px 18px",
                borderRadius: 18,
                border: "1px solid rgba(47,108,143,0.12)",
                background: "rgba(255,255,255,0.46)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
              <div style={{ color: "var(--muted)", lineHeight: 1.5, fontSize: 14 }}>{copy}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="#dashboard"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: "rgba(255,255,255,0.72)",
            }}
          >
            Open board
          </Link>
          <Link
            href="https://supabase.com/docs/guides/realtime"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: "rgba(255,255,255,0.32)",
            }}
          >
            Realtime docs
          </Link>
        </div>
      </section>
      <HomeDashboard clerkEnabled={clerkEnabled} />
    </main>
  );
}
