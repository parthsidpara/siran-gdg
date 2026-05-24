"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { getSponsorshipsBySponsor, getDocById } from "@/lib/firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { getSportLabel } from "@/lib/sports";
import { Loader2, Inbox } from "lucide-react";

export default function MyInquiriesPage() {
  return (
    <RoleGuard role="sponsor">
      <InquiriesContent />
    </RoleGuard>
  );
}

function InquiriesContent() {
  const { user } = useAuth();
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const sp = await getSponsorshipsBySponsor(user.uid);
      setSponsorships(sp);
      const eventMap: Record<string, any> = {};
      await Promise.all(
        sp.map(async (s: any) => {
          if (!eventMap[s.eventId]) {
            const evt = await getDocById("events", s.eventId);
            if (evt) eventMap[s.eventId] = evt;
          }
        })
      );
      setEvents(eventMap);
      setLoading(false);
    })();
  }, [user]);

  const pending = sponsorships.filter((s) => s.status === "pending");
  const resolved = sponsorships.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-1">My Inquiries</h1>
        <p className="text-muted-foreground">
          {pending.length} pending &middot; {resolved.length} resolved
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : sponsorships.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No inquiries sent yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Awaiting Response ({pending.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pending.map((s) => {
                  const evt = events[s.eventId];
                  return (
                    <div key={s.id} className="rounded-xl border border-border/50 p-4 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-yellow-600">Pending</Badge>
                        {evt && (
                          <Badge variant="secondary">{getSportLabel(evt.sportCategory)}</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold leading-tight mb-1">{evt?.title || "Unknown Event"}</h3>
                      {evt && <p className="text-sm text-muted-foreground mb-3">{evt.venueName} &middot; {evt.date}</p>}
                      <p className="text-sm text-muted-foreground line-clamp-2">{s.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Resolved ({resolved.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {resolved.map((s) => {
                  const evt = events[s.eventId];
                  return (
                    <div key={s.id} className="rounded-xl border border-border/50 p-4 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={s.status === "accepted" ? "default" : "destructive"}>
                          {s.status}
                        </Badge>
                        {evt && <Badge variant="secondary">{getSportLabel(evt.sportCategory)}</Badge>}
                      </div>
                      <h3 className="text-lg font-semibold leading-tight mb-1">{evt?.title || "Unknown Event"}</h3>
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
