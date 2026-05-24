"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/shared/role-guard";
import { getDocById } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSportLabel, getSportEmoji } from "@/lib/sports";
import type { SportCategory, Gate } from "@/lib/types";

export default function VenueDetailPage() {
  return (
    <RoleGuard role="venue_owner">
      <VenueDetailContent />
    </RoleGuard>
  );
}

function VenueDetailContent() {
  const { id } = useParams();
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocById("venues", id as string).then((v) => {
      setVenue(v);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!venue) return <p>Venue not found</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-1">{venue.name}</h1>
        <p className="text-muted-foreground">{venue.city} · {venue.address}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-medium">{venue.capacity?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Surface</span>
              <span className="font-medium">{venue.surface}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={venue.status === "available" ? "default" : "secondary"}>
                {venue.status}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Sports</span>
              <div className="flex gap-1 mt-1 flex-wrap">
                {venue.sportTypes?.map((s: SportCategory) => (
                  <Badge key={s} variant="outline">
                    {getSportEmoji(s)} {getSportLabel(s)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Gates ({venue.gates?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {venue.gates?.map((g: Gate) => (
                <div key={g.id} className="flex items-center gap-2 p-3 rounded-xl border bg-muted/20">
                  <span className="font-medium text-sm">{g.label}</span>
                  <Badge variant="secondary" className="text-xs">{g.zone}</Badge>
                </div>
              ))}
              {(!venue.gates || venue.gates.length === 0) && (
                <p className="text-sm text-muted-foreground">No gates configured</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {venue.description && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{venue.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
