import { doc, updateDoc, getDocs, collection, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "./config";
import { createDoc, queryDocs, listenToQuery } from "./firestore";

export async function sendMessage(data: {
  fromUserId: string;
  fromRole: string;
  toUserId: string;
  toRole: string;
  subject: string;
  message: string;
  relatedEventId?: string;
  relatedVenueId?: string;
}) {
  return createDoc("messages", {
    ...data,
    read: false,
    repliedTo: null,
    createdAt: Timestamp.now(),
  });
}

export async function replyToMessage(messageId: string, reply: string) {
  const ref = doc(db, "messages", messageId);
  await updateDoc(ref, { reply, read: true, repliedAt: Timestamp.now() });
}

export async function markAsRead(messageId: string) {
  const ref = doc(db, "messages", messageId);
  await updateDoc(ref, { read: true });
}

export async function getMessagesForUser(userId: string) {
  return queryDocs("messages", [
    where("toUserId", "==", userId),
  ]);
}

export async function getSentMessages(userId: string) {
  return queryDocs("messages", [
    where("fromUserId", "==", userId),
  ]);
}

export function listenToMessages(userId: string, callback: (data: any[]) => void) {
  return listenToQuery("messages", [where("toUserId", "==", userId)], callback);
}

export async function updateSponsorshipStatus(sponsorshipId: string, status: string) {
  const ref = doc(db, "sponsorships", sponsorshipId);
  await updateDoc(ref, { status, updatedAt: Timestamp.now() });
}
