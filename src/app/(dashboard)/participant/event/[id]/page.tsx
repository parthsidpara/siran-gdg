"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { listenToDoc, registerForEvent, getRegistrationsByEvent, getDocById } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getSportEmoji, getSportLabel } from "@/lib/sports";
import { VenueMap } from "@/components/venue/venue-map";
import { GatePinner } from "@/components/venue/gate-pinner";
import {
  assignGate,
  getCongestionLabel,
  getCongestionEmoji,
  getCongestionColor,
  generateArrivalWindows,
} from "@/lib/crowd";
import { toast } from "sonner";
import type { SportCategory, Gate } from "@/lib/types";

export default function ParticipantEventDetail() {
  return (
    <RoleGuard role="participant">
      <EventDetailContent />
    </RoleGuard>
  );
}

function EventDetailContent() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [arrivalWindow, setArrivalWindow] = useState("");
  const [registering, setRegistering] = useState(false);

  const existingReg = registrations.find((r) => r.userId === user?.uid);

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

  const handleRegister = async () => {
    if (!user || !arrivalWindow) {
      toast.error("Please select an arrival window");
      return;
    }

    setRegistering(true);
    try {
      const gates: Gate[] = venue?.gates || [];
      let assignedGate = gates.length > 0 ? gates[0].id : "gate-main";

      if (gates.length > 1) {
        assignedGate = assignGate({
          arrivalWindow,
          gates,
          existingRegistrations: registrations.map((r) => ({
            arrivalWindow: r.arrivalWindow,
            assignedGate: r.assignedGate,
          })),
          gateCapacity: Math.ceil((event.capacity || 1000) / gates.length),
        });
      }

      await registerForEvent({
        userId: user.uid,
        eventId: id as string,
        arrivalWindow,
        assignedGate,
      });

      const regs = await getRegistrationsByEvent(id as string);
      setRegistrations(regs);

      const gateName = gates.find((g) => g.id === assignedGate)?.label || assignedGate;
      toast.success(`Registered! Assigned gate: ${gateName}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const gateLoad = event.gateLoad || {};
  const venueGates: Gate[] = venue?.gates || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Badge className="mb-2">
          {getSportEmoji(event.sportCategory)} {getSportLabel(event.sportCategory)}
        </Badge>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-muted-foreground">
          {event.venueName} · {event.venueCity} · {event.date} at {event.time}
        </p>
      </div>

      {existingReg ? (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-6 text-center">
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">
              You're registered!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Arrival window: <strong>{existingReg.arrivalWindow}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Assigned gate:{" "}
              <strong>
                {venueGates.find((g) => g.id === existingReg.assignedGate)?.label ||
                  existingReg.assignedGate}
              </strong>
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Register for Event</CardTitle>
            <CardDescription>
              Select your expected arrival time to get the best gate recommendation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Arrival Time Window</Label>
              <div className="flex flex-wrap gap-2">
                {arrivalWindows.map((w) => (
                  <Button
                    key={w}
                    variant={arrivalWindow === w ? "default" : "outline"}
                    size="sm"
                    onClick={() => setArrivalWindow(w)}
                  >
                    {w}
                  </Button>
                ))}
              </div>
              {arrivalWindows.length === 0 && (
                <p className="text-sm text-muted-foreground">No arrival windows available</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleRegister}
              disabled={!arrivalWindow || registering}
            >
              {registering ? "Registering..." : "Register Now"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Early declaration helps us assign the least crowded gate for your arrival.
            </p>
          </CardContent>
        </Card>
      )}

      {event.description && (
        <Card>
          <CardHeader>
            <CardTitle>About this event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{event.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Gate Status Display */}
      {venueGates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gate Congestion Status</CardTitle>
            <CardDescription>Live gate load levels for this venue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {venueGates.map((gate) => {
                const load = gateLoad[gate.id] || "low";
                return (
                  <div
                    key={gate.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{gate.label}</p>
                      <p className="text-xs text-muted-foreground">Zone: {gate.zone}</p>
                    </div>
                    <Badge
                      className={
                        load === "low"
                          ? "bg-green-500"
                          : load === "medium"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }
                    >
                      {getCongestionEmoji(load)} {getCongestionLabel(load)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {venue && (
        <Card>
          <CardHeader>
            <CardTitle>Venue Map & Gates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <VenueMap
              center={[venue.lat || 12.9716, venue.lng || 77.5946]}
              gates={venueGates}
              gateLoad={gateLoad}
              assignedGate={existingReg?.assignedGate}
            />
            <p className="text-sm text-muted-foreground">{venue.description}</p>
            <div className="flex gap-2">
              <Badge variant="outline">{venue.surface}</Badge>
              <Badge variant="outline">{venue.capacity?.toLocaleString()} capacity</Badge>
            </div>
            <GatePinner gates={venueGates} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
