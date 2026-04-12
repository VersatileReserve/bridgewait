'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Bridge } from '@/lib/types';
import { getNextOpenings, slugify } from '@/lib/countdown';
import CountdownBadge from '@/components/CountdownBadge';
import { useParams } from 'next/navigation';

const BridgeMap = dynamic(() => import('@/components/BridgeMap'), { ssr: false });

export default function BridgeDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [bridge, setBridge] = useState<Bridge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('bridges')
      .select('*')
      .eq('active', true)
      .then(({ data }) => {
        const found = (data || []).find((b: Bridge) => slugify(b.name) === slug);
        setBridge(found || null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-gray-500">Loading bridge details...</p>
      </div>
    );
  }

  if (!bridge) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-[#0F2A5C]">Bridge not found</h1>
      </div>
    );
  }

  const nextOpenings = getNextOpenings(bridge.schedule, 5);
  const hasSchedule = bridge.schedule?.[0]?.times?.length > 0;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0F2A5C] mb-1">{bridge.name}</h1>
      <p className="text-gray-500 mb-6">{bridge.city}, {bridge.state}</p>

      <BridgeMap
        bridges={[bridge]}
        center={[bridge.latitude, bridge.longitude]}
        zoom={14}
        singleBridge
      />

      {/* Next 5 Openings */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-[#0F2A5C] mb-4">Next Openings</h2>
        {hasSchedule ? (
          <div className="space-y-2">
            {nextOpenings.map((opening, i) => (
              <div key={i} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                <span className="text-gray-700">
                  {opening.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                  at {opening.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
                <CountdownBadge target={opening} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-amber-600 font-semibold">This bridge opens on demand — no set schedule.</p>
        )}
      </div>

      {/* Schedule Table */}
      {hasSchedule && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-[#0F2A5C] mb-4">Weekly Schedule</h2>
          <p className="text-sm text-gray-500 mb-3">{bridge.schedule[0]?.note}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-[#0F2A5C] text-white">
                  <th className="p-2 text-left">Day</th>
                  <th className="p-2 text-left">Opening Times</th>
                </tr>
              </thead>
              <tbody>
                {dayNames.map((day) => {
                  const shortDay = day.slice(0, 3);
                  const entry = bridge.schedule.find((s: { days: string[]; times: string[] }) =>
                    s.days.includes(shortDay)
                  );
                  const times = entry?.times || [];
                  return (
                    <tr key={day} className="border-t border-gray-100">
                      <td className="p-2 font-medium text-[#0F2A5C]">{day}</td>
                      <td className="p-2 text-gray-600">
                        {times.length > 0
                          ? times.map((t: string) => {
                              const [h, m] = t.split(':').map(Number);
                              const d = new Date();
                              d.setHours(h, m);
                              return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                            }).join(', ')
                          : 'Opens on demand'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
