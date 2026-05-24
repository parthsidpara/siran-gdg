"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/shared/role-guard";
import { getEvents } from "@/lib/firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSportLabel } from "@/lib/sports";
import { SPORTS, type SportCategory } from "@/lib/types";
import { Search, Loader2, CalendarDays } from "lucide-react";

const SPORT_DOT_COLORS: Record<SportCategory, string> = {
  cricket: "bg-red-500",
  badminton: "bg-green-500",
  football: "bg-emerald-600",
  f1: "bg-rose-600",
  hockey: "bg-amber-600",
  basketball: "bg-orange-500",
  tennis: "bg-yellow-500",
  aquatics: "bg-cyan-500",
  combat: "bg-slate-500",
  multi_sport: "bg-violet-500",
};

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
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Discover Events</h1>
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
            className="h-9"
            onClick={() => setSportFilter("all")}
          >
            All
          </Button>
          {SPORTS.map((sport) => (
            <Button
              key={sport}
              variant={sportFilter === sport ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setSportFilter(sport)}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full mr-2 ${SPORT_DOT_COLORS[sport]}`}
              />
              {getSportLabel(sport)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-xl border border-border/50 p-12 flex flex-col items-center text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No events found</p>
          <Button
            size="sm"
            className="h-9"
            variant="outline"
            onClick={() => {
              setSearch("");
              setSportFilter("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event: any) => (
            <Link key={event.id} href={`/participant/event/${event.id}`}>
              <div className="rounded-xl border border-border/50 p-4 hover:border-primary/30 transition-all cursor-pointer h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${SPORT_DOT_COLORS[event.sportCategory as SportCategory] ?? "bg-muted-foreground"}`}
                    />
                    <span className="text-sm font-medium">
                      {getSportLabel(event.sportCategory)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{event.venueCity}</span>
                </div>
                <h3 className="text-base font-semibold mb-1">{event.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {event.venueName} · {event.date} at {event.time}
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>
                    {event.registeredCount || 0} / {event.capacity?.toLocaleString()} registered
                  </p>
                  {event.description && (
                    <p className="mt-2 line-clamp-2">{event.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
