"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { getRegistrationsByUser, getDocById } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSportEmoji, getSportLabel } from "@/lib/sports";
import { getCongestionEmoji, getCongestionLabel } from "@/lib/crowd";
import type { SportCategory } from "@/lib/types";

export default function MyEventsPage() {
  return (
    <RoleGuard role="participant">
      <MyEventsContent />
    </RoleGuard>
  );
}

function MyEventsContent() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getRegistrationsByUser(user.uid).then(async (regs: any[]) => {
      setRegistrations(regs);
      const eventMap: Record<string, any> = {};
      await Promise.all(
        regs.map(async (r) => {
          if (!eventMap[r.eventId]) {
            const evt = await getDocById("events", r.eventId);
            if (evt) eventMap[r.eventId] = evt;
          }
        })
      );
      setEvents(eventMap);
      setLoading(false);
    });
  }, [user]);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight mb-6">My Events</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
        </div>
      ) : registrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-muted-foreground mb-4">You haven&apos;t registered for any events yet</p>
            <Link href="/participant/browse">
              <Badge className="cursor-pointer hover:bg-primary/90 px-4 py-2">Browse Events</Badge>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {registrations.map((reg) => {
            const event = events[reg.eventId];
            if (!event) return null;
            return (
              <Link key={reg.id} href={`/participant/event/${reg.eventId}`}>
                <Card className="hover:border-primary/30 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-1">
                      <Badge>
                        {getSportEmoji(event.sportCategory)}{" "}
                        {getSportLabel(event.sportCategory)}
                      </Badge>
                      <Badge variant="outline">{event.status}</Badge>
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>
                      {event.venueName} · {event.date} at {event.time}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-muted-foreground">Arrival:</span>{" "}
                        <strong>{reg.arrivalWindow}</strong>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Gate:</span>{" "}
                        <strong>{reg.assignedGate}</strong>
                      </p>
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
