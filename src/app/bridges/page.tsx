import { supabase } from '@/lib/supabase';
import { Bridge } from '@/lib/types';
import { slugify } from '@/lib/countdown';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Drawbridges — BridgeWait',
  description: 'Browse all Florida drawbridge schedules. Live opening times for every drawbridge from Jupiter to Hallandale Beach.',
};

export const revalidate = 3600;

export default async function BridgesPage() {
  const { data: bridges } = await supabase
    .from('bridges')
    .select('*')
    .eq('active', true)
    .order('latitude', { ascending: false });

  const bridgeList = (bridges || []) as Bridge[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0F2A5C] mb-2">Florida Drawbridges</h1>
      <p className="text-gray-500 mb-8">{bridgeList.length} bridges with live schedules</p>
      <div className="space-y-3">
        {bridgeList.map((bridge) => (
          <Link
            key={bridge.id}
            href={`/bridges/${slugify(bridge.name)}`}
            className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition hover:border-amber-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#0F2A5C]">{bridge.name}</h2>
                <p className="text-sm text-gray-500">{bridge.city}, {bridge.state}</p>
              </div>
              <span className="text-amber-500 text-sm font-medium">
                {bridge.schedule?.[0]?.note || 'Schedule available'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
