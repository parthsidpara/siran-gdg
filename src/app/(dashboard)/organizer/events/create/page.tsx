"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { createEvent, getAllVenues } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SPORTS, type SportCategory, type Venue } from "@/lib/types";
import { getSportLabel, getSportEmoji } from "@/lib/sports";

export default function CreateEventPage() {
  return (
    <RoleGuard role="organizer">
      <CreateEventForm />
    </RoleGuard>
  );
}

function CreateEventForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [sportCategory, setSportCategory] = useState<SportCategory | "">("");
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    getAllVenues().then(setVenues);
  }, []);

  const selectedVenue = venues.find((v: any) => v.id === selectedVenueId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedVenue || !sportCategory) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const gateLoad: Record<string, "low" | "medium" | "high"> = {};
      selectedVenue.gates?.forEach((g: any) => {
        gateLoad[g.id] = "low";
      });

      await createEvent({
        organizerId: user.uid,
        venueId: selectedVenue.id,
        venueName: selectedVenue.name,
        venueCity: selectedVenue.city || "",
        title,
        sportCategory,
        date,
        time,
        capacity: Number(capacity),
        registeredCount: 0,
        arrivalSlots: {},
        gateLoad,
        status: "upcoming",
        description,
      });

      toast.success("Event created successfully!");
      router.push("/organizer/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = sportCategory
    ? venues.filter((v: any) => v.sportTypes?.includes(sportCategory))
    : venues;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Basic information about your event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Sport Category *</Label>
              <Select value={sportCategory} onValueChange={(v) => setSportCategory((v || "") as SportCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {getSportEmoji(sport)} {getSportLabel(sport)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Venue *</Label>
              <Select
                value={selectedVenueId}
                onValueChange={(v) => setSelectedVenueId(v || "")}
                disabled={!sportCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder={sportCategory ? "Select venue" : "Select sport first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredVenues.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.city}, {v.capacity?.toLocaleString()})
                    </SelectItem>
                  ))}
                  {filteredVenues.length === 0 && sportCategory && (
                    <div className="p-2 text-sm text-muted-foreground">
                      No venues available for this sport
                    </div>
                  )}
                </SelectContent>
              </Select>
              {selectedVenue && (
                <p className="text-xs text-muted-foreground">
                  {selectedVenue.gates?.length || 0} gates · Surface: {selectedVenue.surface}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Expected Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder={selectedVenue ? selectedVenue.capacity?.toString() : "Enter capacity"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating event..." : "Create Event"}
        </Button>
      </form>
    </div>
  );
}
