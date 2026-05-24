import { Timestamp } from "firebase/firestore";
import { createDoc, queryDocs, listenToQuery } from "./firestore";
import { where } from "firebase/firestore";

export interface Instruction {
  id: string;
  eventId: string;
  organizerId: string;
  title: string;
  message: string;
  priority: "info" | "warning" | "urgent";
  type: "gate_change" | "crowd_alert" | "general" | "reminder";
  targetGateId?: string;
  createdAt: Timestamp;
}

export async function broadcastInstruction(data: {
  eventId: string;
  organizerId: string;
  title: string;
  message: string;
  priority: string;
  type: string;
  targetGateId?: string;
}) {
  return createDoc("instructions", {
    ...data,
    createdAt: Timestamp.now(),
  });
}

export async function getInstructionsForEvent(eventId: string) {
  return queryDocs("instructions", [where("eventId", "==", eventId)]);
}

export function listenToInstructions(eventId: string, callback: (data: any[]) => void) {
  return listenToQuery("instructions", [where("eventId", "==", eventId)], callback);
}

export async function getInstructionsForParticipant(eventIds: string[]) {
  if (eventIds.length === 0) return [];
  return queryDocs("instructions", [where("eventId", "in", eventIds.slice(0, 10))]);
}
