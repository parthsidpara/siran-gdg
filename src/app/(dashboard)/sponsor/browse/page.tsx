"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { getEvents, sendSponsorshipInquiry } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getSportEmoji, getSportLabel } from "@/lib/sports";
import { SPORTS, type SportCategory } from "@/lib/types";
import { toast } from "sonner";
import { Search } from "lucide-react";

export default function SponsorBrowsePage() {
  return (
    <RoleGuard role="sponsor">
      <SponsorBrowseContent />
    </RoleGuard>
  );
}

function SponsorBrowseContent() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState<SportCategory | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleInquiry = async () => {
    if (!user || !selectedEvent || !message.trim()) {
      toast.error("Please write a message");
      return;
    }
    setSending(true);
    try {
      await sendSponsorshipInquiry({
        sponsorId: user.uid,
        eventId: selectedEvent.id,
        venueId: selectedEvent.venueId || "",
        message: message.trim(),
      });
      toast.success("Inquiry sent to organizer!");
      setDialogOpen(false);
      setMessage("");
      setSelectedEvent(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send inquiry");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Discover Sponsorship Opportunities</h1>
        <p className="text-muted-foreground">Find events to sponsor across India</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search by event, city, sport..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm pl-9"
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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
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
            <Card key={event.id} className="shadow-sm hover:shadow-md transition-shadow h-full">
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <Badge>
                    {getSportEmoji(event.sportCategory)} {getSportLabel(event.sportCategory)}
                  </Badge>
                  <Badge variant="outline">{event.venueCity}</Badge>
                </div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>
                  {event.venueName} · {event.date} at {event.time}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Registrations</span>
                    <span className="font-medium">
                      {event.registeredCount || 0} / {event.capacity?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fill Rate</span>
                    <span className="font-medium">
                      {event.capacity
                        ? Math.round(((event.registeredCount || 0) / event.capacity) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
                <Dialog open={dialogOpen && selectedEvent?.id === event.id} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) setSelectedEvent(null);
                }}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        className="w-full cursor-pointer"
                        onClick={() => {
                          setSelectedEvent(event);
                          setDialogOpen(true);
                        }}
                      >
                        Contact Organizer
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contact Organizer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.venueName} · Estimated {event.capacity?.toLocaleString()} attendees
                        </p>
                      </div>
                      <Textarea
                        placeholder="Introduce yourself and describe your sponsorship interest..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                      />
                      <Button onClick={handleInquiry} disabled={sending} className="w-full">
                        {sending ? "Sending..." : "Send Inquiry"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
