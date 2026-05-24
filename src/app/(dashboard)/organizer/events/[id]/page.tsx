"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/shared/role-guard";
import { listenToDoc, getRegistrationsByEvent, getDocById } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSportEmoji, getSportLabel } from "@/lib/sports";
import { VenueMap } from "@/components/venue/venue-map";
import {
  getCongestionLabel,
  getCongestionEmoji,
  getCongestionColor,
  getCongestionLevel,
  generateArrivalWindows,
} from "@/lib/crowd";
import { updateDocById } from "@/lib/firebase/firestore";
import { toast } from "sonner";

export default function OrganizerEventDetail() {
  return (
    <RoleGuard role="organizer">
      <EventDetailContent />
    </RoleGuard>
  );
}

function EventDetailContent() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenToDoc("events", id as string, async (data) => {
      if (data) {
        setEvent(data);
        if (data.venueId) {
          const v = await getDocById("venues", data.venueId);
          setVenue(v);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    getRegistrationsByEvent(id as string).then(setRegistrations);
  }, [id]);

  const updateGateLoad = async (gateId: string, load: string) => {
    if (!event) return;
    const updated = { ...event.gateLoad, [gateId]: load };
    await updateDocById("events", id as string, { gateLoad: updated });
    toast.success(`Gate ${gateId} updated to ${load}`);
  };

  if (loading || !event) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hour = event.time ? parseInt(event.time.split(":")[0]) : 17;
  const arrivalWindows = generateArrivalWindows(
    Math.max(0, hour - 3),
    hour,
    30
  );

  const arrivalSlots = event.arrivalSlots || {};
  const gateLoad = event.gateLoad || {};

  const perWindowPerGate: Record<string, Record<string, number>> = {};
  arrivalWindows.forEach((w) => {
    perWindowPerGate[w] = {};
  });
  registrations.forEach((r) => {
    if (!perWindowPerGate[r.arrivalWindow]) perWindowPerGate[r.arrivalWindow] = {};
    perWindowPerGate[r.arrivalWindow][r.assignedGate] =
      (perWindowPerGate[r.arrivalWindow][r.assignedGate] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground">
            {getSportEmoji(event.sportCategory)} {getSportLabel(event.sportCategory)} · {event.venueName} · {event.date} at {event.time}
          </p>
        </div>
        <Badge variant={event.status === "live" ? "destructive" : event.status === "upcoming" ? "default" : "secondary"} className="text-sm px-3 py-1">
          {event.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{event.registeredCount || 0}</p>
            <p className="text-xs text-muted-foreground">
              of {event.capacity?.toLocaleString()} capacity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Arrival Windows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Object.keys(arrivalSlots).length}</p>
            <p className="text-xs text-muted-foreground">30-min slots with declarations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Object.keys(gateLoad).length}</p>
            <p className="text-xs text-muted-foreground">Active entry points</p>
          </CardContent>
        </Card>
      </div>

      {/* Arrival Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Arrival Projections (30-min windows)</CardTitle>
        </CardHeader>
        <CardContent>
          {arrivalWindows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No time windows set</p>
          ) : (
            <div className="space-y-3">
              {arrivalWindows.map((window) => {
                const count = arrivalSlots[window] || 0;
                const max = Math.max(...Object.values(arrivalSlots).map(Number), 1);
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={window} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{window}</span>
                      <span className="text-muted-foreground">{count} participants</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.values(arrivalSlots).every((v) => v === 0) && (
                <p className="text-sm text-muted-foreground py-2">No arrival declarations yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gate Status Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Gate Load Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(gateLoad).map(([gateId, level]: [string, any]) => {
              const totalForGate = registrations.filter((r) => r.assignedGate === gateId).length;
              return (
                <div key={gateId} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{gateId}</span>
                    <span className="text-xs text-muted-foreground">{totalForGate} assigned</span>
                  </div>
                  <div className="flex gap-1">
                    {(["low", "medium", "high"] as const).map((l) => (
                      <Button
                        key={l}
                        size="sm"
                        variant={level === l ? "default" : "outline"}
                        className="text-xs h-7"
                        onClick={() => updateGateLoad(gateId, l)}
                      >
                        {getCongestionEmoji(l)} {getCongestionLabel(l)}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Arrivals by Gate & Window */}
      <Card>
        <CardHeader>
          <CardTitle>Gate × Window Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Window</th>
                  {Object.keys(gateLoad).map((g) => (
                    <th key={g} className="text-right py-2 px-2">{g}</th>
                  ))}
                  <th className="text-right py-2 pl-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {arrivalWindows.map((w) => {
                  const rowTotal = arrivalSlots[w] || 0;
                  return (
                    <tr key={w} className="border-b">
                      <td className="py-2 pr-4 font-medium">{w}</td>
                      {Object.keys(gateLoad).map((g) => (
                        <td key={g} className="text-right py-2 px-2">
                          {perWindowPerGate[w]?.[g] || 0}
                        </td>
                      ))}
                      <td className="text-right py-2 pl-2 font-medium">{rowTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {venue && venue.gates && (
        <Card>
          <CardHeader>
            <CardTitle>Venue Map</CardTitle>
          </CardHeader>
          <CardContent>
            <VenueMap
              center={[venue.lat || 12.9716, venue.lng || 77.5946]}
              gates={venue.gates}
              gateLoad={gateLoad}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
