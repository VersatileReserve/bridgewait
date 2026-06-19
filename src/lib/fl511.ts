// ---------------------------------------------------------------------------
// fl511.ts — ingest adapter for Florida 511 official drawbridge status
// ---------------------------------------------------------------------------
// FL511 (https://fl511.com/list/bridge) publishes an OFFICIAL, real-time
// "Drawbridge Crossings" list. The page itself is a JavaScript-rendered table;
// the data is loaded from an internal endpoint on the CARS "Connect.Know.Go."
// 511 platform.
//
// !! ACTION REQUIRED BEFORE THIS GOES LIVE !!
// The exact data endpoint + payload shape must be confirmed from the browser
// Network tab on https://fl511.com/list/bridge (filter: XHR/Fetch). It is
// almost certainly a POST/GET returning JSON rows. Drop the confirmed URL into
// FL511_ENDPOINT and adjust normalizeRow() to the real field names. Until then
// fetchFL511Rows() returns [] so the rest of the app degrades gracefully to
// community + schedule sources.
//
// This adapter is designed to run SERVER-SIDE on a schedule (Vercel Cron, e.g.
// every 60s), upserting results into the bridges.live_* columns. It never runs
// in the browser.
// ---------------------------------------------------------------------------

import { BridgeState } from './types';

const FL511_ENDPOINT = process.env.FL511_ENDPOINT || ''; // e.g. https://fl511.com/List/GetData/Bridge

// Raw row as returned by FL511 (field names are placeholders until confirmed).
interface FL511Row {
  name?: string;
  location?: string;
  roadway?: string;
  direction?: string;
  county?: string;
  status?: string; // e.g. "Open"/"Closed"/"Raised"/"Lowered" — confirm vocabulary
  latitude?: number;
  longitude?: number;
}

// A normalized observation, ready to upsert against a BridgeWait bridge.
export interface FL511Observation {
  rawName: string;
  county: string | null;
  state: BridgeState;
  latitude: number | null;
  longitude: number | null;
  observedAt: string; // ISO
}

// Map FL511's status wording onto our driver-facing vocabulary.
// FL511 status text is for DRIVERS already ("bridge is open/closed to traffic"),
// which is the INVERSE of mariner language. Confirm exact strings from the feed.
export function fl511StateToBridgeState(raw: string | undefined): BridgeState {
  if (!raw) return 'unknown';
  const s = raw.toLowerCase();
  // road blocked / span raised
  if (s.includes('raised') || s.includes('opening') || s.includes('open to navigation') || s.includes('up')) {
    return 'up';
  }
  // road passable / span down
  if (s.includes('lowered') || s.includes('closed to navigation') || s.includes('down') || s.includes('normal')) {
    return 'down';
  }
  return 'unknown';
}

export function normalizeRow(row: FL511Row, observedAt: string): FL511Observation {
  return {
    rawName: (row.name || '').trim(),
    county: row.county ? row.county.trim() : null,
    state: fl511StateToBridgeState(row.status),
    latitude: typeof row.latitude === 'number' ? row.latitude : null,
    longitude: typeof row.longitude === 'number' ? row.longitude : null,
    observedAt,
  };
}

// Fetch + normalize. Returns [] (not an error) when the endpoint is unset, so
// the ingest job is safe to deploy before the endpoint is wired.
export async function fetchFL511Rows(): Promise<FL511Observation[]> {
  if (!FL511_ENDPOINT) return [];
  const observedAt = new Date().toISOString();
  try {
    const res = await fetch(FL511_ENDPOINT, {
      headers: { Accept: 'application/json' },
      // FL511 endpoints have historically expected a referer/origin; add here
      // if the confirmed endpoint requires it.
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    // The CARS platform commonly wraps rows under `data` or `aaData`. Confirm.
    const rows: FL511Row[] = Array.isArray(json) ? json : json.data || json.aaData || [];
    return rows.map((r) => normalizeRow(r, observedAt)).filter((o) => o.rawName.length > 0);
  } catch {
    return [];
  }
}

// Match an FL511 observation to one of our seeded bridges. Prefer coordinate
// proximity (robust to name spelling); fall back to fuzzy name contains.
export function matchObservationToBridge<T extends { id: string; name: string; latitude: number; longitude: number }>(
  obs: FL511Observation,
  bridges: T[]
): T | null {
  // 1. coordinate match within ~150m
  if (obs.latitude != null && obs.longitude != null) {
    let best: T | null = null;
    let bestMeters = Infinity;
    for (const b of bridges) {
      const m = haversineMeters(obs.latitude, obs.longitude, b.latitude, b.longitude);
      if (m < bestMeters) {
        bestMeters = m;
        best = b;
      }
    }
    if (best && bestMeters <= 150) return best;
  }
  // 2. fuzzy name match
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const target = norm(obs.rawName);
  if (!target) return null;
  for (const b of bridges) {
    const name = norm(b.name);
    if (name === target || name.includes(target) || target.includes(name)) return b;
  }
  return null;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
