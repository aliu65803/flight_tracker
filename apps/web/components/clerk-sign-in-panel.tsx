"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const SignIn = dynamic(
  async () => {
    const module = await import("@clerk/nextjs");
    return module.SignIn;
  },
  { ssr: false },
);

export function ClerkSignInPanel() {
  return (
    <main
      className="shell"
      style={{ display: "grid", placeItems: "center", minHeight: "100vh", gap: 20, paddingBlock: 32 }}
    >
      <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/" />
      <p style={{ margin: 0, color: "var(--muted)" }}>
        Need an account?{" "}
        <Link href="/sign-up" style={{ color: "var(--accent-2)" }}>
          Sign up
        </Link>
      </p>
    </main>
  );
}
