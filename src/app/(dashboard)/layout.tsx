"use client";

import { NavBar } from "@/components/shared/nav-bar";
import { FirebaseStatus } from "@/components/shared/firebase-status";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hasApiKey = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const isConfigured =
    hasApiKey &&
    hasProjectId &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your-api-key" &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "your-project-id";

  return (
    <>
      <NavBar />
      {!isConfigured && (
        <div className="container mx-auto px-4 pt-4">
          <FirebaseStatus />
        </div>
      )}
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </>
  );
}
