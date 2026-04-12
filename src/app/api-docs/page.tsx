'use client';

import { useState } from 'react';

export default function ApiDocsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [useCase, setUseCase] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/api-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, use_case: useCase }),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error || 'Something went wrong');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0F2A5C] mb-2">BridgeWait API</h1>
      <p className="text-gray-500 mb-8">
        Access real-time drawbridge schedules and opening data for your applications.
      </p>

      {/* Endpoints */}
      <div className="space-y-8 mb-12">
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">GET</span>
            <code className="text-[#0F2A5C] font-mono font-bold">/api/bridges</code>
          </div>
          <p className="text-gray-600 text-sm mb-4">Returns all active bridges with their next opening time.</p>
          <div className="bg-gray-50 rounded p-4 overflow-x-auto">
            <p className="text-xs text-gray-400 mb-2">JavaScript</p>
            <pre className="text-sm text-gray-800">{`const res = await fetch('https://bridgewait.com/api/bridges');
const bridges = await res.json();
console.log(bridges[0].name, bridges[0].nextOpening);`}</pre>
          </div>
          <div className="bg-gray-50 rounded p-4 overflow-x-auto mt-3">
            <p className="text-xs text-gray-400 mb-2">Python</p>
            <pre className="text-sm text-gray-800">{`import requests
bridges = requests.get('https://bridgewait.com/api/bridges').json()
print(bridges[0]['name'], bridges[0]['nextOpening'])`}</pre>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">GET</span>
            <code className="text-[#0F2A5C] font-mono font-bold">/api/bridges/[id]</code>
          </div>
          <p className="text-gray-600 text-sm mb-4">Returns a single bridge by its UUID.</p>
          <div className="bg-gray-50 rounded p-4 overflow-x-auto">
            <p className="text-xs text-gray-400 mb-2">JavaScript</p>
            <pre className="text-sm text-gray-800">{`const res = await fetch('https://bridgewait.com/api/bridges/BRIDGE_UUID');
const bridge = await res.json();
console.log(bridge.name, bridge.schedule);`}</pre>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">GET</span>
            <code className="text-[#0F2A5C] font-mono font-bold">/api/bridges/nearby?lat=X&lng=Y&radius=10</code>
          </div>
          <p className="text-gray-600 text-sm mb-4">Returns bridges within a radius (in miles) of a given coordinate. Sorted by distance.</p>
          <div className="bg-gray-50 rounded p-4 overflow-x-auto">
            <p className="text-xs text-gray-400 mb-2">JavaScript</p>
            <pre className="text-sm text-gray-800">{`const res = await fetch(
  'https://bridgewait.com/api/bridges/nearby?lat=26.45&lng=-80.08&radius=5'
);
const nearby = await res.json();
nearby.forEach(b => console.log(b.name, b.distance.toFixed(1) + ' mi'));`}</pre>
          </div>
          <div className="bg-gray-50 rounded p-4 overflow-x-auto mt-3">
            <p className="text-xs text-gray-400 mb-2">Python</p>
            <pre className="text-sm text-gray-800">{`import requests
nearby = requests.get(
    'https://bridgewait.com/api/bridges/nearby',
    params={'lat': 26.45, 'lng': -80.08, 'radius': 5}
).json()
for b in nearby:
    print(f"{b['name']} - {b['distance']:.1f} mi")`}</pre>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <h2 className="text-2xl font-bold text-[#0F2A5C] mb-6">Pricing</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="border border-gray-200 rounded-lg p-6 text-center">
          <h3 className="font-bold text-lg text-[#0F2A5C]">Free</h3>
          <p className="text-3xl font-bold text-[#0F2A5C] my-3">$0</p>
          <p className="text-gray-500 text-sm">100 requests/day</p>
          <p className="text-gray-500 text-sm">All endpoints</p>
          <p className="text-gray-500 text-sm">Community support</p>
        </div>
        <div className="border-2 border-amber-400 rounded-lg p-6 text-center relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">
            Popular
          </span>
          <h3 className="font-bold text-lg text-[#0F2A5C]">Developer</h3>
          <p className="text-3xl font-bold text-[#0F2A5C] my-3">$29<span className="text-sm font-normal text-gray-400">/mo</span></p>
          <p className="text-gray-500 text-sm">10,000 requests/day</p>
          <p className="text-gray-500 text-sm">All endpoints</p>
          <p className="text-gray-500 text-sm">Email support</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-6 text-center">
          <h3 className="font-bold text-lg text-[#0F2A5C]">Commercial</h3>
          <p className="text-3xl font-bold text-[#0F2A5C] my-3">$99<span className="text-sm font-normal text-gray-400">/mo</span></p>
          <p className="text-gray-500 text-sm">Unlimited requests</p>
          <p className="text-gray-500 text-sm">All endpoints</p>
          <p className="text-gray-500 text-sm">Priority support</p>
        </div>
      </div>

      {/* Request Access Form */}
      <h2 className="text-2xl font-bold text-[#0F2A5C] mb-4">Request API Access</h2>
      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-700 font-semibold">Your API access request has been submitted! We&apos;ll be in touch.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Use Case</label>
            <textarea
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              rows={3}
              placeholder="Describe how you plan to use the API..."
            />
          </div>
          <button
            type="submit"
            className="bg-[#0F2A5C] hover:bg-[#1a3d7a] text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Request Access
          </button>
        </form>
      )}
    </div>
  );
}
