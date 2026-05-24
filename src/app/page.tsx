"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  ClipboardList,
  MapPinned,
  Handshake,
  ArrowRight,
  Users,
  Radar,
  Shield,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

const ROLE_ROUTES: Record<UserRole, string> = {
  participant: "/participant/browse",
  organizer: "/organizer/dashboard",
  venue_owner: "/venue-owner/venues",
  sponsor: "/sponsor/browse",
};

const ROLES = [
  {
    icon: <Ticket className="h-5 w-5" />,
    title: "Participant",
    desc: "Browse events, declare your arrival window, and get an optimal gate assignment.",
  },
  {
    icon: <ClipboardList className="h-5 w-5" />,
    title: "Organizer",
    desc: "Create events, broadcast instructions, and monitor crowd flow in real time.",
  },
  {
    icon: <MapPinned className="h-5 w-5" />,
    title: "Venue Owner",
    desc: "List venues with gate layouts and enrich details from global databases.",
  },
  {
    icon: <Handshake className="h-5 w-5" />,
    title: "Sponsor",
    desc: "Discover events by reach and connect directly with organizers.",
  },
];

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
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user && role) return null;

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 sm:py-28">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <Radar className="h-3.5 w-3.5" />
            <span>Built for the GDG Hackathon</span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Smart crowd flow for{" "}
            <span className="text-primary">sporting events</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Predict arrival patterns, distribute crowds across gates, and eliminate
            entry chaos at stadiums and arenas across India.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="gap-1.5 text-sm font-medium"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/login")}
              className="text-sm font-medium"
            >
              Sign In
            </Button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              4 User Roles
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Firebase Backend
            </span>
            <span className="flex items-center gap-1.5">
              <Radar className="h-3.5 w-3.5" />
              Live Crowd Tracking
            </span>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div
              key={r.title}
              className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-5 transition-all hover:border-border hover:bg-card hover:shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {r.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{r.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {r.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
