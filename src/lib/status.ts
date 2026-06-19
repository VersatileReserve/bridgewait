// ---------------------------------------------------------------------------
// status.ts — the source-agnostic status resolver
// ---------------------------------------------------------------------------
// This is the spine of BridgeWait. Every consumer (web API, future mobile app,
// public API) asks ONE question: "what is this bridge doing right now, and how
// much should I trust it?" resolveStatus() answers it by merging, in priority
// order:
//
//   1. FL511 official live status   (highest trust, if fresh)
//   2. Community crowd reports       (if we have recent consensus)
//   3. Coast Guard schedule          (prediction fallback, always available)
//
// Adding a new source later (e.g. AIS vessel radar) means adding ONE branch
// here — nothing else in the app needs to change.
// ---------------------------------------------------------------------------

import { Bridge, BridgeReport, ResolvedStatus, BridgeState } from './types';
import { getNextOpening, getNextOpenings } from './countdown';

// --- Tunable trust windows ------------------------------------------------
// How long an FL511 observation stays "fresh" before we stop trusting it.
const FL511_FRESH_MS = 6 * 60 * 1000; // 6 minutes
// How recent a community report must be to count toward live consensus.
const COMMUNITY_WINDOW_MS = 12 * 60 * 1000; // 12 minutes
// Minimum reports in-window before community status is allowed to "win".
const MIN_COMMUNITY_REPORTS = 2;
// How long after a scheduled opening time we assume the span may still be up.
const SCHEDULE_OPENING_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export interface ResolveInput {
  bridge: Bridge;
  reports?: BridgeReport[]; // recent reports for THIS bridge (already filtered by bridge_id)
  now?: Date;
}

export function resolveStatus({ bridge, reports = [], now = new Date() }: ResolveInput): ResolvedStatus {
  const nowMs = now.getTime();
  const nextOpeningDate = getNextOpening(bridge.schedule);
  const nextOpenings = getNextOpenings(bridge.schedule, 4).map((d) => d.toISOString());
  const scheduleBase = {
    nextOpening: nextOpeningDate ? nextOpeningDate.toISOString() : null,
    nextOpenings,
  };

  // --- 1. FL511 official live status (if fresh) ---------------------------
  if (
    bridge.live_source === 'fl511' &&
    bridge.live_state &&
    bridge.live_state !== 'unknown' &&
    bridge.live_updated_at &&
    nowMs - new Date(bridge.live_updated_at).getTime() <= FL511_FRESH_MS
  ) {
    return {
      state: bridge.live_state,
      source: 'fl511',
      confidence: 'high',
      since: bridge.live_updated_at,
      ...scheduleBase,
    };
  }

  // --- 2. Community consensus from recent reports -------------------------
  const fresh = reports
    .filter((r) => nowMs - new Date(r.created_at).getTime() <= COMMUNITY_WINDOW_MS)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (fresh.length >= MIN_COMMUNITY_REPORTS) {
    const ups = fresh.filter((r) => r.state === 'up').length;
    const downs = fresh.filter((r) => r.state === 'down').length;
    if (ups !== downs) {
      const winner: BridgeState = ups > downs ? 'up' : 'down';
      const agree = Math.max(ups, downs);
      // Confidence scales with how many people agree and how lopsided it is.
      const confidence = agree >= 4 && Math.min(ups, downs) === 0 ? 'high' : 'medium';
      return {
        state: winner,
        source: 'community',
        confidence,
        since: fresh.find((r) => r.state === winner)?.created_at ?? fresh[0].created_at,
        ...scheduleBase,
      };
    }
  }

  // --- 3. Schedule-based prediction (always available) --------------------
  // If we're sitting inside a predicted opening window, the span is probably
  // up. Otherwise the road is probably passable. Both are LOW confidence: the
  // schedule tells us when boats *may* request an opening, not ground truth.
  if (nextOpeningDate) {
    // Was there a scheduled opening in the very recent past?
    const recentOpenings = getNextOpenings(bridge.schedule, 8)
      .map((d) => d.getTime())
      .filter((t) => t <= nowMs && nowMs - t <= SCHEDULE_OPENING_WINDOW_MS);
    if (recentOpenings.length > 0) {
      return {
        state: 'up',
        source: 'schedule',
        confidence: 'low',
        since: new Date(Math.max(...recentOpenings)).toISOString(),
        ...scheduleBase,
      };
    }
    return {
      state: 'down',
      source: 'schedule',
      confidence: 'low',
      since: null,
      ...scheduleBase,
    };
  }

  // --- 4. Nothing to go on ------------------------------------------------
  return {
    state: 'unknown',
    source: 'none',
    confidence: 'low',
    since: null,
    ...scheduleBase,
  };
}

// Group a flat list of reports by bridge_id so the API can resolve many
// bridges from a single DB query.
export function groupReportsByBridge(reports: BridgeReport[]): Map<string, BridgeReport[]> {
  const map = new Map<string, BridgeReport[]>();
  for (const r of reports) {
    const arr = map.get(r.bridge_id);
    if (arr) arr.push(r);
    else map.set(r.bridge_id, [r]);
  }
  return map;
}
