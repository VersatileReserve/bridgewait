import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resolveStatus, groupReportsByBridge } from '@/lib/status';
import { Bridge, BridgeReport, EnrichedBridge } from '@/lib/types';

// How far back to pull reports for live community consensus.
const REPORT_LOOKBACK_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius');

  const { data: bridges, error } = await supabase
    .from('bridges')
    .select('*')
    .eq('active', true)
    .order('latitude', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let results: Bridge[] = bridges || [];

  if (lat && lng && radius) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusMiles = parseFloat(radius);
    results = results.filter(
      (bridge) => haversine(userLat, userLng, bridge.latitude, bridge.longitude) <= radiusMiles
    );
  }

  // One query for all recent reports, then resolve each bridge locally.
  const cutoff = new Date(Date.now() - REPORT_LOOKBACK_MS).toISOString();
  const { data: reports } = await supabase
    .from('bridge_reports')
    .select('*')
    .gte('created_at', cutoff);
  const reportsByBridge = groupReportsByBridge((reports as BridgeReport[]) || []);

  const now = new Date();
  const enriched: EnrichedBridge[] = results.map((bridge) => {
    const status = resolveStatus({
      bridge,
      reports: reportsByBridge.get(bridge.id) || [],
      now,
    });
    return { ...bridge, status, nextOpening: status.nextOpening };
  });

  return NextResponse.json(enriched);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
