import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resolveStatus } from '@/lib/status';
import { BridgeReport, EnrichedBridge } from '@/lib/types';

const REPORT_LOOKBACK_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: bridge, error } = await supabase
    .from('bridges')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !bridge) {
    return NextResponse.json({ error: 'Bridge not found' }, { status: 404 });
  }

  const cutoff = new Date(Date.now() - REPORT_LOOKBACK_MS).toISOString();
  const { data: reports } = await supabase
    .from('bridge_reports')
    .select('*')
    .eq('bridge_id', id)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  const status = resolveStatus({
    bridge,
    reports: (reports as BridgeReport[]) || [],
  });

  const enriched: EnrichedBridge = { ...bridge, status, nextOpening: status.nextOpening };
  return NextResponse.json(enriched);
}
