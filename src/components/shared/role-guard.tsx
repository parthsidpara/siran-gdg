"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import type { UserRole } from "@/lib/types";

const ROLE_ROUTES: Record<UserRole, string> = {
  participant: "/participant/browse",
  organizer: "/organizer/dashboard",
  venue_owner: "/venue-owner/venues",
  sponsor: "/sponsor/browse",
};

export function RoleGuard({ children, role }: { children: React.ReactNode; role: UserRole }) {
  const { user, role: userRole, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (userRole && userRole !== role) {
      router.push(ROLE_ROUTES[userRole]);
    }
  }, [user, userRole, loading, router, pathname, role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || userRole !== role) return null;

  return <>{children}</>;
}
