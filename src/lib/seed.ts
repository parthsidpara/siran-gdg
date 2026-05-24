import { createDoc } from "./firebase/firestore";
import type { Venue } from "./types";

const DEMO_VENUES: Omit<Venue, "id" | "createdAt">[] = [
  {
    ownerId: "demo-venue-owner",
    name: "Wankhede Stadium",
    sportTypes: ["cricket"],
    capacity: 33000,
    city: "Mumbai",
    address: "D Road, Churchgate, Mumbai",
    lat: 18.9389,
    lng: 72.8258,
    gates: [
      { id: "gate-1", label: "Gate 1 - North Stand", x: 50, y: 10, zone: "north" },
      { id: "gate-2", label: "Gate 2 - East Stand", x: 90, y: 50, zone: "east" },
      { id: "gate-3", label: "Gate 3 - South Stand", x: 50, y: 90, zone: "south" },
      { id: "gate-4", label: "Gate 4 - West Stand", x: 10, y: 50, zone: "west" },
    ],
    mapImageUrl: "",
    surface: "Grass",
    description: "Iconic cricket stadium in Mumbai, home to Mumbai Indians",
    status: "available",
  },
  {
    ownerId: "demo-venue-owner-2",
    name: "Jawaharlal Nehru Stadium",
    sportTypes: ["football", "aquatics"],
    capacity: 60000,
    city: "Delhi",
    address: "Pragati Vihar, New Delhi",
    lat: 28.5824,
    lng: 77.2346,
    gates: [
      { id: "gate-a", label: "Gate A - Main", x: 50, y: 10, zone: "main" },
      { id: "gate-b", label: "Gate B - East wing", x: 90, y: 50, zone: "east" },
      { id: "gate-c", label: "Gate C - VIP", x: 10, y: 30, zone: "vip" },
      { id: "gate-d", label: "Gate D - South", x: 50, y: 90, zone: "south" },
    ],
    mapImageUrl: "",
    surface: "Hybrid Grass",
    description: "Multi-purpose stadium in Delhi, hosted Commonwealth Games 2010",
    status: "available",
  },
  {
    ownerId: "demo-venue-owner-3",
    name: "Sree Kanteerava Stadium",
    sportTypes: ["football", "aquatics", "multi_sport"],
    capacity: 24000,
    city: "Bangalore",
    address: "Kasturba Road, Bangalore",
    lat: 12.9699,
    lng: 77.5934,
    gates: [
      { id: "g1", label: "Gate 1", x: 40, y: 10, zone: "north" },
      { id: "g2", label: "Gate 2", x: 85, y: 40, zone: "east" },
      { id: "g3", label: "Gate 3", x: 50, y: 90, zone: "south" },
    ],
    mapImageUrl: "",
    surface: "Grass",
    description: "Home to Bengaluru FC, located in the heart of Bangalore",
    status: "available",
  },
  {
    ownerId: "demo-venue-owner-4",
    name: "Eden Gardens",
    sportTypes: ["cricket"],
    capacity: 66000,
    city: "Kolkata",
    address: "Maidan, Kolkata",
    lat: 22.5645,
    lng: 88.3433,
    gates: [
      { id: "eg1", label: "Gate 1 - High Court", x: 50, y: 8, zone: "north" },
      { id: "eg2", label: "Gate 2 - Club House", x: 88, y: 45, zone: "east" },
      { id: "eg3", label: "Gate 3 - Block J", x: 50, y: 92, zone: "south" },
      { id: "eg4", label: "Gate 4 - Block A", x: 12, y: 45, zone: "west" },
    ],
    mapImageUrl: "",
    surface: "Grass",
    description: "Largest cricket stadium in India by capacity",
    status: "available",
  },
];

export async function seedVenues() {
  for (const venue of DEMO_VENUES) {
    await createDoc("venues", venue);
  }
  console.log(`Seeded ${DEMO_VENUES.length} venues`);
}

const DEMO_EVENTS = [
  {
    organizerId: "demo-organizer",
    venueId: "",
    venueName: "Wankhede Stadium",
    venueCity: "Mumbai",
    title: "Mumbai T20 Premier League - Finals",
    sportCategory: "cricket",
    date: "2026-06-15",
    time: "18:00",
    capacity: 33000,
    registeredCount: 0,
    arrivalSlots: {},
    gateLoad: {},
    status: "upcoming",
    description: "The grand finale of the Mumbai T20 League. Watch the top teams compete!",
  },
  {
    organizerId: "demo-organizer",
    venueId: "",
    venueName: "Jawaharlal Nehru Stadium",
    venueCity: "Delhi",
    title: "Delhi Football Championship",
    sportCategory: "football",
    date: "2026-06-20",
    time: "17:00",
    capacity: 60000,
    registeredCount: 0,
    arrivalSlots: {},
    gateLoad: {},
    status: "upcoming",
    description: "Annual Delhi football championship featuring top clubs from North India.",
  },
  {
    organizerId: "demo-organizer",
    venueId: "",
    venueName: "Sree Kanteerava Stadium",
    venueCity: "Bangalore",
    title: "Bangalore Open Athletics Meet",
    sportCategory: "aquatics",
    date: "2026-06-25",
    time: "09:00",
    capacity: 24000,
    registeredCount: 0,
    arrivalSlots: {},
    gateLoad: {},
    status: "upcoming",
    description: "Track and field events featuring athletes from across Karnataka.",
  },
  {
    organizerId: "demo-organizer",
    venueId: "",
    venueName: "Eden Gardens",
    venueCity: "Kolkata",
    title: "Kolkata Cricket Derby",
    sportCategory: "cricket",
    date: "2026-07-01",
    time: "14:00",
    capacity: 66000,
    registeredCount: 0,
    arrivalSlots: {},
    gateLoad: {},
    status: "upcoming",
    description: "Historic rivalry match at the iconic Eden Gardens.",
  },
];

export async function seedEvents() {
  for (const event of DEMO_EVENTS) {
    await createDoc("events", event);
  }
  console.log(`Seeded ${DEMO_EVENTS.length} events`);
}
