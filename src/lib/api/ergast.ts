import { fetchApi } from "./client";
import type { Circuit, ApiSearchResult } from "./types";

const ERGAST_BASE = "https://ergast.com/api/f1";

interface ErgastCircuit {
  circuitId: string;
  circuitName: string;
  url: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
}

interface ErgastMrData {
  xmlns: string;
  series: string;
  url: string;
  limit: string;
  offset: string;
  total: string;
  CircuitTable: {
    Circuits: ErgastCircuit[];
  };
}

interface ErgastResponse {
  MRData: ErgastMrData;
}

export async function getAllCircuits(): Promise<Circuit[]> {
  const data = await fetchApi<ErgastResponse>(
    `${ERGAST_BASE}/circuits.json?limit=80`,
    {},
    "ergast-circuits"
  );

  const circuits = data.MRData.CircuitTable?.Circuits || [];
  return circuits.map((c) => ({
    circuitId: c.circuitId,
    circuitName: c.circuitName,
    country: c.Location.country,
    locality: c.Location.locality,
    lat: parseFloat(c.Location.lat),
    lng: parseFloat(c.Location.long),
  }));
}

export async function getCircuitById(circuitId: string): Promise<Circuit | null> {
  const all = await getAllCircuits();
  return all.find((c) => c.circuitId === circuitId) || null;
}

export async function searchCircuits(query: string): Promise<ApiSearchResult[]> {
  const circuits = await getAllCircuits();
  const q = query.toLowerCase();
  return circuits
    .filter(
      (c) =>
        c.circuitName.toLowerCase().includes(q) ||
        c.locality.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    )
    .map((c) => ({
      id: c.circuitId,
      name: c.circuitName,
      sport: "f1",
      city: c.locality,
      country: c.country,
      capacity: 0,
      source: "ergast" as const,
    }));
}

export async function searchCircuitsByCountry(country: string): Promise<Circuit[]> {
  const circuits = await getAllCircuits();
  return circuits.filter(
    (c) => c.country.toLowerCase() === country.toLowerCase()
  );
}

export function getCircuitVenueImage(circuitId: string): string {
  const mapping: Record<string, string> = {
    monza: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Monza_track_map.svg/1200px-Monza_track_map.svg.png",
    spa: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Spa-Francorchamps_of_Belgium.svg/1200px-Spa-Francorchamps_of_Belgium.svg.png",
    silverstone: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Silverstone_Circuit_2020.svg/1200px-Silverstone_Circuit_2020.svg.png",
    monaco: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Monte_Carlo_Formula_1_track_map.svg/1200px-Monte_Carlo_Formula_1_track_map.svg.png",
    suzuka: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Suzuka_circuit_map--2005.svg/1200px-Suzuka_circuit_map--2005.svg.png",
    interlagos: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Aut%C3%B3dromo_Jos%C3%A9_Carlos_Pace.svg/1200px-Aut%C3%B3dromo_Jos%C3%A9_Carlos_Pace.svg.png",
    bahrain: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Bahrain_International_Circuit--Grand_Prix_Layout_v2.svg/1200px-Bahrain_International_Circuit--Grand_Prix_Layout_v2.svg.png",
    yas_marina: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Yas_Marina_Circuit_2021.svg/1200px-Yas_Marina_Circuit_2021.svg.png",
    buddh: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Buddh_International_Circuit.svg/1200px-Buddh_International_Circuit.svg.png",
  };
  return mapping[circuitId] || "";
}
