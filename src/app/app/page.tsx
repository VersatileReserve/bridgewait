'use client';

import { useState } from 'react';

export default function AppPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmitted(true);
      setMessage(data.message);
    } else {
      setError(data.error || 'Something went wrong');
    }
  }

  const features = [
    { icon: '📍', title: 'Live Map', desc: 'See all nearby drawbridges on an interactive map with real-time status.' },
    { icon: '⏱️', title: 'Countdown Timers', desc: 'Know exactly how long until the next bridge opening, down to the second.' },
    { icon: '🔔', title: 'Push Notifications', desc: 'Get alerted before a bridge near you opens so you can plan your route.' },
    { icon: '⭐', title: 'Favorite Bridges', desc: 'Save your daily commute bridges and get personalized alerts.' },
    { icon: '🗓️', title: 'Full Schedules', desc: 'Browse complete weekly opening schedules for every drawbridge.' },
    { icon: '📊', title: 'Traffic Insights', desc: 'See historical data on bridge openings and average wait times.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0F2A5C] text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">BridgeWait App</h1>
        <p className="text-xl text-white/80 mb-2">Coming soon for iOS and Android</p>
        <p className="text-white/60">Never miss a bridge opening again</p>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-[#0F2A5C] mb-8 text-center">App Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="border border-gray-200 rounded-lg p-5 text-center hover:shadow-md transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-[#0F2A5C] mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Waitlist */}
      <section className="bg-amber-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#0F2A5C] mb-4">Join the Waitlist</h2>
          <p className="text-gray-600 mb-6">Be the first to know when BridgeWait launches.</p>
          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-700 font-semibold">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-400"
                required
              />
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition"
              >
                Join Waitlist
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
