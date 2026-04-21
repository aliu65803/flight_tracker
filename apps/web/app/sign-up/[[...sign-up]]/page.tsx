import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClerkSignUpPanel } from "@/components/clerk-sign-up-panel";

export default async function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="shell" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        Clerk is not configured yet.
      </main>
    );
  }

  const { userId } = await auth();

  if (userId) {
    redirect("/");
  }

  return <ClerkSignUpPanel />;
}
