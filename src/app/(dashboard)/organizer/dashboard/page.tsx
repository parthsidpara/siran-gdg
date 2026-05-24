"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { listenToQuery } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSportEmoji, getSportLabel } from "@/lib/sports";
import { getCongestionEmoji } from "@/lib/crowd";
import { where } from "firebase/firestore";
import { CalendarDays, Users, Trophy, ArrowRight, Loader2, Radar } from "lucide-react";

export default function OrganizerDashboard() {
  return (
    <RoleGuard role="organizer">
      <DashboardContent />
    </RoleGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToQuery("events", [where("organizerId", "==", user.uid)], (data) => {
      setEvents(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const totalRegistrations = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
  const sportSet = [...new Set(events.map((e) => e.sportCategory))];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Overview of your events and crowd flow</p>
        </div>
        <Button size="sm" onClick={() => router.push("/organizer/events/create")}>
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
          New Event
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-0 bg-muted/40">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{events.length}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/40">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{totalRegistrations}</p>
              <p className="text-xs text-muted-foreground">Registrations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/40">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{sportSet.length}</p>
              <p className="text-xs text-muted-foreground">Sport Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Your Events</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <Radar className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No events created yet</p>
            <Button size="sm" onClick={() => router.push("/organizer/events/create")}>
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((event: any) => {
              const gateLoad = event.gateLoad || {};
              const fillRate = event.capacity ? Math.round(((event.registeredCount || 0) / event.capacity) * 100) : 0;
              return (
                <Link key={event.id} href={`/organizer/events/${event.id}`}>
                  <div className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-border hover:bg-muted/30 hover:shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getSportEmoji(event.sportCategory)}</span>
                        <span className="text-xs font-medium text-muted-foreground">{getSportLabel(event.sportCategory)}</span>
                      </div>
                      <StatusPill status={event.status} />
                    </div>
                    <h3 className="font-semibold tracking-tight leading-snug">{event.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{event.venueName}</span>
                      <span className="text-border">·</span>
                      <span>{event.date}</span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{event.registeredCount || 0}</span>
                        <span className="text-xs text-muted-foreground">/ {event.capacity}</span>
                        <div className="ml-1 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${fillRate}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Object.entries(gateLoad).slice(0, 3).map(([gate, level]: [string, any]) => (
                          <span key={gate} className="text-xs text-muted-foreground" title={`${gate}: ${level}`}>
                            {getCongestionEmoji(level)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        Live
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/50 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
        Upcoming
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      Completed
    </span>
  );
}
