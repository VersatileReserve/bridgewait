import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { BridgeState } from '@/lib/types';

// ---------------------------------------------------------------------------
// POST /api/report  — submit a crowd-sourced bridge observation
//   body: { bridgeId: string, state: 'up' | 'down', note?: string }
// GET  /api/report?bridgeId=...  — recent reports for one bridge (last hour)
// ---------------------------------------------------------------------------
// This is the source that works EVERYWHERE, including the ~80% of Florida
// drawbridges FL511 doesn't instrument. resolveStatus() turns recent reports
// into live "community" status when there's consensus.
// ---------------------------------------------------------------------------

const VALID_STATES: BridgeState[] = ['up', 'down'];
const RECENT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  let body: { bridgeId?: string; state?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { bridgeId, state, note } = body;

  if (!bridgeId || typeof bridgeId !== 'string') {
    return NextResponse.json({ error: 'bridgeId is required' }, { status: 400 });
  }
  if (!state || !VALID_STATES.includes(state as BridgeState)) {
    return NextResponse.json({ error: "state must be 'up' or 'down'" }, { status: 400 });
  }
  if (note && (typeof note !== 'string' || note.length > 280)) {
    return NextResponse.json({ error: 'note must be a string under 280 chars' }, { status: 400 });
  }

  // Confirm the bridge exists and is active before accepting a report.
  const { data: bridge, error: bridgeErr } = await supabase
    .from('bridges')
    .select('id')
    .eq('id', bridgeId)
    .eq('active', true)
    .single();

  if (bridgeErr || !bridge) {
    return NextResponse.json({ error: 'Bridge not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('bridge_reports')
    .insert({ bridge_id: bridgeId, state, note: note ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, report: data }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bridgeId = searchParams.get('bridgeId');

  if (!bridgeId) {
    return NextResponse.json({ error: 'bridgeId is required' }, { status: 400 });
  }

  const cutoff = new Date(Date.now() - RECENT_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from('bridge_reports')
    .select('*')
    .eq('bridge_id', bridgeId)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
