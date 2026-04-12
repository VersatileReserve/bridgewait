import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getNextOpening } from '@/lib/countdown';

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

  return NextResponse.json({
    ...bridge,
    nextOpening: getNextOpening(bridge.schedule)?.toISOString() || null,
  });
}
