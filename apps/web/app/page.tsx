import Link from "next/link";
import { HomeDashboard } from "@/components/home-dashboard";

export default function HomePage() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="shell">
      <section
        className="panel"
        style={{
          padding: 28,
          display: "grid",
          gap: 18,
          marginBottom: 24,
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
            <p style={{ margin: 0, color: "var(--accent-2)", letterSpacing: 1.2 }}>
              LIVE OPERATIONS VIEW
            </p>
            <h1 style={{ margin: "8px 0 0", fontSize: "clamp(2.2rem, 5vw, 4rem)" }}>
              Flight Tracker
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/sign-in"
              style={{
                borderRadius: 999,
                padding: "12px 18px",
                border: "1px solid var(--line)",
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: "#04111d",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
        <p style={{ margin: 0, color: "var(--muted)", maxWidth: 720, lineHeight: 1.6 }}>
          Poll live flight data in Railway, stream writes through Supabase Realtime, and let
          users personalize what they see with Clerk-backed identity.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="#dashboard"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: "var(--bg-elevated)",
            }}
          >
            Open dashboard
          </Link>
          <Link
            href="https://supabase.com/docs/guides/realtime"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: "transparent",
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
