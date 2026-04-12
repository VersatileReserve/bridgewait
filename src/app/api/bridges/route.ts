import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getNextOpening } from '@/lib/countdown';

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

  let results = bridges || [];

  if (lat && lng && radius) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusMiles = parseFloat(radius);

    results = results.filter((bridge) => {
      const dist = haversine(userLat, userLng, bridge.latitude, bridge.longitude);
      return dist <= radiusMiles;
    });
  }

  const enriched = results.map((bridge) => ({
    ...bridge,
    nextOpening: getNextOpening(bridge.schedule)?.toISOString() || null,
  }));

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
