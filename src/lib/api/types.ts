export interface VenueEnrichment {
  name: string;
  capacity: number;
  city: string;
  address: string;
  lat: number;
  lng: number;
  sportTypes: string[];
  surface: string;
  description: string;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  country?: string;
  yearBuilt?: number;
  gates?: { label: string; zone: string; x: number; y: number }[];
}

export interface ApiSearchResult {
  id: string;
  name: string;
  sport: string;
  city: string;
  country: string;
  capacity: number;
  source: "ergast" | "thesportsdb" | "wikidata" | "combined";
}

export interface Circuit {
  circuitId: string;
  circuitName: string;
  country: string;
  locality: string;
  lat: number;
  lng: number;
}

export interface SportsDBCountry {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strCountry: string;
}

export interface ApiConfig {
  sportsDbApiKey?: string;
  sportsDbBaseUrl?: string;
  ergastBaseUrl?: string;
}
