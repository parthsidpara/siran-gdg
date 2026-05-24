"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/shared/role-guard";
import { getEvents } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSportEmoji, getSportLabel } from "@/lib/sports";
import { SPORTS, type SportCategory } from "@/lib/types";
import { Search } from "lucide-react";

export default function BrowseEventsPage() {
  return (
    <RoleGuard role="participant">
      <BrowseContent />
    </RoleGuard>
  );
}

function BrowseContent() {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState<SportCategory | "all">("all");

  useEffect(() => {
    getEvents().then((evts) => {
      setEvents(evts);
      setFilteredEvents(evts);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let filtered = events;
    if (sportFilter !== "all") {
      filtered = filtered.filter((e) => e.sportCategory === sportFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.venueName?.toLowerCase().includes(q) ||
          e.venueCity?.toLowerCase().includes(q)
      );
    }
    setFilteredEvents(filtered);
  }, [search, sportFilter, events]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Discover Events</h1>
        <p className="text-muted-foreground">Find sporting events near you</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events, venues, cities..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={sportFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSportFilter("all")}
          >
            All
          </Button>
          {SPORTS.map((sport) => (
            <Button
              key={sport}
              variant={sportFilter === sport ? "default" : "outline"}
              size="sm"
              onClick={() => setSportFilter(sport)}
            >
              {getSportEmoji(sport)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-muted-foreground">No events found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event: any) => (
            <Link key={event.id} href={`/participant/event/${event.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-1">
                    <Badge>
                      {getSportEmoji(event.sportCategory)} {getSportLabel(event.sportCategory)}
                    </Badge>
                    <Badge variant="outline">
                      {event.venueCity}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>
                    {event.venueName} · {event.date} at {event.time}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      {event.registeredCount || 0} / {event.capacity?.toLocaleString()} registered
                    </p>
                    {event.description && (
                      <p className="mt-2 line-clamp-2">{event.description}</p>
                    )}
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
