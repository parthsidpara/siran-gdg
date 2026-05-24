"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { queryDocs } from "@/lib/firebase/firestore";
import { updateSponsorshipStatus } from "@/lib/firebase/messaging";
import { getEventsByOrganizer } from "@/lib/firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getSportLabel } from "@/lib/sports";
import { where, orderBy } from "firebase/firestore";
import { Loader2, Inbox } from "lucide-react";

export default function SponsorRequestsPage() {
  return (
    <RoleGuard role="organizer">
      <RequestsContent />
    </RoleGuard>
  );
}

function RequestsContent() {
  const { user } = useAuth();
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const myEvents = await getEventsByOrganizer(user.uid);
      const eventMap: Record<string, any> = {};
      myEvents.forEach((e: any) => { eventMap[e.id] = e; });
      setEvents(eventMap);

      const eventIds = myEvents.map((e: any) => e.id);
      if (eventIds.length === 0) {
        setLoading(false);
        return;
      }
      const allSponsorships = await queryDocs("sponsorships", []);
      const relevant = allSponsorships.filter((s: any) => eventIds.includes(s.eventId));
      setSponsorships(relevant);
      setLoading(false);
    })();
  }, [user]);

  const handleAction = async (sponsorshipId: string, status: string) => {
    try {
      await updateSponsorshipStatus(sponsorshipId, status);
      setSponsorships((prev) =>
        prev.map((s) => (s.id === sponsorshipId ? { ...s, status } : s))
      );
      toast.success(status === "accepted" ? "Request accepted!" : "Request declined");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const pending = sponsorships.filter((s) => s.status === "pending");
  const resolved = sponsorships.filter((s) => s.status !== "pending");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sponsor Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pending.length} pending · {resolved.length} resolved
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : sponsorships.length === 0 ? (
        <div className="rounded-xl border border-border/50 p-4 flex flex-col items-center py-12">
          <Inbox className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No sponsor requests yet</p>
          <Button size="sm" className="h-9 text-sm" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Pending ({pending.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pending.map((s) => {
                  const evt = events[s.eventId];
                  return (
                    <div key={s.id} className="rounded-xl border border-border/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-yellow-600">
                          Pending
                        </Badge>
                        {evt && (
                          <Badge>{getSportLabel(evt.sportCategory)}</Badge>
                        )}
                      </div>
                      <h3 className="text-base font-medium mb-1">
                        {evt ? evt.title : "Unknown Event"}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {evt ? `${evt.venueName} · ${evt.date}` : ""}
                      </p>
                      <div className="space-y-3">
                        <p className="text-sm bg-muted/40 p-2 rounded-md">{s.message}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-9 text-sm"
                            onClick={() => handleAction(s.id, "accepted")}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-9 text-sm"
                            onClick={() => handleAction(s.id, "declined")}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Resolved ({resolved.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {resolved.map((s) => {
                  const evt = events[s.eventId];
                  return (
                    <div key={s.id} className="rounded-xl border border-border/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge
                          variant={s.status === "accepted" ? "default" : "destructive"}
                        >
                          {s.status}
                        </Badge>
                        {evt && (
                          <Badge variant="outline">{getSportLabel(evt.sportCategory)}</Badge>
                        )}
                      </div>
                      <h3 className="text-base font-medium mb-1">{evt?.title || "Unknown Event"}</h3>
                      <p className="text-sm text-muted-foreground">{s.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
