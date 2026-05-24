"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/shared/role-guard";
import { listenToDoc, getRegistrationsByEvent, getDocById, updateDocById } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSportEmoji, getSportLabel } from "@/lib/sports";
import { VenueMap } from "@/components/venue/venue-map";
import {
  getCongestionLabel,
  getCongestionEmoji,
  getCongestionColor,
  generateArrivalWindows,
} from "@/lib/crowd";
import { broadcastInstruction, getInstructionsForEvent } from "@/lib/firebase/instructions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Clock,
  DoorOpen,
  Megaphone,
  Send,
  Loader2,
  MapPin,
} from "lucide-react";

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
  const [instructions, setInstructions] = useState<any[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState("info");
  const [broadcastType, setBroadcastType] = useState("general");
  const [broadcasting, setBroadcasting] = useState(false);

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

  const updateGateLoad = async (gateId: string, load: string) => {
    if (!event) return;
    const updated = { ...event.gateLoad, [gateId]: load };
    await updateDocById("events", id as string, { gateLoad: updated });
    toast.success(`Gate ${gateId} updated to ${load}`);
  };

  if (loading || !event) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hour = event.time ? parseInt(event.time.split(":")[0]) : 17;
  const arrivalWindows = generateArrivalWindows(Math.max(0, hour - 3), hour, 30);
  const arrivalSlots = event.arrivalSlots || {};
  const gateLoad = event.gateLoad || {};
  const fillRate = event.capacity ? Math.round(((event.registeredCount || 0) / event.capacity) * 100) : 0;

  const perWindowPerGate: Record<string, Record<string, number>> = {};
  arrivalWindows.forEach((w) => { perWindowPerGate[w] = {}; });
  registrations.forEach((r) => {
    if (!perWindowPerGate[r.arrivalWindow]) perWindowPerGate[r.arrivalWindow] = {};
    perWindowPerGate[r.arrivalWindow][r.assignedGate] = (perWindowPerGate[r.arrivalWindow][r.assignedGate] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>{getSportEmoji(event.sportCategory)} {getSportLabel(event.sportCategory)}</span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.venueName}</span>
            <span className="text-border">·</span>
            <span>{event.date} at {event.time}</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{event.title}</h1>
        </div>
        <StatusBadge status={event.status} />
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-0 bg-muted/40">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{event.registeredCount || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Registrations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/40">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{Object.keys(arrivalSlots).length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Arrival Slots</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/40">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DoorOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{Object.keys(gateLoad).length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gates</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fill Rate Bar */}
      <div className="rounded-xl bg-muted/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Capacity Fill Rate</span>
          <span className="text-xs font-semibold">{fillRate}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${fillRate}%` }} />
        </div>
      </div>

      {/* Arrival Projections */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Arrival Projections</h2>
        <div className="space-y-3">
          {arrivalWindows.map((window) => {
            const count = arrivalSlots[window] || 0;
            const max = Math.max(...Object.values(arrivalSlots).map(Number), 1);
            const pct = Math.round((count / max) * 100);
            return (
              <div key={window} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium tabular-nums">{window}</span>
                  <span className="text-muted-foreground tabular-nums">{count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {Object.values(arrivalSlots).every((v) => v === 0) && (
            <p className="text-sm text-muted-foreground py-2">No arrival declarations yet</p>
          )}
        </div>
      </section>

      {/* Gate Load Controls */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Gate Load Controls</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(gateLoad).map(([gateId, level]: [string, any]) => {
            const totalForGate = registrations.filter((r) => r.assignedGate === gateId).length;
            return (
              <div key={gateId} className="rounded-xl border border-border/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{gateId}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{totalForGate} assigned</span>
                </div>
                <div className="flex gap-1">
                  {(["low", "medium", "high"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => updateGateLoad(gateId, l)}
                      className={`flex-1 rounded-lg py-1.5 text-[10px] font-medium transition-all ${
                        level === l
                          ? l === "low"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800"
                            : l === "medium"
                            ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800"
                            : "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {getCongestionEmoji(l)} {getCongestionLabel(l)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gate x Window Distribution */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Gate × Window Distribution</h2>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Window</th>
                {Object.keys(gateLoad).map((g) => (
                  <th key={g} className="px-3 py-2 text-right font-medium text-muted-foreground">{g}</th>
                ))}
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {arrivalWindows.map((w) => {
                const rowTotal = arrivalSlots[w] || 0;
                return (
                  <tr key={w} className="border-b border-border/30 last:border-0">
                    <td className="px-3 py-2 font-medium tabular-nums">{w}</td>
                    {Object.keys(gateLoad).map((g) => (
                      <td key={g} className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {perWindowPerGate[w]?.[g] || 0}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{rowTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {venue && venue.gates && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Venue Map</h2>
          <VenueMap
            center={[venue.lat || 12.9716, venue.lng || 77.5946]}
            gates={venue.gates}
            gateLoad={gateLoad}
          />
        </section>
      )}

      {/* Broadcast */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Broadcast Instructions</h2>
        <div className="rounded-xl border border-border/50 p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Title</Label>
              <Input
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g., Parking Update"
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Priority</Label>
                <Select value={broadcastPriority} onValueChange={(v) => setBroadcastPriority(v || "info")}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Type</Label>
                <Select value={broadcastType} onValueChange={(v) => setBroadcastType(v || "general")}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="gate_change">Gate Change</SelectItem>
                    <SelectItem value="crowd_alert">Crowd Alert</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Message</Label>
            <Textarea
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Enter instruction message for participants..."
              rows={3}
            />
          </div>
          <Button
            size="sm"
            onClick={async () => {
              if (!broadcastTitle.trim() || !broadcastMsg.trim()) { toast.error("Title and message required"); return; }
              setBroadcasting(true);
              try {
                await broadcastInstruction({
                  eventId: id as string,
                  organizerId: event.organizerId,
                  title: broadcastTitle,
                  message: broadcastMsg,
                  priority: broadcastPriority,
                  type: broadcastType,
                });
                toast.success("Instruction broadcast!");
                setBroadcastTitle(""); setBroadcastMsg("");
                setInstructions(await getInstructionsForEvent(id as string));
              } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
              finally { setBroadcasting(false); }
            }}
            disabled={broadcasting}
            className="gap-1.5"
          >
            {broadcasting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {broadcasting ? "Broadcasting..." : "Broadcast"}
          </Button>
        </div>
      </section>

      {/* Past Instructions */}
      {instructions.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Sent Instructions</h2>
          <div className="space-y-2">
            {[...instructions].reverse().map((inst) => (
              <div key={inst.id} className="flex items-start gap-3 rounded-xl border border-border/50 p-3">
                <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                  inst.priority === "urgent" ? "bg-red-500" : inst.priority === "warning" ? "bg-amber-500" : "bg-muted-foreground/40"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{inst.title}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{inst.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{inst.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        Live
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/60 px-2.5 py-1 text-xs font-medium text-accent-foreground">
        Upcoming
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      Completed
    </span>
  );
}
