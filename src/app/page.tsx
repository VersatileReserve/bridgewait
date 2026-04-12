'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Bridge } from '@/lib/types';
import { getNextOpening, slugify } from '@/lib/countdown';
import CountdownBadge from '@/components/CountdownBadge';

const BridgeMap = dynamic(() => import('@/components/BridgeMap'), { ssr: false });

export default function Home() {
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('bridges')
      .select('*')
      .eq('active', true)
      .order('latitude', { ascending: false })
      .then(({ data }) => {
        setBridges(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0F2A5C] text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Never get stuck at a drawbridge again
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
          Live schedules, countdown timers, and alerts for Florida drawbridges
        </p>
      </section>

      {/* Map */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Loading map...</p>
          </div>
        ) : (
          <BridgeMap bridges={bridges} />
        )}
      </section>

      {/* Bridge Cards */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-[#0F2A5C] mb-6">All Bridges</h2>
        {loading ? (
          <p className="text-gray-500">Loading bridges...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bridges.map((bridge) => {
              const next = getNextOpening(bridge.schedule);
              const hasSchedule = bridge.schedule?.[0]?.times?.length > 0;
              return (
                <Link
                  key={bridge.id}
                  href={`/bridges/${slugify(bridge.name)}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition hover:border-amber-400"
                >
                  <h3 className="font-bold text-[#0F2A5C] text-lg">{bridge.name}</h3>
                  <p className="text-gray-500 text-sm">{bridge.city}, {bridge.state}</p>
                  <div className="mt-2">
                    {hasSchedule && next ? (
                      <>
                        <p className="text-xs text-gray-400">Next opening</p>
                        <CountdownBadge target={next} />
                      </>
                    ) : (
                      <p className="text-sm text-amber-600 font-semibold">Opens on demand</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-amber-50 py-12 text-center">
        <h2 className="text-2xl font-bold text-[#0F2A5C] mb-4">Get the BridgeWait App</h2>
        <p className="text-gray-600 mb-6">Push notifications, live countdowns, and per-bridge alerts.</p>
        <Link
          href="/app"
          className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-lg transition"
        >
          Get the App
        </Link>
      </section>
    </div>
  );
}
