import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer, TileLayer, Marker, Polyline,
  useMap, CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const purpleIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#7c4fe0;border:3px solid #fff;
    box-shadow:0 0 12px rgba(124,79,224,0.8)
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const tealIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#2edbb0;border:3px solid #fff;
    box-shadow:0 0 12px rgba(46,219,176,0.8)
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const carIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6))">🚗</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface MapPoint { lat: number; lng: number; }

interface DispatchMapProps {
  center?: MapPoint;
  pickup?: MapPoint;
  dropoff?: MapPoint;
  driverLocation?: MapPoint | null;
  height?: string;
  onMapClick?: (latlng: MapPoint) => void;
}

// Re-centers map when center prop changes
function Recenter({ center }: { center: MapPoint }) {
  const map = useMap();
  useEffect(() => { map.setView([center.lat, center.lng], map.getZoom()); }, [center]);
  return null;
}

// Fetches OSRM route and draws it
function OSRMRoute({ pickup, dropoff }: { pickup: MapPoint; dropoff: MapPoint }) {
  const [route, setRoute] = useState<[number, number][]>([]);

  useEffect(() => {
    const url = `https://router.project-osrm.org/route/v1/driving/` +
      `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}` +
      `?overview=full&geometries=geojson`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const coords = data.routes?.[0]?.geometry?.coordinates as [number, number][];
        if (coords) setRoute(coords.map(([lng, lat]) => [lat, lng]));
      })
      .catch(() => {
        // Fallback: straight line
        setRoute([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]);
      });
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  if (!route.length) return null;

  return (
    <>
      {/* Teal glow line — matches the reference */}
      <Polyline
        positions={route}
        pathOptions={{ color: "#2edbb0", weight: 5, opacity: 0.9, lineCap: "round", lineJoin: "round" }}
      />
      <Polyline
        positions={route}
        pathOptions={{ color: "#7c4fe0", weight: 2, opacity: 0.5, lineCap: "round" }}
      />
    </>
  );
}

export default function DispatchMap({
  center,
  pickup,
  dropoff,
  driverLocation,
  height = "100%",
  onMapClick,
}: DispatchMapProps) {
  const defaultCenter: MapPoint = center ?? pickup ?? dropoff ?? { lat: -29.3167, lng: 27.4833 };

  return (
    <MapContainer
      center={[defaultCenter.lat, defaultCenter.lng]}
      zoom={14}
      style={{ width: "100%", height }}
      zoomControl={false}
      attributionControl={false}
      // @ts-expect-error - tap not in types but needed for mobile
      tap={false}
      {...(onMapClick
        ? {
            eventHandlers: {
              click: (e: L.LeafletMouseEvent) =>
                onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }),
            },
          }
        : {})}
    >
      {/* Dark tinted OSM tiles */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution=""
      />

      {center && <Recenter center={center} />}

      {pickup && dropoff && <OSRMRoute pickup={pickup} dropoff={dropoff} />}

      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]} icon={purpleIcon} />
      )}
      {dropoff && (
        <Marker position={[dropoff.lat, dropoff.lng]} icon={tealIcon} />
      )}
      {driverLocation && (
        <>
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={carIcon} />
          <CircleMarker
            center={[driverLocation.lat, driverLocation.lng]}
            radius={24}
            pathOptions={{ color: "#7c4fe0", fill: true, fillOpacity: 0.12, weight: 0 }}
          />
        </>
      )}
    </MapContainer>
  );
}
