"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { logOut } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/types";

const ROLE_LABELS: Record<UserRole, string> = {
  participant: "Participant",
  organizer: "Organizer",
  venue_owner: "Venue Owner",
  sponsor: "Sponsor",
};

const NAV_ITEMS: Record<UserRole, { label: string; href: string }[]> = {
  participant: [
    { label: "Browse Events", href: "/participant/browse" },
    { label: "My Events", href: "/participant/my-events" },
  ],
  organizer: [
    { label: "Dashboard", href: "/organizer/dashboard" },
    { label: "Create Event", href: "/organizer/events/create" },
    { label: "Sponsor Requests", href: "/organizer/sponsor-requests" },
  ],
  venue_owner: [
    { label: "My Venues", href: "/venue-owner/venues" },
    { label: "Add Venue", href: "/venue-owner/venues/create" },
  ],
  sponsor: [
    { label: "Browse Events", href: "/sponsor/browse" },
    { label: "My Inquiries", href: "/sponsor/my-inquiries" },
  ],
};

export function NavBar() {
  const { user, role } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">சி</span> Siran
        </Link>

        {role && (
          <nav className="hidden md:flex items-center gap-4">
            {NAV_ITEMS[role]?.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {user && role && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {ROLE_LABELS[role]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{user.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
