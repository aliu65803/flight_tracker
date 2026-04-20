import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
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
