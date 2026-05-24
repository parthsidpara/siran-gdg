"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fullVenueLookup } from "@/lib/api/venues";
import { getCircuitVenueImage } from "@/lib/api/ergast";
import { suggestGatesForCircuit, suggestGatesForStadium, guessCity } from "@/lib/api/venues";
import type { VenueEnrichment, ApiSearchResult } from "@/lib/api/types";
import type { SportCategory, Gate } from "@/lib/types";
import { getSportEmoji } from "@/lib/sports";
import { Search, Database, Loader2, Check, MapPin, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface VenueLookupProps {
  onFillData: (data: {
    name: string;
    city: string;
    capacity: string;
    surface: string;
    description: string;
    sportTypes: SportCategory[];
    gates: Gate[];
    lat: number;
    lng: number;
  }) => void;
}

export function VenueLookup({ onFillData }: VenueLookupProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ApiSearchResult[]>([]);
  const [enrichment, setEnrichment] = useState<Partial<VenueEnrichment> | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [appliedResult, setAppliedResult] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    setEnrichment(null);

    try {
      const result = await fullVenueLookup(query.trim());
      setResults(result.searchResults);
      setSources(result.allSources);
      if (Object.keys(result.enrichment).length > 1) {
        setEnrichment(result.enrichment);
      } else {
        setEnrichment(null);
      }
    } catch (err: unknown) {
      toast.error("Search failed. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  };

  const sourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      ergast: "bg-red-100 text-red-700",
      thesportsdb: "bg-blue-100 text-blue-700",
      wikidata: "bg-purple-100 text-purple-700",
    };
    return (
      <Badge variant="outline" className={`text-xs ${colors[source] || ""}`}>
        {source}
      </Badge>
    );
  };

  const handleApply = () => {
    if (!enrichment || !enrichment.name) return;

    const guessedCity = enrichment.city ? guessCity(enrichment.city) : undefined;
    const gates = enrichment.sportTypes?.includes("f1")
      ? suggestGatesForCircuit({
          circuitId: "",
          circuitName: enrichment.name || "",
          country: enrichment.country || "",
          locality: enrichment.city || "",
          lat: enrichment.lat || 0,
          lng: enrichment.lng || 0,
        })
      : suggestGatesForStadium();

    onFillData({
      name: enrichment.name || "",
      city: guessedCity || enrichment.city || "",
      capacity: enrichment.capacity?.toString() || "",
      surface: enrichment.surface || "",
      description: enrichment.description || "",
      sportTypes: ((enrichment.sportTypes || []) as SportCategory[]).slice(0, 3),
      gates,
      lat: enrichment.lat || 0,
      lng: enrichment.lng || 0,
    });

    setAppliedResult(enrichment.name);
    toast.success(`Venue "${enrichment.name}" data applied!`);
  };

  const handleApplyFromSearch = (result: ApiSearchResult) => {
    const matchedCity = guessCity(result.city) || result.city;
    onFillData({
      name: result.name,
      city: matchedCity,
      capacity: result.capacity?.toString() || "",
      surface: "",
      description: `${result.name} in ${result.city}, ${result.country}`,
      sportTypes: [result.sport as SportCategory],
      gates: suggestGatesForStadium(),
      lat: 0,
      lng: 0,
    });
    setAppliedResult(result.name);
    toast.success(`"${result.name}" data applied!`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" /> Venue Data Lookup
        </CardTitle>
        <CardDescription>
          Search global venue databases (Ergast F1, TheSportsDB, Wikidata) to auto-fill details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search venue name (e.g. Wankhede, Monza, Eden Gardens)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching || !query.trim()}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {sources.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Sources: </span>
            {sources.map((s) => (
              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
            ))}
          </div>
        )}

        {enrichment && enrichment.name && (
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{enrichment.name}</span>
                {enrichment.source && sourceBadge(enrichment.source)}
              </div>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={appliedResult === enrichment.name}
              >
                {appliedResult === enrichment.name ? (
                  <><Check className="h-3 w-3 mr-1" /> Applied</>
                ) : (
                  "Apply Data"
                )}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {enrichment.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {enrichment.city}
                  {enrichment.country && `, ${enrichment.country}`}
                </div>
              )}
              {enrichment.capacity ? (
                <span>Capacity: {enrichment.capacity.toLocaleString()}</span>
              ) : null}
              {enrichment.sportTypes && enrichment.sportTypes.length > 0 && (
                <span>
                  Sports: {enrichment.sportTypes.map((s) => getSportEmoji(s as SportCategory)).join(" ")}
                </span>
              )}
            </div>
            {enrichment.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {enrichment.description}
              </p>
            )}
          </div>
        )}

        {results.length > 0 && !enrichment && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Search results:</p>
            {results.slice(0, 5).map((r) => (
              <div
                key={`${r.source}-${r.id}`}
                className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 cursor-pointer"
                onClick={() => handleApplyFromSearch(r)}
              >
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.city}, {r.country}
                    {r.capacity > 0 && ` · ${r.capacity.toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {sourceBadge(r.source)}
                  <span className="text-muted-foreground text-xs">
                    {r.sport !== "unknown" && getSportEmoji(r.sport as SportCategory)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!searching && !enrichment && results.length === 0 && sources.length === 0 && query && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No results found. Try a different search term.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
