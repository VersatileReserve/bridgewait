// ---------------------------------------------------------------------------
// BridgeWait core types
// ---------------------------------------------------------------------------
// Status vocabulary is DRIVER-FACING, not mariner-facing. For a driver:
//   'up'      -> span is raised, cars are blocked / waiting
//   'down'    -> span is lowered, road is passable
//   'unknown' -> we have no trustworthy live signal right now
// (Note: a bridge that is "open to boats" === span UP === 'up' for us.)
// ---------------------------------------------------------------------------

export type BridgeState = 'up' | 'down' | 'unknown';

export type StatusSource = 'fl511' | 'community' | 'schedule' | 'none';

export type Confidence = 'high' | 'medium' | 'low';

export interface ScheduleEntry {
  days: string[];
  times: string[];
  note?: string;
}

export interface Bridge {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  schedule: ScheduleEntry[];
  active: boolean;
  created_at: string;

  // ----- live status layer (optional; populated by ingest + reports) -----
  // These are written by the FL511 ingest job. They are the *raw* last-known
  // live signal for this bridge; resolveStatus() decides whether they are
  // still fresh enough to trust.
  live_state?: BridgeState | null;
  live_source?: StatusSource | null;
  live_updated_at?: string | null; // ISO timestamp of last live observation
}

export interface BridgeReport {
  id: string;
  bridge_id: string;
  state: Exclude<BridgeState, 'unknown'>; // a human reports up or down, never "unknown"
  note: string | null;
  created_at: string;
}

// What resolveStatus() returns: a single unified read on a bridge right now,
// regardless of which source it came from.
export interface ResolvedStatus {
  state: BridgeState;
  source: StatusSource;
  confidence: Confidence;
  since: string | null; // ISO: when this observation was made/started
  nextOpening: string | null; // ISO of next scheduled opening
  nextOpenings: string[]; // ISO list of upcoming scheduled openings
}

// The shape the API returns to clients: the bridge plus its resolved status.
// `nextOpening` is also hoisted to the top level for backwards-compatibility
// with the original schedule-only API.
export interface EnrichedBridge extends Bridge {
  status: ResolvedStatus;
  nextOpening: string | null;
  distance?: number; // miles, only present on nearby queries
}
