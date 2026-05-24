import { Timestamp, GeoPoint } from "firebase/firestore";

export type UserRole = "participant" | "organizer" | "venue_owner" | "sponsor";

export const SPORTS = [
  "cricket",
  "badminton",
  "football",
  "f1",
  "hockey",
  "basketball",
  "tennis",
  "aquatics",
  "combat",
  "multi_sport",
] as const;

export type SportCategory = (typeof SPORTS)[number];

export const SPORT_LABELS: Record<SportCategory, string> = {
  cricket: "Cricket",
  badminton: "Badminton",
  football: "Football",
  f1: "F1 / Motorsport",
  hockey: "Hockey",
  basketball: "Basketball",
  tennis: "Tennis",
  aquatics: "Aquatics / Athletics",
  combat: "Combat Sports",
  multi_sport: "Multi-Sport Events",
};

export const SPORT_EMOJIS: Record<SportCategory, string> = {
  cricket: "🏏",
  badminton: "🏸",
  football: "⚽",
  f1: "🏎️",
  hockey: "🏑",
  basketball: "🏀",
  tennis: "🎾",
  aquatics: "🏊",
  combat: "🤼",
  multi_sport: "🏋️",
};

export const CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Ahmedabad",
  "Pune",
  "Jaipur",
  "Lucknow",
] as const;

export type City = (typeof CITIES)[number];

export type CongestionLevel = "low" | "medium" | "high";

export interface Gate {
  id: string;
  label: string;
  x: number;
  y: number;
  zone: string;
}

export interface Venue {
  id: string;
  ownerId: string;
  name: string;
  sportTypes: SportCategory[];
  capacity: number;
  city: City;
  address: string;
  lat: number;
  lng: number;
  gates: Gate[];
  mapImageUrl: string;
  surface: string;
  description: string;
  status: "available" | "booked";
  createdAt: Timestamp;
}

export interface Event {
  id: string;
  organizerId: string;
  venueId: string;
  venueName: string;
  venueCity: string;
  title: string;
  sportCategory: SportCategory;
  date: string;
  time: string;
  capacity: number;
  registeredCount: number;
  arrivalSlots: Record<string, number>;
  gateLoad: Record<string, CongestionLevel>;
  status: "upcoming" | "live" | "completed";
  description: string;
  createdAt: Timestamp;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  arrivalWindow: string;
  assignedGate: string;
  createdAt: Timestamp;
}

export interface Sponsorship {
  id: string;
  sponsorId: string;
  eventId: string;
  venueId: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Timestamp;
}
