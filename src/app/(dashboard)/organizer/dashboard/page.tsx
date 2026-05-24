"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { getEventsByOrganizer, listenToQuery } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSportEmoji, getSportLabel } from "@/lib/sports";
import { getCongestionColor, getCongestionLevel, getCongestionEmoji } from "@/lib/crowd";
import { where } from "firebase/firestore";
import type { SportCategory, CongestionLevel } from "@/lib/types";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your events and crowd flow</p>
        </div>
        <Button onClick={() => router.push("/organizer/events/create")}>Create Event</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalRegistrations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sport Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 flex-wrap">
              {[...new Set(events.map((e) => e.sportCategory))].map((s: any) => (
                <Badge key={s} variant="outline">{getSportEmoji(s)} {getSportLabel(s)}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold mb-4">Your Events</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-muted-foreground mb-4">No events created yet</p>
            <Button onClick={() => router.push("/organizer/events/create")}>
              Create Your First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event: any) => {
            const perGateLoad = event.gateLoad || {};
            return (
              <Link key={event.id} href={`/organizer/events/${event.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge>{getSportEmoji(event.sportCategory)} {getSportLabel(event.sportCategory)}</Badge>
                      <Badge variant={event.status === "live" ? "destructive" : event.status === "upcoming" ? "default" : "secondary"}>
                        {event.status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        {event.venueName} · {event.venueCity}
                      </p>
                      <p>
                        {event.date} at {event.time}
                      </p>
                      <div className="flex items-center gap-4">
                        <span>
                          {event.registeredCount || 0} / {event.capacity} registered
                        </span>
                      </div>
                      {Object.keys(perGateLoad).length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {Object.entries(perGateLoad).map(([gate, level]: [string, any]) => (
                            <Badge key={gate} variant="outline" className="text-xs">
                              {gate}: {getCongestionEmoji(level)} {level}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
