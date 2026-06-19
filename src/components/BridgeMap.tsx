'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Bridge, ResolvedStatus } from '@/lib/types';
import { getNextOpening, formatCountdown, slugify } from '@/lib/countdown';
import Link from 'next/link';

// Bridges coming from the enriched API carry a resolved `status`. Bridges built
// purely client-side may not, so it stays optional and we fall back to schedule.
type MapBridge = Bridge & { status?: ResolvedStatus };

function dot(color: string, size: number, pulse: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #0F2A5C;border-radius:50%;${
      pulse ? 'animation:pulse 1.5s infinite;' : ''
    }"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const ICONS = {
  upNow: dot('#DC2626', 20, true), // red, pulsing — span raised, cars blocked
  soon: dot('#F59E0B', 18, true), // amber, pulsing — opening soon
  idle: dot('#F59E0B', 14, false), // amber — default
  down: dot('#16A34A', 14, false), // green — confirmed passable
};

interface BridgeMapProps {
  bridges: MapBridge[];
  center?: [number, number];
  zoom?: number;
  singleBridge?: boolean;
}

export default function BridgeMap({ bridges, center = [26.45, -80.08], zoom = 9, singleBridge = false }: BridgeMapProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={singleBridge ? 'h-[300px] w-full rounded-lg' : 'h-[500px] w-full rounded-lg'}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {bridges.map((bridge) => {
        const status = bridge.status;
        const isLive = status && (status.source === 'fl511' || status.source === 'community');
        const isUpNow = status?.state === 'up';

        const next = getNextOpening(bridge.schedule);
        const diffMin = next ? (next.getTime() - Date.now()) / 60000 : Infinity;
        const openingSoon = diffMin <= 15 && diffMin > 0;

        let icon = ICONS.idle;
        if (isUpNow) icon = ICONS.upNow;
        else if (openingSoon) icon = ICONS.soon;
        else if (isLive && status?.state === 'down') icon = ICONS.down;

        return (
          <Marker key={bridge.id} position={[bridge.latitude, bridge.longitude]} icon={icon}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-[#0F2A5C]">{bridge.name}</p>
                <p className="text-gray-600">
                  {bridge.city}, {bridge.state}
                </p>

                {isUpNow ? (
                  <p className="mt-1 font-bold text-red-600">
                    🔴 UP NOW{isLive ? '' : ' (predicted)'}
                  </p>
                ) : isLive && status?.state === 'down' ? (
                  <p className="mt-1 font-semibold text-green-700">🟢 Passable now</p>
                ) : (
                  next && <p className="mt-1 font-semibold text-amber-600">{formatCountdown(next)}</p>
                )}

                {status && (
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {status.source === 'fl511'
                      ? 'Live · FL511'
                      : status.source === 'community'
                      ? 'Live · community'
                      : 'From schedule'}
                  </p>
                )}

                {!singleBridge && (
                  <Link href={`/bridges/${slugify(bridge.name)}`} className="text-blue-600 underline text-xs mt-1 block">
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
