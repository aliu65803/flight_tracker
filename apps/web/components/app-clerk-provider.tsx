"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

const SIGN_IN_URL = "/sign-in";
const SIGN_UP_URL = "/sign-up";
const FALLBACK_REDIRECT_URL = "/";

export function AppClerkProvider({
  children,
  publishableKey,
}: {
  children: ReactNode;
  publishableKey?: string;
}) {
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={SIGN_IN_URL}
      signUpUrl={SIGN_UP_URL}
      signInFallbackRedirectUrl={FALLBACK_REDIRECT_URL}
      signUpFallbackRedirectUrl={FALLBACK_REDIRECT_URL}
      afterSignOutUrl={FALLBACK_REDIRECT_URL}
    >
      {children}
    </ClerkProvider>
  );
}
