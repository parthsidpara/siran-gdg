import { Gate, CongestionLevel } from "@/lib/types";

interface GateAssignmentInput {
  arrivalWindow: string;
  gates: Gate[];
  existingRegistrations: { arrivalWindow: string; assignedGate: string }[];
  gateCapacity: number;
}

export function assignGate({
  arrivalWindow,
  gates,
  existingRegistrations,
  gateCapacity,
}: GateAssignmentInput): string {
  const perGateLoads: Record<string, number> = {};
  gates.forEach((g) => {
    perGateLoads[g.id] = existingRegistrations.filter(
      (r) => r.arrivalWindow === arrivalWindow && r.assignedGate === g.id
    ).length;
  });

  let bestGate = gates[0].id;
  let lowestLoad = perGateLoads[bestGate] ?? Infinity;

  for (const gate of gates) {
    const load = perGateLoads[gate.id] ?? 0;
    if (load < lowestLoad) {
      lowestLoad = load;
      bestGate = gate.id;
    }
  }

  return bestGate;
}

export function getCongestionLevel(
  count: number,
  capacity: number
): CongestionLevel {
  if (capacity <= 0) return "low";
  const ratio = count / capacity;
  if (ratio < 0.3) return "low";
  if (ratio < 0.7) return "medium";
  return "high";
}

export function getCongestionColor(level: CongestionLevel): string {
  switch (level) {
    case "low":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-500";
    case "high":
      return "bg-red-500";
  }
}

export function getCongestionTextColor(level: CongestionLevel): string {
  switch (level) {
    case "low":
      return "text-green-600";
    case "medium":
      return "text-yellow-600";
    case "high":
      return "text-red-600";
  }
}

export function getCongestionLabel(level: CongestionLevel): string {
  switch (level) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
  }
}

export function getCongestionEmoji(level: CongestionLevel): string {
  switch (level) {
    case "low":
      return "🟢";
    case "medium":
      return "🟡";
    case "high":
      return "🔴";
  }
}

export function generateArrivalWindows(
  startHour: number,
  endHour: number,
  intervalMinutes: number = 30
): string[] {
  const windows: string[] = [];
  let hour = startHour;
  let minute = 0;

  while (hour < endHour || (hour === endHour && minute === 0)) {
    const next = minute + intervalMinutes;
    const endMinute = next % 60;
    const endHour = hour + Math.floor(next / 60);
    const pad = (n: number) => n.toString().padStart(2, "0");
    windows.push(`${pad(hour)}:${pad(minute)}`);
    hour = endHour;
    minute = endMinute;
  }

  return windows;
}
