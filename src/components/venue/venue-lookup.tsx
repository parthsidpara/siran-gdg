"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fullVenueLookup } from "@/lib/api/venues";
import { suggestGatesForCircuit, suggestGatesForStadium, guessCity } from "@/lib/api/venues";
import type { VenueEnrichment, ApiSearchResult } from "@/lib/api/types";
import type { SportCategory, Gate } from "@/lib/types";
import { Search, Database, Loader2, Check, MapPin } from "lucide-react";

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
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" /> Venue Data Lookup
        </h2>
        <p className="text-xs text-muted-foreground">
          Search global venue databases (Ergast F1, TheSportsDB, Wikidata) to auto-fill details
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search venue name (e.g. Wankhede, Monza, Eden Gardens)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="h-9"
        />
        <Button onClick={handleSearch} disabled={searching || !query.trim()} size="sm" className="h-9">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {sources.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Sources:</span>
          {sources.map((s) => (
            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
          ))}
        </div>
      )}

      {enrichment && enrichment.name && (
        <div className="rounded-xl border border-border/50 bg-muted/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{enrichment.name}</span>
              {enrichment.source && sourceBadge(enrichment.source)}
            </div>
            <Button
              size="sm"
              className="h-9"
              onClick={handleApply}
              disabled={appliedResult === enrichment.name}
            >
              {appliedResult === enrichment.name ? (
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Applied</span>
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
              <span>Sports: {enrichment.sportTypes.join(", ")}</span>
            )}
          </div>
          {enrichment.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {enrichment.description}
            </p>
          )}
        </div>
      )}

      {results.length > 0 && !enrichment && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Search results:</p>
          {results.slice(0, 5).map((r) => (
            <div
              key={`${r.source}-${r.id}`}
              className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
              onClick={() => handleApplyFromSearch(r)}
            >
              <div>
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.city}, {r.country}
                  {r.capacity > 0 && ` &middot; ${r.capacity.toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sourceBadge(r.source)}
                <span className="text-muted-foreground text-xs">
                  {r.sport !== "unknown" && r.sport}
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
    </div>
  );
}
