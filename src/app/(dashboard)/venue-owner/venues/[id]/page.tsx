"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/shared/role-guard";
import { getDocById, updateDocById } from "@/lib/firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSportLabel } from "@/lib/sports";
import { enrichVenue } from "@/lib/api/venues";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
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
  const [enriching, setEnriching] = useState(false);

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

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const enriched = await enrichVenue(venue.name, venue.sportTypes?.[0]);
      if (enriched && enriched.name) {
        const updates: Record<string, unknown> = {};
        if (enriched.description && !venue.description) updates.description = enriched.description;
        if (enriched.capacity && !venue.capacity) updates.capacity = enriched.capacity;
        if (enriched.surface && !venue.surface) updates.surface = enriched.surface;
        if (enriched.lat && !venue.lat) updates.lat = enriched.lat;
        if (enriched.lng && !venue.lng) updates.lng = enriched.lng;

        if (Object.keys(updates).length > 0) {
          await updateDocById("venues", id as string, updates);
          setVenue({ ...venue, ...updates });
          toast.success(`Enriched with ${enriched.source} data!`);
        } else {
          toast.info("Venue already has complete data");
        }
      } else {
        toast.error("No enrichment data found for this venue");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Enrichment failed");
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{venue.name}</h1>
          <p className="text-muted-foreground text-sm">{venue.city} · {venue.address}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={handleEnrich}
          disabled={enriching}
        >
          {enriching ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-1.5" />
          )}
          Enrich Data
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border/50 p-5">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Capacity</span>
              <span className="font-medium text-sm">{venue.capacity?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Surface</span>
              <span className="font-medium text-sm">{venue.surface}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Status</span>
              <Badge variant={venue.status === "available" ? "default" : "secondary"} className="text-xs font-normal">
                {venue.status}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Sports</span>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {venue.sportTypes?.map((s: SportCategory) => (
                  <Badge key={s} variant="outline" className="text-xs font-normal">
                    {getSportLabel(s)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 p-5">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Gates ({venue.gates?.length || 0})</h2>
          <div className="space-y-2">
            {venue.gates?.map((g: Gate, i: number) => (
              <div key={g.id} className="flex items-center gap-3 py-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium shrink-0">
                  {i + 1}
                </div>
                <span className="font-medium text-sm">{g.label}</span>
                <Badge variant="secondary" className="text-xs font-normal ml-auto">{g.zone}</Badge>
              </div>
            ))}
            {(!venue.gates || venue.gates.length === 0) && (
              <p className="text-sm text-muted-foreground">No gates configured</p>
            )}
          </div>
        </div>
      </div>

      {venue.description && (
        <div className="rounded-xl border border-border/50 p-5">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">About</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{venue.description}</p>
        </div>
      )}
    </div>
  );
}
