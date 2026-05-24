import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";
import type { Event, Venue, Registration, Sponsorship } from "../types";

const eventsRef = collection(db, "events");
const venuesRef = collection(db, "venues");
const registrationsRef = collection(db, "registrations");
const sponsorshipsRef = collection(db, "sponsorships");

export async function createDoc(
  collectionName: string,
  data: Record<string, unknown>
) {
  const colRef = collection(db, collectionName);
  return addDoc(colRef, {
    ...data,
    createdAt: Timestamp.now(),
  });
}

export async function updateDocById(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
) {
  return updateDoc(doc(db, collectionName, docId), data);
}

export async function getDocById(collectionName: string, docId: string) {
  const snap = await getDoc(doc(db, collectionName, docId));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
}

export async function queryDocs(
  collectionName: string,
  constraints: QueryConstraint[]
) {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function listenToDoc(
  collectionName: string,
  docId: string,
  callback: (data: DocumentData | null) => void
) {
  return onSnapshot(doc(db, collectionName, docId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    else callback(null);
  });
}

export function listenToQuery(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: DocumentData[]) => void
) {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Venue helpers
export async function createVenue(data: Omit<Venue, "id" | "createdAt">) {
  return createDoc("venues", data);
}

export async function getVenuesByOwner(ownerId: string) {
  return queryDocs("venues", [where("ownerId", "==", ownerId)]);
}

export async function getAllVenues() {
  return queryDocs("venues", [orderBy("createdAt", "desc")]);
}

// Event helpers
export async function createEvent(data: Omit<Event, "id" | "createdAt">) {
  return createDoc("events", data);
}

export async function getEvents() {
  return queryDocs("events", [where("status", "==", "upcoming")]);
}

export async function getEventsByOrganizer(organizerId: string) {
  return queryDocs("events", [where("organizerId", "==", organizerId)]);
}

export async function getEventsBySport(sport: string) {
  return queryDocs("events", [
    where("sportCategory", "==", sport),
    where("status", "==", "upcoming"),
  ]);
}

// Registration helpers
export async function registerForEvent(data: {
  userId: string;
  eventId: string;
  arrivalWindow: string;
  assignedGate: string;
}) {
  const result = await createDoc("registrations", data);
  const eventRef = doc(db, "events", data.eventId);
  const eventSnap = await getDoc(eventRef);
  if (eventSnap.exists()) {
    const eventData = eventSnap.data();
    const currentCount = eventData.registeredCount || 0;
    const slots = { ...(eventData.arrivalSlots || {}) };
    slots[data.arrivalWindow] = (slots[data.arrivalWindow] || 0) + 1;
    await updateDoc(eventRef, {
      registeredCount: currentCount + 1,
      arrivalSlots: slots,
    });
  }
  return result;
}

export async function getRegistrationsByUser(userId: string) {
  return queryDocs("registrations", [where("userId", "==", userId)]);
}

export async function getRegistrationsByEvent(eventId: string) {
  return queryDocs("registrations", [where("eventId", "==", eventId)]);
}

// Sponsorship helpers
export async function sendSponsorshipInquiry(data: {
  sponsorId: string;
  eventId: string;
  venueId: string;
  message: string;
}) {
  return createDoc("sponsorships", {
    ...data,
    status: "pending",
  });
}

export async function getSponsorshipsBySponsor(sponsorId: string) {
  return queryDocs("sponsorships", [where("sponsorId", "==", sponsorId)]);
}
