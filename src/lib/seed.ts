import { createDoc } from "./firebase/firestore";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase/config";
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
  const ids: string[] = [];
  for (const venue of DEMO_VENUES) {
    const ref = await createDoc("venues", venue);
    ids.push(ref.id);
  }
  console.log(`Seeded ${DEMO_VENUES.length} venues`);
  return ids;
}

const ARRIVAL_WINDOWS = ["15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

const GATE_ASSIGNMENTS: Record<string, string[]> = {
  "gate-1": ["15:00", "15:30"],
  "gate-2": ["16:00", "16:30"],
  "gate-3": ["17:00", "17:30"],
  "gate-4": ["15:00", "16:00"],
  "gate-a": ["15:00", "16:00", "17:00"],
  "gate-b": ["15:30", "16:30", "17:30"],
  "g1": ["15:00", "16:00", "17:00"],
  "g2": ["15:30", "16:30", "17:30"],
  "eg1": ["15:00", "15:30"],
  "eg2": ["16:00", "16:30"],
  "eg3": ["17:00", "17:30"],
  "eg4": ["15:30", "16:00"],
};

export async function seedRegistrations(eventIds: string[], participantIds: string[]) {
  if (participantIds.length === 0 || eventIds.length === 0) return;

  const registrations: any[] = [];
  const names = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Ananya", "Raj", "Deepika", "Karan", "Nisha",
    "Arjun", "Meera", "Rohan", "Kavya", "Aditya", "Isha", "Siddharth", "Tara", "Dev", "Lakshmi"];
  
  for (let i = 0; i < eventIds.length; i++) {
    const eventId = eventIds[i];
    const gates = Object.keys(GATE_ASSIGNMENTS).slice(i * 3, i * 3 + 4);
    const totalRegs = Math.min(15 + i * 10, participantIds.length);
    
    for (let j = 0; j < totalRegs; j++) {
      const window = ARRIVAL_WINDOWS[j % ARRIVAL_WINDOWS.length];
      const gate = gates[j % gates.length] || "gate-1";
      registrations.push({
        userId: participantIds[j % participantIds.length],
        eventId,
        arrivalWindow: window,
        assignedGate: gate,
      });
    }
  }

  for (const reg of registrations) {
    await createDoc("registrations", reg);
  }
  
  // Update event registered counts and arrival slots
  for (const eventId of eventIds) {
    const regsForEvent = registrations.filter(r => r.eventId === eventId);
    const arrivalSlots: Record<string, number> = {};
    const gateLoad: Record<string, string> = {};
    
    regsForEvent.forEach(r => {
      arrivalSlots[r.arrivalWindow] = (arrivalSlots[r.arrivalWindow] || 0) + 1;
    });
    
    Object.keys(GATE_ASSIGNMENTS).forEach((gate) => {
      const count = regsForEvent.filter(r => r.assignedGate === gate).length;
      gateLoad[gate] = count < 3 ? "low" : count < 6 ? "medium" : "high";
    });
    
    await updateDoc(doc(db, "events", eventId), {
      registeredCount: regsForEvent.length,
      arrivalSlots,
      gateLoad,
    });
  }

  console.log(`Seeded ${registrations.length} registrations across ${eventIds.length} events`);
}

export async function seedSponsorships(eventIds: string[], sponsorId: string) {
  if (!sponsorId || eventIds.length === 0) return;

  const inquiries = [
    { eventIdx: 0, message: "We'd like to sponsor the Mumbai T20 Finals. We're a sports drink brand wanting stadium branding and digital presence. Our budget is ₹5L. Let's discuss!" },
    { eventIdx: 1, message: "Interested in being the official kit sponsor for the Delhi Football Championship. We manufacture premium football gear and would like exclusive branding rights." },
    { eventIdx: 2, message: "We run a fitness app and want to sponsor the Bangalore Athletics Meet. Looking for activation zones and participant engagement opportunities." },
  ];

  for (const inquiry of inquiries) {
    const eventId = eventIds[inquiry.eventIdx];
    if (!eventId) continue;
    
    await createDoc("sponsorships", {
      sponsorId,
      eventId,
      venueId: "",
      message: inquiry.message,
      status: inquiry.eventIdx === 2 ? "accepted" : "pending",
    });
  }

  console.log(`Seeded ${inquiries.length} sponsor inquiries`);
}

export async function seedInstructions(eventIds: string[], organizerId: string) {
  if (!organizerId || eventIds.length === 0) return;

  const instructions = [
    {
      eventIdx: 0,
      title: "Updated Gate Assignment",
      message: "Due to expected crowds, Gate 1 & 2 will have express lanes. Please bring your registration QR to scan at entry.",
      priority: "warning",
      type: "gate_change",
      targetGateId: "gate-1",
    },
    {
      eventIdx: 0,
      title: "Parking Advisory",
      message: "Limited parking at Wankhede. Use Churchgate station or the shuttle from Marine Drive. Carpooling recommended.",
      priority: "info",
      type: "general",
    },
    {
      eventIdx: 1,
      title: "Security Update",
      message: "Bags larger than A4 size will not be permitted. Please arrive early for security screening. Water bottles must be transparent.",
      priority: "warning",
      type: "general",
    },
    {
      eventIdx: 1,
      title: "Crowd Alert - Gate C",
      message: "Heavy crowding expected at Gate C between 16:30-17:00. Use Gates A or D for faster entry during this window.",
      priority: "urgent",
      type: "crowd_alert",
      targetGateId: "gate-c",
    },
    {
      eventIdx: 3,
      title: "Weather Advisory",
      message: "Chance of evening showers in Kolkata. Bring rain gear. Covered seating available in Blocks J through L.",
      priority: "info",
      type: "general",
    },
  ];

  for (const inst of instructions) {
    const eventId = eventIds[inst.eventIdx];
    if (!eventId) continue;
    
    await createDoc("instructions", {
      eventId,
      organizerId,
      title: inst.title,
      message: inst.message,
      priority: inst.priority,
      type: inst.type,
      targetGateId: inst.targetGateId || null,
      createdAt: new Date(),
    });
  }

  console.log(`Seeded ${instructions.length} broadcast instructions`);
}

const DEMO_EVENTS = [
  {
    organizerId: "",
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
    description: "The grand finale of the Mumbai T20 League. Watch the top teams compete for the championship!",
  },
  {
    organizerId: "",
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
    description: "Annual Delhi football championship featuring top clubs from North India. Semi-finals and finals.",
  },
  {
    organizerId: "",
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
    description: "Track and field events featuring athletes from across Karnataka. 100m, 200m, relays, and field events.",
  },
  {
    organizerId: "",
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
    description: "Historic rivalry match at the iconic Eden Gardens. East Zone vs West Zone clash.",
  },
];

export async function seedEvents(organizerId: string, venueIds: string[]) {
  const eventIds: string[] = [];
  for (let i = 0; i < DEMO_EVENTS.length; i++) {
    const event = { ...DEMO_EVENTS[i], organizerId, venueId: venueIds[i] || "" };
    const ref = await createDoc("events", event);
    eventIds.push(ref.id);
  }
  console.log(`Seeded ${DEMO_EVENTS.length} events`);
  return eventIds;
}

export async function seedAll(organizerId: string, sponsorId: string, participantIds: string[]) {
  console.log("Starting full seed...");
  const venueIds = await seedVenues();
  const eventIds = await seedEvents(organizerId, venueIds);
  await seedRegistrations(eventIds, participantIds);
  await seedSponsorships(eventIds, sponsorId);
  await seedInstructions(eventIds, organizerId);
  console.log("Full seed complete!");
}
