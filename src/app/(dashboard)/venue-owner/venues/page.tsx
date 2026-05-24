"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { getVenuesByOwner } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { getSportLabel } from "@/lib/sports";
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
          <h1 className="text-2xl font-semibold tracking-tight">My Venues</h1>
          <p className="text-muted-foreground text-sm">Manage your listed venues</p>
        </div>
        <Button size="sm" className="h-9" onClick={() => router.push("/venue-owner/venues/create")}>
          Add Venue
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
        </div>
      ) : venues.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <MapPin className="h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground mb-4">No venues listed yet</p>
          <Button size="sm" className="h-9" onClick={() => router.push("/venue-owner/venues/create")}>
            Add Your First Venue
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((v: any) => (
            <Link key={v.id} href={`/venue-owner/venues/${v.id}`}>
              <div className="rounded-xl border border-border/50 p-5 hover:border-primary/30 transition-all cursor-pointer h-full">
                <h3 className="font-medium text-base mb-1">{v.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {v.city} · {v.capacity?.toLocaleString()} capacity
                </p>
                <div className="flex gap-2 flex-wrap">
                  {v.sportTypes?.map((s: SportCategory) => (
                    <Badge key={s} variant="outline" className="text-xs font-normal">
                      {getSportLabel(s)}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs font-normal">{v.surface}</Badge>
                  <Badge variant={v.status === "available" ? "default" : "secondary"} className="text-xs font-normal">
                    {v.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-normal">{v.gates?.length || 0} gates</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
