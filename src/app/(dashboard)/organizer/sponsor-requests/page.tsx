"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { queryDocs } from "@/lib/firebase/firestore";
import { updateSponsorshipStatus } from "@/lib/firebase/messaging";
import { getEventsByOrganizer } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getSportEmoji, getSportLabel } from "@/lib/sports";
import { where, orderBy } from "firebase/firestore";

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
        <h1 className="text-3xl font-semibold tracking-tight">Sponsor Requests</h1>
        <p className="text-muted-foreground">
          {pending.length} pending · {resolved.length} resolved
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
        </div>
      ) : sponsorships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-muted-foreground">No sponsor requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">Pending ({pending.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pending.map((s) => {
                  const evt = events[s.eventId];
                  return (
                    <Card key={s.id} className="border-yellow-200 dark:border-yellow-800 shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-yellow-600">
                            Pending
                          </Badge>
                          {evt && (
                            <Badge>{getSportEmoji(evt.sportCategory)} {getSportLabel(evt.sportCategory)}</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">
                          {evt ? evt.title : "Unknown Event"}
                        </CardTitle>
                        <CardDescription>
                          {evt ? `${evt.venueName} · ${evt.date}` : ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm bg-muted p-2 rounded">{s.message}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => handleAction(s.id, "accepted")}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="cursor-pointer"
                              onClick={() => handleAction(s.id, "declined")}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">Resolved ({resolved.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {resolved.map((s) => {
                  const evt = events[s.eventId];
                  return (
                    <Card key={s.id} className="shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={s.status === "accepted" ? "default" : "destructive"}
                          >
                            {s.status}
                          </Badge>
                          {evt && (
                            <Badge variant="outline">{getSportEmoji(evt.sportCategory)}</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{evt?.title || "Unknown Event"}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{s.message}</p>
                      </CardContent>
                    </Card>
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
