"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { listenToDoc, registerForEvent, getRegistrationsByEvent, getDocById } from "@/lib/firebase/firestore";
import { getInstructionsForEvent } from "@/lib/firebase/instructions";
import { Button } from "@/components/ui/button";
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
import {
  Clock,
  MapPin,
  AlertTriangle,
  Megaphone,
  Ticket,
  Loader2,
  Users,
  Radar,
} from "lucide-react";
import type { Gate } from "@/lib/types";

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
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Live Banner */}
      {isLive && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200/60 bg-red-50/60 p-3.5 dark:border-red-900/30 dark:bg-red-950/20">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Event is live now</p>
            <p className="text-xs text-red-600/80 dark:text-red-400/70">Follow your assigned gate below.</p>
          </div>
        </div>
      )}

      {/* Urgent Instructions */}
      {urgencyInstructions.length > 0 && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">Urgent Updates</span>
          </div>
          {urgencyInstructions.map((inst) => (
            <p key={inst.id} className="text-sm text-amber-800/80 dark:text-amber-400/80">
              <span className="font-medium">{inst.title}:</span> {inst.message}
            </p>
          ))}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-accent/50 px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {getSportEmoji(event.sportCategory)} {getSportLabel(event.sportCategory)}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{event.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {event.venueName} · {event.venueCity} · {event.date} at {event.time}
        </p>
      </div>

      {/* Gate Pass / Registration */}
      {existingReg ? (
        <div className={`rounded-2xl border p-5 ${isLive ? "border-primary/30 bg-primary/[0.03]" : "border-border/50 bg-muted/30"}`}>
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{isLive ? "Your Gate Pass" : "You're Registered"}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3" /> Arrival Window
              </div>
              <p className="text-lg font-semibold tabular-nums">{existingReg.arrivalWindow}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-3 w-3" /> Assigned Gate
              </div>
              <p className="text-lg font-semibold text-primary">
                {venueGates.find((g) => g.id === existingReg.assignedGate)?.label || existingReg.assignedGate}
              </p>
            </div>
          </div>
          {isLive && (
            <div className="mt-4 rounded-xl border border-border/50 bg-background/80 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Current Gate Status</p>
              <CongestionDot level={gateLoad[existingReg.assignedGate] || "low"} />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-5">
          <h3 className="text-sm font-semibold mb-1">Register for this event</h3>
          <p className="text-xs text-muted-foreground mb-4">Pick an arrival window. We will assign the least crowded gate.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {arrivalWindows.map((w) => (
              <button
                key={w}
                onClick={() => setArrivalWindow(w)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  arrivalWindow === w
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border/50 text-foreground hover:border-border"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
          <Button size="sm" className="w-full h-9" onClick={handleRegister} disabled={!arrivalWindow || registering}>
            {registering ? "Registering..." : "Register Now"}
          </Button>
        </div>
      )}

      {/* Crowd Timeline */}
      {existingReg && Object.keys(arrivalSlots).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Expected Crowd</h3>
          <div className="space-y-2.5">
            {Object.entries(arrivalSlots).map(([window, count]: [string, any]) => (
              <div key={window} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={window === existingReg.arrivalWindow ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {window} {window === existingReg.arrivalWindow && "· You"}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
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
        </div>
      )}

      {/* Instructions */}
      {instructions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <Megaphone className="h-3.5 w-3.5" /> Organizer Updates
          </h3>
          <div className="space-y-2">
            {[...instructions].reverse().map((inst) => (
              <div key={inst.id} className="flex items-start gap-3 rounded-xl border border-border/50 p-3">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  inst.priority === "urgent" ? "bg-red-500" : inst.priority === "warning" ? "bg-amber-500" : "bg-muted-foreground/30"
                }`} />
                <div>
                  <p className="text-sm font-medium">{inst.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{inst.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {event.description && (
        <div className="rounded-xl border border-border/50 p-4">
          <p className="text-sm font-medium mb-1">About</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
        </div>
      )}

      {/* Gate Status */}
      {venueGates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Gate Congestion</h3>
          <div className="space-y-2">
            {venueGates.map((gate) => {
              const load = gateLoad[gate.id] || "low";
              const isAssigned = existingReg?.assignedGate === gate.id;
              return (
                <div
                  key={gate.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    isAssigned ? "border-primary/40 bg-primary/[0.02]" : "border-border/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isAssigned && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        You
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-medium">{gate.label}</p>
                      <p className="text-[10px] text-muted-foreground">{gate.zone}</p>
                    </div>
                  </div>
                  <CongestionDot level={load} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Venue Map */}
      {venue && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Venue Map</h3>
          <VenueMap
            center={[venue.lat || 12.9716, venue.lng || 77.5946]}
            gates={venueGates}
            gateLoad={gateLoad}
            assignedGate={existingReg?.assignedGate}
          />
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{venue.surface}</span>
            <span className="text-border">·</span>
            <span>{venue.capacity?.toLocaleString()} capacity</span>
          </div>
          <GatePinner gates={venueGates} />
        </div>
      )}
    </div>
  );
}

function CongestionDot({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: "bg-emerald-500",
    medium: "bg-amber-500",
    high: "bg-red-500",
  };
  const labels: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${colors[level] || colors.low}`} />
      <span className="text-xs font-medium">{labels[level] || level} congestion</span>
    </div>
  );
}
