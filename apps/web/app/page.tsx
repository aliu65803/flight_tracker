import Link from "next/link";
import { AuthCtaButton } from "@/components/auth-cta-button";
import { HomeDashboard } from "@/components/home-dashboard";

export default function HomePage() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="shell">
      <section
        className="panel"
        style={{
          padding: 32,
          display: "grid",
          gap: 22,
          marginBottom: 28,
          background:
            "linear-gradient(135deg, rgba(255,248,238,0.96), rgba(241,248,250,0.88) 48%, rgba(255,242,218,0.86))",
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
            <h1 style={{ margin: "10px 0 0", fontSize: "clamp(2.5rem, 5vw, 4.4rem)", lineHeight: 0.95 }}>
              Airport board,
              <br />
              reimagined
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
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="#dashboard"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: "rgba(255,255,255,0.62)",
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
