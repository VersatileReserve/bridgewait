import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchFL511Rows, matchObservationToBridge } from '@/lib/fl511';
import { Bridge } from '@/lib/types';

// ---------------------------------------------------------------------------
// GET /api/cron/fl511 — scheduled FL511 ingest (Vercel Cron, see vercel.json)
// ---------------------------------------------------------------------------
// Pulls the official FL511 drawbridge list, matches each row to a seeded
// bridge, and writes the result into bridges.live_state / live_source /
// live_updated_at. resolveStatus() then treats those as high-trust while fresh.
//
// Protected by CRON_SECRET so only Vercel Cron (or an authorized caller) can
// trigger it. While FL511_ENDPOINT is unset, fetchFL511Rows() returns [] and
// this is a safe no-op.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const observations = await fetchFL511Rows();
  if (observations.length === 0) {
    return NextResponse.json({ ok: true, ingested: 0, note: 'No rows (FL511_ENDPOINT unset or empty feed)' });
  }

  const { data: bridges, error } = await supabaseAdmin
    .from('bridges')
    .select('id, name, latitude, longitude')
    .eq('active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const candidates = (bridges as Pick<Bridge, 'id' | 'name' | 'latitude' | 'longitude'>[]) || [];
  let matched = 0;

  for (const obs of observations) {
    if (obs.state === 'unknown') continue;
    const bridge = matchObservationToBridge(obs, candidates);
    if (!bridge) continue;
    const { error: upErr } = await supabaseAdmin
      .from('bridges')
      .update({
        live_state: obs.state,
        live_source: 'fl511',
        live_updated_at: obs.observedAt,
      })
      .eq('id', bridge.id);
    if (!upErr) matched += 1;
  }

  return NextResponse.json({ ok: true, ingested: observations.length, matched });
}
