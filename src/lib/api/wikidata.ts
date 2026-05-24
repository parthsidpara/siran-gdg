import type { ApiSearchResult, VenueEnrichment } from "./types";

const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";

interface SparqlBinding {
  [key: string]: { value: string; type: string };
}

interface SparqlResponse {
  results: { bindings: SparqlBinding[] };
}

export async function searchVenuesWikidata(
  query: string,
  limit = 10
): Promise<ApiSearchResult[]> {
  const sparql = `
    SELECT ?venue ?venueLabel ?sport ?sportLabel ?capacity ?country ?countryLabel ?city ?cityLabel WHERE {
      ?venue wdt:P31/wdt:P279* wd:Q483110 .
      ?venue rdfs:label ?venueLabel .
      FILTER(LANG(?venueLabel) = "en")
      FILTER(CONTAINS(LCASE(?venueLabel), LCASE("${query.replace(/"/g, '\\"')}")))
      OPTIONAL { ?venue wdt:P641 ?sport . ?sport rdfs:label ?sportLabel . FILTER(LANG(?sportLabel) = "en") }
      OPTIONAL { ?venue wdt:P1083 ?capacity . }
      OPTIONAL { ?venue wdt:P17 ?country . ?country rdfs:label ?countryLabel . FILTER(LANG(?countryLabel) = "en") }
      OPTIONAL { ?venue wdt:P131 ?city . ?city rdfs:label ?cityLabel . FILTER(LANG(?cityLabel) = "en") }
    }
    LIMIT ${limit}
  `;

  const url = `${WIKIDATA_SPARQL}?format=json&query=${encodeURIComponent(sparql)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as SparqlResponse;

    return data.results.bindings.map((b) => ({
      id: b.venue?.value?.split("/").pop() || "",
      name: b.venueLabel?.value || "Unknown",
      sport: b.sportLabel?.value?.toLowerCase() || "multi_sport",
      city: b.cityLabel?.value || "",
      country: b.countryLabel?.value || "",
      capacity: parseInt(b.capacity?.value) || 0,
      source: "wikidata" as const,
    }));
  } catch {
    return [];
  }
}

export async function getIndianStadiumsWikidata(
  limit = 50
): Promise<ApiSearchResult[]> {
  const sparql = `
    SELECT ?venue ?venueLabel ?sport ?sportLabel ?capacity ?cityLabel WHERE {
      ?venue wdt:P31/wdt:P279* wd:Q483110 .
      ?venue rdfs:label ?venueLabel .
      FILTER(LANG(?venueLabel) = "en")
      ?venue wdt:P17 wd:Q668 .
      OPTIONAL { ?venue wdt:P641 ?sport . ?sport rdfs:label ?sportLabel . FILTER(LANG(?sportLabel) = "en") }
      OPTIONAL { ?venue wdt:P1083 ?capacity . }
      OPTIONAL { ?venue wdt:P131 ?city . ?city rdfs:label ?cityLabel . FILTER(LANG(?cityLabel) = "en") }
    }
    LIMIT ${limit}
  `;

  const url = `${WIKIDATA_SPARQL}?format=json&query=${encodeURIComponent(sparql)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as SparqlResponse;

    return data.results.bindings.map((b) => ({
      id: b.venue?.value?.split("/").pop() || "",
      name: b.venueLabel?.value || "Unknown",
      sport: b.sportLabel?.value?.toLowerCase() || "multi_sport",
      city: b.cityLabel?.value || "",
      country: "India",
      capacity: parseInt(b.capacity?.value) || 0,
      source: "wikidata" as const,
    }));
  } catch {
    return [];
  }
}
