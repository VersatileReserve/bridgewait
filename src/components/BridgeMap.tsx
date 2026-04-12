'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Bridge } from '@/lib/types';
import { getNextOpening, formatCountdown } from '@/lib/countdown';
import Link from 'next/link';
import { slugify } from '@/lib/countdown';

const defaultIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#F59E0B;border:2px solid #0F2A5C;border-radius:50%;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const pulsingIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#F59E0B;border:2px solid #0F2A5C;border-radius:50%;animation:pulse 1.5s infinite;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface BridgeMapProps {
  bridges: Bridge[];
  center?: [number, number];
  zoom?: number;
  singleBridge?: boolean;
}

export default function BridgeMap({ bridges, center = [26.45, -80.08], zoom = 9, singleBridge = false }: BridgeMapProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={singleBridge ? "h-[300px] w-full rounded-lg" : "h-[500px] w-full rounded-lg"}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {bridges.map((bridge) => {
        const next = getNextOpening(bridge.schedule);
        const diffMin = next ? (next.getTime() - Date.now()) / 60000 : Infinity;
        const isPulsing = diffMin <= 15 && diffMin > 0;

        return (
          <Marker
            key={bridge.id}
            position={[bridge.latitude, bridge.longitude]}
            icon={isPulsing ? pulsingIcon : defaultIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-[#0F2A5C]">{bridge.name}</p>
                <p className="text-gray-600">{bridge.city}, {bridge.state}</p>
                {next && (
                  <p className="mt-1 font-semibold text-amber-600">
                    {formatCountdown(next)}
                  </p>
                )}
                {!singleBridge && (
                  <Link
                    href={`/bridges/${slugify(bridge.name)}`}
                    className="text-blue-600 underline text-xs mt-1 block"
                  >
                    View details
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
