"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { getRegistrationsByUser, getDocById } from "@/lib/firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSportLabel } from "@/lib/sports";
import type { SportCategory } from "@/lib/types";
import { Loader2, CalendarDays } from "lucide-react";

const SPORT_DOT_COLORS: Record<SportCategory, string> = {
  cricket: "bg-red-500",
  badminton: "bg-green-500",
  football: "bg-emerald-600",
  f1: "bg-rose-600",
  hockey: "bg-amber-600",
  basketball: "bg-orange-500",
  tennis: "bg-yellow-500",
  aquatics: "bg-cyan-500",
  combat: "bg-slate-500",
  multi_sport: "bg-violet-500",
};

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
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-1">My Events</h1>
        <p className="text-muted-foreground">Events you have registered for</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-xl border border-border/50 p-12 flex flex-col items-center text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">
            You haven&apos;t registered for any events yet
          </p>
          <Link href="/participant/browse">
            <Button size="sm" className="h-9">
              Browse Events
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {registrations.map((reg) => {
            const event = events[reg.eventId];
            if (!event) return null;
            return (
              <Link key={reg.id} href={`/participant/event/${reg.eventId}`}>
                <div className="rounded-xl border border-border/50 p-4 hover:border-primary/30 transition-all cursor-pointer h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${SPORT_DOT_COLORS[event.sportCategory as SportCategory] ?? "bg-muted-foreground"}`}
                      />
                      <span className="text-sm font-medium">
                        {getSportLabel(event.sportCategory)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.status}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold mb-1">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {event.venueName} · {event.date} at {event.time}
                  </p>
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
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
