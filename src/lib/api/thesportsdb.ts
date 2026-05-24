import { fetchApi } from "./client";
import type { ApiSearchResult, VenueEnrichment } from "./types";

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_SPORTSDB_API_KEY || "3";
}

interface SportsDBVenue {
  idVenue: string;
  strVenue: string;
  strSport: string;
  strCountry: string;
  strLocation: string;
  intCapacity: string;
  strDescriptionEN: string;
  strThumb: string;
  strFanart1: string;
  strMap: string;
}

interface SportsDBResponse {
  venues: SportsDBVenue[];
}

export async function searchVenues(query: string): Promise<ApiSearchResult[]> {
  const key = getApiKey();
  const data = await fetchApi<SportsDBResponse>(
    `${SPORTSDB_BASE}/${key}/searchvenues.php?v=${encodeURIComponent(query)}`,
    {},
    `tsdb-venue-search-${query}`
  );

  if (!data.venues) return [];

  return data.venues.map((v) => ({
    id: v.idVenue,
    name: v.strVenue,
    sport: v.strSport?.toLowerCase() || "unknown",
    city: v.strLocation || "",
    country: v.strCountry || "",
    capacity: parseInt(v.intCapacity) || 0,
    source: "thesportsdb" as const,
  }));
}

export async function getVenueById(venueId: string): Promise<VenueEnrichment | null> {
  const key = getApiKey();
  const data = await fetchApi<SportsDBResponse>(
    `${SPORTSDB_BASE}/${key}/lookupvenue.php?id=${venueId}`,
    {},
    `tsdb-venue-${venueId}`
  );

  if (!data.venues || data.venues.length === 0) return null;

  const v = data.venues[0];
  return {
    name: v.strVenue,
    capacity: parseInt(v.intCapacity) || 0,
    city: v.strLocation || "",
    address: v.strLocation || "",
    lat: 0,
    lng: 0,
    sportTypes: [v.strSport?.toLowerCase() || "multi_sport"],
    surface: "",
    description: v.strDescriptionEN?.slice(0, 500) || "",
    source: "thesportsdb",
    sourceUrl: v.strMap || "",
    imageUrl: v.strThumb || v.strFanart1 || "",
    country: v.strCountry || "",
  };
}

export async function getVenuesBySport(sport: string): Promise<ApiSearchResult[]> {
  return searchVenues(sport);
}

export async function getIndianVenues(): Promise<ApiSearchResult[]> {
  return searchVenues("India");
}
