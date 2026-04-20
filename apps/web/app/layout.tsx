import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppClerkProvider } from "@/components/app-clerk-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flight Tracker",
  description: "Realtime flight tracking with Clerk, Supabase, Railway, and Vercel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppClerkProvider publishableKey={publishableKey}>{children}</AppClerkProvider>
      </body>
    </html>
  );
}
