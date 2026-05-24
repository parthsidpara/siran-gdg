"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { getSponsorshipsBySponsor, getDocById } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSportEmoji, getSportLabel } from "@/lib/sports";

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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">My Inquiries</h1>
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
            <p className="text-muted-foreground">No inquiries sent yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3">Awaiting Response ({pending.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pending.map((s) => {
                  const evt = events[s.eventId];
                  return (
                    <Card key={s.id} className="border-yellow-200 dark:border-yellow-800 shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-yellow-600">Pending</Badge>
                          {evt && (
                            <Badge>{getSportEmoji(evt.sportCategory)} {getSportLabel(evt.sportCategory)}</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{evt?.title || "Unknown Event"}</CardTitle>
                        {evt && <CardDescription>{evt.venueName} · {evt.date}</CardDescription>}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{s.message}</p>
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
                          <Badge variant={s.status === "accepted" ? "default" : "destructive"}>
                            {s.status}
                          </Badge>
                          {evt && <Badge variant="outline">{getSportEmoji(evt.sportCategory)}</Badge>}
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
