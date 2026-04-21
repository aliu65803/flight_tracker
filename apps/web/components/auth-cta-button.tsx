"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignOutButton } from "@clerk/nextjs";

export function AuthCtaButton() {
  return (
    <>
      <SignedOut>
        <Link
          href="/sign-in"
          className="pillButton"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(252,247,239,0.94))" }}
        >
          Sign in to save airports
        </Link>
      </SignedOut>
      <SignedIn>
        <SignOutButton>
          <button
            type="button"
            className="pillButton"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(252,247,239,0.94))" }}
          >
            Sign out
          </button>
        </SignOutButton>
      </SignedIn>
    </>
  );
}
