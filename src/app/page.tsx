"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserRole } from "@/lib/types";

const ROLE_ROUTES: Record<UserRole, string> = {
  participant: "/participant/browse",
  organizer: "/organizer/dashboard",
  venue_owner: "/venue-owner/venues",
  sponsor: "/sponsor/browse",
};

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && role) {
      router.push(ROLE_ROUTES[role]);
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user && role) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-accent/20 px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-semibold tracking-tight mb-3">
          <span className="text-primary drop-shadow-[0_0_12px_oklch(0.42_0.1_175/0.3)]">சி</span> Siran
        </h1>
        <p className="text-xl text-muted-foreground mb-1 font-light">
          Smart Crowd Flow for Sporting Events
        </p>
        <p className="text-muted-foreground mb-10">
          Predict arrival patterns, distribute crowds across gates, and eliminate entry chaos
          at large-scale sporting events.
        </p>
        <div className="flex gap-4 justify-center mb-8">
          <Button size="lg" onClick={() => router.push("/register")}>
            Get Started
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.push("/login")}>
            Sign In
          </Button>
        </div>
        <div className="w-16 h-px bg-border mx-auto mb-10" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          <Card className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-lg">🎟️ Participant</CardTitle>
              <CardDescription>
                Register for events, declare arrival time, get gate recommendations
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-lg">📋 Organizer</CardTitle>
              <CardDescription>
                Create events, monitor crowd flow, manage gate loads in real time
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-lg">🏟️ Venue Owner</CardTitle>
              <CardDescription>
                List venues, map gates, accept bookings from organizers
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-lg">🤝 Sponsor</CardTitle>
              <CardDescription>
                Discover events, connect with organizers for sponsorship deals
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
