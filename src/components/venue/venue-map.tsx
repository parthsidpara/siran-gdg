"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Gate, CongestionLevel } from "@/lib/types";
import { getCongestionColor, getCongestionLabel, getCongestionEmoji } from "@/lib/crowd";

interface VenueMapProps {
  center: [number, number];
  gates: Gate[];
  gateLoad?: Record<string, CongestionLevel>;
  assignedGate?: string;
  className?: string;
}

function createIcon(color: string, isAssigned: boolean) {
  const size = isAssigned ? 20 : 14;
  return L.divIcon({
    className: "",
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color}; border: 2px solid white;
      border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.3);
      ${isAssigned ? "animation: pulse 1.5s infinite;" : ""}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function VenueMap({ center, gates, gateLoad, assignedGate, className }: VenueMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-64 bg-muted rounded-lg flex items-center justify-center ${className || ""}`}>
        <p className="text-muted-foreground text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <div className={`h-64 rounded-lg overflow-hidden ${className || ""}`}>
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} />
        {gates.map((gate) => {
          const load = gateLoad?.[gate.id] || "low";
          const color = getCongestionColor(load).replace("bg-", "");
          const isAssigned = assignedGate === gate.id;
          return (
            <Marker
              key={gate.id}
              position={[center[0] + (gate.x - 50) * 0.002, center[1] + (gate.y - 50) * 0.002]}
              icon={createIcon(color, isAssigned)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{gate.label}</p>
                  <p>Zone: {gate.zone}</p>
                  <p>
                    Status: {getCongestionEmoji(load)} {getCongestionLabel(load)}
                    {isAssigned && <span className="ml-1 font-bold text-primary">(Your Gate)</span>}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
