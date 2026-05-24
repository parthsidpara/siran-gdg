"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export function FirebaseStatus() {
  const hasApiKey = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const isConfigured =
    hasApiKey &&
    hasProjectId &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your-api-key" &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "your-project-id";

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Firebase Status</CardTitle>
          <Badge variant={isConfigured ? "default" : "destructive"} className="text-xs">
            {isConfigured ? "Connected" : "Not Configured"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {isConfigured
            ? "Firebase is connected. All features are ready."
            : "Set up Firebase in .env.local to enable database, auth & storage."}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
