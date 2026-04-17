import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Orange pickup pin
const fromIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#f97316;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(249,115,22,0.5)
  "></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});

// Teal destination pin
const toIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#fff;border:3px solid #1a6b7a;
    box-shadow:0 2px 8px rgba(13,79,92,0.3)
  "></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});

// Car icon
const carIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px;height:32px;border-radius:50%;
    background:#0d4f5c;border:2px solid #fff;
    box-shadow:0 3px 12px rgba(13,79,92,0.4);
    display:flex;align-items:center;justify-content:center;
    font-size:16px;
  ">🚗</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

interface MapPoint { lat: number; lng: number; }
interface Props {
  center?: MapPoint; pickup?: MapPoint; dropoff?: MapPoint;
  driverLocation?: MapPoint | null; height?: string;
  onMapClick?: (p: MapPoint) => void;
}

function Recenter({ center }: { center: MapPoint }) {
  const map = useMap();
  useEffect(() => { map.setView([center.lat, center.lng], map.getZoom()); }, [center]);
  return null;
}

function OSRMRoute({ pickup, dropoff }: { pickup: MapPoint; dropoff: MapPoint }) {
  const [route, setRoute] = useState<[number, number][]>([]);
  useEffect(() => {
    fetch(`https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(d => {
        const c = d.routes?.[0]?.geometry?.coordinates as [number, number][];
        if (c) setRoute(c.map(([lng, lat]) => [lat, lng]));
      })
      .catch(() => setRoute([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]));
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  if (!route.length) return null;
  return (
    <>
      <Polyline positions={route} pathOptions={{ color: "#0d4f5c", weight: 5, opacity: 0.8, lineCap: "round", lineJoin: "round" }} />
      <Polyline positions={route} pathOptions={{ color: "#f97316", weight: 3, opacity: 0.6, lineCap: "round", dashArray: "8 6" }} />
    </>
  );
}

export default function DispatchMap({ center, pickup, dropoff, driverLocation, height = "100%", onMapClick }: Props) {
  const def = center ?? pickup ?? dropoff ?? { lat: -29.3167, lng: 27.4833 };
  return (
    <MapContainer
      center={[def.lat, def.lng]} zoom={14}
      style={{ width: "100%", height }}
      zoomControl={false} attributionControl={false}
    >
      {/* Light OpenStreetMap tiles — matches the reference */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
      {center && <Recenter center={center} />}
      {pickup && dropoff && <OSRMRoute pickup={pickup} dropoff={dropoff} />}
      {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={fromIcon} />}
      {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={toIcon} />}
      {driverLocation && (
        <>
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={carIcon} />
          <CircleMarker center={[driverLocation.lat, driverLocation.lng]} radius={28}
            pathOptions={{ color: "#f97316", fill: true, fillOpacity: 0.1, weight: 0 }} />
        </>
      )}
    </MapContainer>
  );
}
