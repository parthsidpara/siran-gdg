"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/shared/role-guard";
import { createVenue } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { VenueLookup } from "@/components/venue/venue-lookup";
import { SPORTS, CITIES, type SportCategory } from "@/lib/types";
import { getSportLabel } from "@/lib/sports";
import { Plus, Trash2 } from "lucide-react";
import type { Gate } from "@/lib/types";

export default function CreateVenuePage() {
  return (
    <RoleGuard role="venue_owner">
      <CreateVenueForm />
    </RoleGuard>
  );
}

function CreateVenueForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [sportTypes, setSportTypes] = useState<SportCategory[]>([]);
  const [capacity, setCapacity] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [surface, setSurface] = useState("");
  const [description, setDescription] = useState("");
  const [gates, setGates] = useState<Omit<Gate, "id">[]>([
    { label: "", x: 50, y: 10, zone: "" },
  ]);

  const addGate = () => {
    setGates([...gates, { label: "", x: 50, y: 50, zone: "" }]);
  };

  const removeGate = (index: number) => {
    setGates(gates.filter((_, i) => i !== index));
  };

  const updateGate = (index: number, field: string, value: string | number) => {
    const updated = [...gates];
    updated[index] = { ...updated[index], [field]: value };
    setGates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !city) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const validGates: Gate[] = gates
        .filter((g) => g.label.trim())
        .map((g, i) => ({ id: `gate-${Date.now()}-${i}`, ...g }));

      await createVenue({
        ownerId: user.uid,
        name,
        sportTypes,
        capacity: Number(capacity),
        city,
        address,
        lat: 0,
        lng: 0,
        gates: validGates,
        mapImageUrl: "",
        surface,
        description,
        status: "available",
      });

      toast.success("Venue listed successfully!");
      router.push("/venue-owner/venues");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create venue");
    } finally {
      setLoading(false);
    }
  };

  const handleLookupFill = (data: {
    name: string; city: string; capacity: string;
    surface: string; description: string; sportTypes: SportCategory[];
    gates: Gate[]; lat: number; lng: number;
  }) => {
    if (data.name) setName(data.name);
    if (data.city) setCity(data.city);
    if (data.capacity) setCapacity(data.capacity);
    if (data.surface) setSurface(data.surface);
    if (data.description) setDescription(data.description);
    if (data.sportTypes.length > 0) setSportTypes(data.sportTypes);
    if (data.gates.length > 0) {
      setGates(data.gates.map(g => ({
        label: g.label, x: g.x, y: g.y, zone: g.zone,
      })));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">List a New Venue</h1>

      <VenueLookup onFillData={handleLookupFill} />

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        <div className="rounded-xl border border-border/50 p-5">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Basic Info</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Venue Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sports *</Label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((sport) => (
                  <Button
                    key={sport}
                    type="button"
                    variant={sportTypes.includes(sport) ? "default" : "outline"}
                    size="sm"
                    className="h-9"
                    onClick={() =>
                      setSportTypes(
                        sportTypes.includes(sport)
                          ? sportTypes.filter((s) => s !== sport)
                          : [...sportTypes, sport]
                      )
                    }
                  >
                    {getSportLabel(sport)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="capacity" className="text-xs font-medium">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="surface" className="text-xs font-medium">Surface</Label>
                <Select value={surface} onValueChange={(v) => setSurface(v || "")}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select surface" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grass">Grass</SelectItem>
                    <SelectItem value="Artificial Turf">Artificial Turf</SelectItem>
                    <SelectItem value="Hybrid Grass">Hybrid Grass</SelectItem>
                    <SelectItem value="Clay">Clay</SelectItem>
                    <SelectItem value="Hard Court">Hard Court</SelectItem>
                    <SelectItem value="Asphalt">Asphalt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-medium">City *</Label>
              <Select value={city} onValueChange={(v) => setCity(v || "")}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-medium">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs font-medium">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">Gates & Entry Points</h2>
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={addGate}>
              <Plus className="h-4 w-4 mr-1" /> Add Gate
            </Button>
          </div>
          <div className="space-y-3">
            {gates.map((gate, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium shrink-0 mt-1">
                  {i + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder={`Gate ${i + 1} label`}
                    value={gate.label}
                    onChange={(e) => updateGate(i, "label", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Input
                    placeholder="Zone"
                    value={gate.zone}
                    onChange={(e) => updateGate(i, "zone", e.target.value)}
                    className="h-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => removeGate(i)}
                  disabled={gates.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full h-9" size="sm" disabled={loading}>
          {loading ? "Listing venue..." : "List Venue"}
        </Button>
      </form>
    </div>
  );
}
