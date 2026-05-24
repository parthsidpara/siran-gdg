"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { getVenuesByOwner } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSportEmoji } from "@/lib/sports";
import type { SportCategory } from "@/lib/types";

export default function MyVenuesPage() {
  return (
    <RoleGuard role="venue_owner">
      <VenuesContent />
    </RoleGuard>
  );
}

function VenuesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getVenuesByOwner(user.uid).then((v) => {
      setVenues(v);
      setLoading(false);
    });
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Venues</h1>
          <p className="text-muted-foreground">Manage your listed venues</p>
        </div>
        <Button onClick={() => router.push("/venue-owner/venues/create")}>Add Venue</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : venues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-muted-foreground mb-4">No venues listed yet</p>
            <Button onClick={() => router.push("/venue-owner/venues/create")}>
              Add Your First Venue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((v: any) => (
            <Link key={v.id} href={`/venue-owner/venues/${v.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {v.sportTypes?.map((s: SportCategory) => (
                      <span key={s}>{getSportEmoji(s)}</span>
                    ))}
                    {v.name}
                  </CardTitle>
                  <CardDescription>
                    {v.city} · {v.capacity?.toLocaleString()} capacity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{v.surface}</Badge>
                    <Badge variant={v.status === "available" ? "default" : "secondary"}>
                      {v.status}
                    </Badge>
                    <Badge variant="outline">{v.gates?.length || 0} gates</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
