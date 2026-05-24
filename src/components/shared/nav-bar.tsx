"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
import {
  LogOut,
  LayoutDashboard,
  CalendarDays,
  MapPin,
  Ticket,
  Megaphone,
  Handshake,
  ChevronDown,
} from "lucide-react";

const ROLE_LABELS: Record<UserRole, string> = {
  participant: "Participant",
  organizer: "Organizer",
  venue_owner: "Venue Owner",
  sponsor: "Sponsor",
};

const NAV_ITEMS: Record<UserRole, { label: string; href: string; icon: React.ReactNode }[]> = {
  participant: [
    { label: "Events", href: "/participant/browse", icon: <CalendarDays className="h-4 w-4" /> },
    { label: "My Events", href: "/participant/my-events", icon: <Ticket className="h-4 w-4" /> },
  ],
  organizer: [
    { label: "Dashboard", href: "/organizer/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Create Event", href: "/organizer/events/create", icon: <CalendarDays className="h-4 w-4" /> },
    { label: "Sponsors", href: "/organizer/sponsor-requests", icon: <Handshake className="h-4 w-4" /> },
  ],
  venue_owner: [
    { label: "Venues", href: "/venue-owner/venues", icon: <MapPin className="h-4 w-4" /> },
    { label: "Add Venue", href: "/venue-owner/venues/create", icon: <MapPin className="h-4 w-4" /> },
  ],
  sponsor: [
    { label: "Browse", href: "/sponsor/browse", icon: <Megaphone className="h-4 w-4" /> },
    { label: "Inquiries", href: "/sponsor/my-inquiries", icon: <Handshake className="h-4 w-4" /> },
  ],
};

export function NavBar() {
  const { user, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight transition-colors hover:opacity-80"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            சி
          </span>
          <span className="hidden sm:inline">Siran</span>
        </Link>

        {role && (
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS[role]?.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {user && role ? (
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="hidden sm:inline-flex text-xs font-medium bg-secondary/60 border-0"
            >
              {ROLE_LABELS[role]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="relative h-8 gap-1.5 px-1.5 text-sm font-normal text-muted-foreground hover:text-foreground"
                  >
                    <Avatar className="h-7 w-7 border border-border/50">
                      <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-[100px] truncate">
                      {user.displayName || user.email?.split("@")[0]}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium text-foreground">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {NAV_ITEMS[role]?.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <DropdownMenuItem
                      key={item.href}
                      className={isActive ? "bg-accent" : ""}
                      onClick={() => router.push(item.href)}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="ml-2">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/login")}
              className="text-sm"
            >
              Sign in
            </Button>
            <Button size="sm" onClick={() => router.push("/register")} className="text-sm">
              Get Started
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
