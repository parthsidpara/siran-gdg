import { SportCategory, SPORT_LABELS, SPORT_EMOJIS } from "./types";

export function getSportLabel(sport: SportCategory): string {
  return SPORT_LABELS[sport];
}

export function getSportEmoji(sport: SportCategory): string {
  return SPORT_EMOJIS[sport];
}

export function getSportOptions() {
  return Object.entries(SPORT_LABELS).map(([value, label]) => ({
    value,
    label: `${SPORT_EMOJIS[value as SportCategory]} ${label}`,
  }));
}
