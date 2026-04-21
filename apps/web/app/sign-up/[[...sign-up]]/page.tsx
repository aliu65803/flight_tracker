"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="shell" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        Clerk is not configured yet.
      </main>
    );
  }

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
