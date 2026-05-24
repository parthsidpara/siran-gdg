import type { ApiSearchResult, VenueEnrichment, Circuit } from "./types";
import type { Gate, SportCategory, City } from "../types";
import { CITIES } from "../types";

import { searchCircuits, getCircuitById } from "./ergast";
import { searchVenues, getVenueById } from "./thesportsdb";
import { searchVenuesWikidata, getIndianStadiumsWikidata } from "./wikidata";

export async function searchAllVenues(query: string): Promise<ApiSearchResult[]> {
  const [ergast, sportsdb, wikidata] = await Promise.allSettled([
    searchCircuits(query),
    searchVenues(query),
    searchVenuesWikidata(query),
  ]);

  const results: ApiSearchResult[] = [];

  if (ergast.status === "fulfilled") results.push(...ergast.value);
  if (sportsdb.status === "fulfilled") results.push(...sportsdb.value);
  if (wikidata.status === "fulfilled") results.push(...wikidata.value);

  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.name}-${r.city}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function enrichVenue(
  venueName: string,
  sport?: string
): Promise<Partial<VenueEnrichment> | null> {
  if (sport === "f1") {
    const circuits = await searchCircuits(venueName);
    if (circuits.length > 0) {
      const circuit = await getCircuitById(circuits[0].id);
      if (circuit) {
        return {
          name: circuit.circuitName,
          city: circuit.locality,
          lat: circuit.lat,
          lng: circuit.lng,
          sportTypes: ["f1"],
          surface: "Asphalt",
          description: `${circuit.circuitName} - Formula 1 Grand Prix circuit in ${circuit.locality}, ${circuit.country}`,
          source: "ergast",
          country: circuit.country,
        };
      }
    }
  }

  try {
    const venues = await searchVenues(venueName);
    if (venues.length > 0) {
      const details = await getVenueById(venues[0].id);
      if (details) return details;
    }
  } catch {}

  try {
    const wiki = await searchVenuesWikidata(venueName, 1);
    if (wiki.length > 0) {
      return {
        name: wiki[0].name,
        city: wiki[0].city,
        capacity: wiki[0].capacity,
        sportTypes: [wiki[0].sport as SportCategory],
        surface: "",
        description: `${wiki[0].name} in ${wiki[0].city}, ${wiki[0].country}`,
        source: "wikidata",
        country: wiki[0].country,
        lat: 0,
        lng: 0,
        address: "",
      };
    }
  } catch {}

  return null;
}

export function suggestGatesForCircuit(circuit: Circuit): Gate[] {
  const gates: Gate[] = [
    { id: "main-gate", label: "Main Gate", x: 50, y: 10, zone: "main" },
    { id: "paddock-gate", label: "Paddock Gate", x: 20, y: 30, zone: "paddock" },
    { id: "grandstand-a", label: "Grandstand A", x: 80, y: 40, zone: "east" },
    { id: "grandstand-b", label: "Grandstand B", x: 50, y: 90, zone: "south" },
    { id: "vip-entrance", label: "VIP Entrance", x: 10, y: 50, zone: "vip" },
  ];
  return gates;
}

export function suggestGatesForStadium(): Gate[] {
  return [
    { id: "gate-north", label: "North Gate", x: 50, y: 10, zone: "north" },
    { id: "gate-east", label: "East Gate", x: 90, y: 50, zone: "east" },
    { id: "gate-south", label: "South Gate", x: 50, y: 90, zone: "south" },
    { id: "gate-west", label: "West Gate", x: 10, y: 50, zone: "west" },
  ];
}

export function guessCity(cityName: string): string | undefined {
  if (!cityName) return undefined;
  const lower = cityName.toLowerCase().trim();

  // Try exact match first
  const exact = CITIES.find(
    (c) => c.toLowerCase() === lower
  );
  if (exact) return exact;

  // Try: our city name contains the API city name
  const containsExact = CITIES.find(
    (c) => c.toLowerCase().includes(lower)
  );
  if (containsExact) return containsExact;

  // Try: API city contains our city name
  const containsOur = CITIES.find(
    (c) => lower.includes(c.toLowerCase())
  );
  if (containsOur) return containsOur;

  // Try word-level matching (split on space/comma)
  const words = lower.split(/[\s,]+/).filter(w => w.length > 2);
  for (const word of words) {
    const match = CITIES.find(
      (c) => c.toLowerCase() === word || c.toLowerCase().includes(word)
    );
    if (match) return match;
  }

  // Levenshtein-ish: check first 4 chars
  const prefix = lower.slice(0, 4);
  const fuzzy = CITIES.find(
    (c) => c.toLowerCase().slice(0, 4) === prefix
  );
  if (fuzzy) return fuzzy;

  return undefined;
}

export interface VenueLookupResult {
  enrichment: Partial<VenueEnrichment>;
  searchResults: ApiSearchResult[];
  allSources: string[];
}

export async function fullVenueLookup(
  query: string,
  sport?: string
): Promise<VenueLookupResult> {
  const [enrichment, allSources, searchResults] = await Promise.all([
    enrichVenue(query, sport).catch(() => null),
    Promise.allSettled([
      searchCircuits(query).then((r) => ({ source: "ergast", count: r.length })),
      searchVenues(query).then((r) => ({ source: "thesportsdb", count: r.length })),
      searchVenuesWikidata(query, 3).then((r) => ({ source: "wikidata", count: r.length })),
    ]).then((results) =>
      results
        .filter((r) => r.status === "fulfilled" && r.value.count > 0)
        .map((r) => (r as PromiseFulfilledResult<{ source: string; count: number }>).value.source)
    ),
    searchAllVenues(query).catch(() => []),
  ]);

  return {
    enrichment: enrichment || {},
    searchResults,
    allSources,
  };
}
