"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { listenToDoc, registerForEvent, getRegistrationsByEvent, getDocById } from "@/lib/firebase/firestore";
import { getInstructionsForEvent } from "@/lib/firebase/instructions";
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
import { Megaphone, Clock, MapPin, AlertTriangle } from "lucide-react";
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
  const [instructions, setInstructions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [arrivalWindow, setArrivalWindow] = useState("");
  const [registering, setRegistering] = useState(false);

  const existingReg = registrations.find((r) => r.userId === user?.uid);
  const isLive = event?.status === "live";

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
    getInstructionsForEvent(id as string).then(setInstructions);
  }, [id]);

  if (loading || !event) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  const hour = event.time ? parseInt(event.time.split(":")[0]) : 17;
  const arrivalWindows = generateArrivalWindows(Math.max(0, hour - 3), hour, 30);

  const handleRegister = async () => {
    if (!user || !arrivalWindow) { toast.error("Please select an arrival window"); return; }
    setRegistering(true);
    try {
      const gates: Gate[] = venue?.gates || [];
      let assignedGate = gates.length > 0 ? gates[0].id : "gate-main";
      if (gates.length > 1) {
        assignedGate = assignGate({
          arrivalWindow, gates,
          existingRegistrations: registrations.map((r) => ({ arrivalWindow: r.arrivalWindow, assignedGate: r.assignedGate })),
          gateCapacity: Math.ceil((event.capacity || 1000) / gates.length),
        });
      }
      await registerForEvent({ userId: user.uid, eventId: id as string, arrivalWindow, assignedGate });
      setRegistrations(await getRegistrationsByEvent(id as string));
      toast.success(`Registered! Assigned gate: ${gates.find((g) => g.id === assignedGate)?.label || assignedGate}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally { setRegistering(false); }
  };

  const gateLoad = event.gateLoad || {};
  const venueGates: Gate[] = venue?.gates || [];
  const arrivalSlots = event.arrivalSlots || {};
  const urgencyInstructions = instructions.filter((i) => i.priority === "urgent");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* LIVE EVENT BANNER */}
      {isLive && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-red-700 dark:text-red-400">EVENT IS LIVE</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            Follow your assigned gate and watch for real-time updates below.
          </p>
        </div>
      )}

      {/* URGENT INSTRUCTIONS */}
      {urgencyInstructions.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-bold text-yellow-700 dark:text-yellow-400">Urgent Updates</span>
          </div>
          {urgencyInstructions.map((inst) => (
            <div key={inst.id} className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
              <strong>{inst.title}:</strong> {inst.message}
            </div>
          ))}
        </div>
      )}

      {/* Event Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>
            {getSportEmoji(event.sportCategory)} {getSportLabel(event.sportCategory)}
          </Badge>
          <Badge variant={isLive ? "destructive" : event.status === "upcoming" ? "default" : "secondary"}>
            {event.status}
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
        <p className="text-muted-foreground">
          {event.venueName} · {event.venueCity} · {event.date} at {event.time}
        </p>
      </div>

      {/* REGISTRATION or GATE PASS */}
      {existingReg ? (
        <Card className={isLive ? "border-green-300 bg-green-50/50 dark:bg-green-950/10 shadow-sm" : "border-green-200 bg-green-50 dark:bg-green-950/20 shadow-sm"}>
          <CardHeader>
            <CardTitle>{isLive ? "Your Gate Pass" : "You're Registered!"}</CardTitle>
            <CardDescription>
              {isLive ? "Head to your assigned gate now" : "Keep this info handy for event day"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Arrival Window
                </p>
                <p className="text-xl font-bold">{existingReg.arrivalWindow}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Assigned Gate
                </p>
                <p className="text-xl font-bold text-primary">
                  {venueGates.find((g) => g.id === existingReg.assignedGate)?.label || existingReg.assignedGate}
                </p>
              </div>
            </div>
            {isLive && (
              <div className="mt-4 p-3 bg-background rounded-lg border">
                <p className="text-sm font-medium">Gate Status</p>
                <Badge
                  className={gateLoad[existingReg.assignedGate] === "low" ? "bg-green-500 mt-1" : gateLoad[existingReg.assignedGate] === "medium" ? "bg-yellow-500 mt-1" : "bg-red-500 mt-1"}
                >
                  {getCongestionEmoji(gateLoad[existingReg.assignedGate] || "low")}{" "}
                  {getCongestionLabel(gateLoad[existingReg.assignedGate] || "low")} Crowd
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Register for Event</CardTitle>
            <CardDescription>Select your expected arrival time to get the best gate recommendation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Arrival Time Window</Label>
              <div className="flex flex-wrap gap-2">
                {arrivalWindows.map((w) => (
                  <Button key={w} variant={arrivalWindow === w ? "default" : "outline"} size="sm" onClick={() => setArrivalWindow(w)}>
                    {w}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleRegister} disabled={!arrivalWindow || registering}>
              {registering ? "Registering..." : "Register Now"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Early declaration helps us assign the least crowded gate for your arrival.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Expected Crowd Timeline (visible to registered participants) */}
      {existingReg && Object.keys(arrivalSlots).length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Expected Crowd Timeline</CardTitle>
            <CardDescription>Projected attendance per arrival window</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(arrivalSlots).map(([window, count]: [string, any]) => (
                <div key={window} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={window === existingReg.arrivalWindow ? "font-bold text-primary" : ""}>
                      {window}
                      {window === existingReg.arrivalWindow && " (You)"}
                    </span>
                    <span className="text-muted-foreground">{count} arriving</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (count / Math.max(...Object.values(arrivalSlots).map(Number), 1)) * 100)}%`,
                        backgroundColor: window === existingReg.arrivalWindow ? "var(--primary)" : "var(--muted-foreground)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizer Broadcast Instructions */}
      {instructions.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" /> Organizer Updates
            </CardTitle>
            <CardDescription>Important information from the event organizer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...instructions].reverse().map((inst) => (
                <div key={inst.id} className="border-l-2 pl-3 py-1" style={{
                  borderLeftColor: inst.priority === "urgent" ? "#ef4444" : inst.priority === "warning" ? "#eab308" : "#6b7280"
                }}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{inst.title}</span>
                    <Badge variant={inst.priority === "urgent" ? "destructive" : inst.priority === "warning" ? "default" : "outline"}
                      className="text-xs">{inst.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{inst.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {event.description && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>About this event</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{event.description}</p></CardContent>
        </Card>
      )}

      {/* Gate Congestion Status */}
      {venueGates.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Gate Congestion Status</CardTitle>
            <CardDescription>{isLive ? "Live" : "Current"} gate load levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {venueGates.map((gate) => {
                const load = gateLoad[gate.id] || "low";
                const isAssigned = existingReg?.assignedGate === gate.id;
                return (
                  <div key={gate.id}
                    className={`flex items-center justify-between p-4 border rounded-xl bg-muted/20 ${isAssigned ? "border-primary ring-2 ring-primary/20" : ""}`}
                  >
                    <div>
                      <p className="font-medium">{gate.label} {isAssigned && <Badge className="ml-2 text-xs">Your Gate</Badge>}</p>
                      <p className="text-xs text-muted-foreground">Zone: {gate.zone}</p>
                    </div>
                    <Badge className={load === "low" ? "bg-green-500" : load === "medium" ? "bg-yellow-500" : "bg-red-500"}>
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
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Venue Map & Gates</CardTitle></CardHeader>
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
