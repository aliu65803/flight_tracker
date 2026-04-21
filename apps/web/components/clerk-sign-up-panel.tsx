"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const SignUp = dynamic(
  async () => {
    const module = await import("@clerk/nextjs");
    return module.SignUp;
  },
  { ssr: false },
);

export function ClerkSignUpPanel() {
  return (
    <main
      className="shell"
      style={{ display: "grid", placeItems: "center", minHeight: "100vh", gap: 20, paddingBlock: 32 }}
    >
      <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/" />
      <p style={{ margin: 0, color: "var(--muted)" }}>
        Already have an account?{" "}
        <Link href="/sign-in" style={{ color: "var(--accent-2)" }}>
          Sign in
        </Link>
      </p>
    </main>
  );
}
