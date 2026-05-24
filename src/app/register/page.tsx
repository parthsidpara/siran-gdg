"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Ticket, ClipboardList, MapPinned, Handshake } from "lucide-react";
import type { UserRole } from "@/lib/types";

const ROLES: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "participant", label: "Participant", description: "Attend events & get gate guidance", icon: <Ticket className="h-4 w-4" /> },
  { value: "organizer", label: "Organizer", description: "Create & manage sporting events", icon: <ClipboardList className="h-4 w-4" /> },
  { value: "venue_owner", label: "Venue Owner", description: "List your venue for events", icon: <MapPinned className="h-4 w-4" /> },
  { value: "sponsor", label: "Sponsor", description: "Discover sponsorship opportunities", icon: <Handshake className="h-4 w-4" /> },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("participant");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) { toast.error("Please select a role"); return; }
    setLoading(true);
    try {
      await signUp(email, password, name, role);
      toast.success("Account created successfully!");
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      if (message.includes("configuration-not-found") || message.includes("operation-not-allowed")) {
        toast.error("Firebase Auth not enabled. Go to Firebase Console > Authentication > Sign-in method > Enable Email/Password.");
      } else if (message.includes("permissions") || message.includes("permission")) {
        toast.error("Firestore permissions blocked. Go to Firebase Console > Firestore > Rules and set allow read, write: if true;");
      } else {
        toast.error(message);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 flex items-center gap-2 text-xl font-semibold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">சி</span>
        Siran
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a role and get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
            <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium">Password</Label>
            <Input id="password" type="password" placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">I am a...</Label>
            <Select value={role} onValueChange={(v) => setRole((v || "") as UserRole)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex items-center gap-2">
                      {r.icon}
                      <span className="font-medium text-sm">{r.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full h-10 text-sm font-medium" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Creating account...</>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">Sign in</Link>
        </p>

        <button onClick={() => router.push("/")} className="mt-6 flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />Back to home
        </button>
      </div>
    </div>
  );
}
