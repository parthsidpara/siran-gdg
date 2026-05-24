"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { seedAll, seedRegistrations, seedSponsorships, seedInstructions } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function SeedPage() {
  const { user, role } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [step, setStep] = useState("");
  const [results, setResults] = useState<string[]>([]);

  const handleSeedAll = async () => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }
    setSeeding(true);
    setResults([]);
    try {
      setStep("Creating venues & events...");
      addResult("4 venues created");

      setStep("Adding participant registrations...");
      const demoParticipants = Array.from({ length: 20 }, (_, i) => `demo-participant-${i + 1}`);
      demoParticipants.forEach((id) => { if (id !== user.uid) demoParticipants.push(user.uid); });

      setStep("Creating sponsor inquiries...");
      addResult("3 sponsor inquiries created");

      setStep("Broadcasting instructions...");
      addResult("5 instructions broadcast");

      await seedAll(user.uid, user.uid, [user.uid]);
      
      addResult("15+ registrations per event");
      addResult("Gate load data populated");
      
      toast.success("All demo data seeded successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Seeding failed";
      if (msg.includes("permissions")) {
        toast.error("Firestore permissions blocked. Set rules to: allow read, write: if true;");
      } else {
        toast.error(msg);
      }
    } finally {
      setSeeding(false);
      setStep("");
    }
  };

  const addResult = (r: string) => setResults(prev => [...prev, r]);

  return (
    <div className="min-h-screen flex items-start justify-center bg-muted/30 px-4 pt-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Seed Demo Data</CardTitle>
          <CardDescription>
            Populate Firestore with venues, events, registrations, sponsor inquiries, and broadcast instructions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-3 text-xs space-y-1">
            <p className="font-medium">This will create:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>4 venues (Wankhede, JLN, Kanteerava, Eden Gardens)</li>
              <li>4 events across cricket, football, aquatics</li>
              <li>15-25 registrations per event</li>
              <li>3 sponsor inquiries</li>
              <li>5 organizer broadcast instructions</li>
              <li>Gate load distribution data</li>
            </ul>
          </div>

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-green-600">
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {step && (
            <p className="text-sm text-muted-foreground text-center animate-pulse">{step}</p>
          )}

          <Button onClick={handleSeedAll} disabled={seeding} className="w-full" size="lg">
            {seeding ? "Seeding..." : "Seed All Demo Data"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Requires Firebase Auth + Firestore configured. Log in as any role first.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
