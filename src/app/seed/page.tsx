"use client";

import { useState } from "react";
import { seedVenues, seedEvents } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SeedPage() {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedVenues();
      await seedEvents();
      toast.success("Demo data seeded! 4 venues + 4 events created.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Seeding failed");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Seed Demo Data</CardTitle>
          <CardDescription>
            Populate Firestore with 4 Indian venues and 4 sample events for hackathon demo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            ⚠ Requires Firebase to be configured in .env.local
          </p>
          <Button onClick={handleSeed} disabled={seeding} className="w-full">
            {seeding ? "Seeding..." : "Seed Demo Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
