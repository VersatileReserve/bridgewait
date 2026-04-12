'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bridge } from '@/lib/types';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [loading, setLoading] = useState(false);

  // Add bridge form
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('FL');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newTimes, setNewTimes] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      loadBridges();
    } else {
      setAuthError('Invalid password');
    }
  }

  async function loadBridges() {
    setLoading(true);
    const { data } = await supabase
      .from('bridges')
      .select('*')
      .order('name');
    setBridges(data || []);
    setLoading(false);
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('bridges').update({ active: !active }).eq('id', id);
    loadBridges();
  }

  async function handleAddBridge(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    const times = newTimes
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const schedule = [
      {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        times,
        note: newNote || (times.length > 0 ? 'Scheduled openings' : 'Opens on demand'),
      },
    ];

    const { error } = await supabase.from('bridges').insert({
      name: newName,
      city: newCity,
      state: newState,
      latitude: parseFloat(newLat),
      longitude: parseFloat(newLng),
      schedule,
    });

    if (error) {
      setAddError(error.message);
    } else {
      setAddSuccess(`${newName} added!`);
      setNewName('');
      setNewCity('');
      setNewLat('');
      setNewLng('');
      setNewNote('');
      setNewTimes('');
      loadBridges();
    }
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-24">
        <h1 className="text-2xl font-bold text-[#0F2A5C] mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          {authError && <p className="text-red-600 text-sm">{authError}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-400"
            required
          />
          <button
            type="submit"
            className="w-full bg-[#0F2A5C] hover:bg-[#1a3d7a] text-white font-bold py-3 rounded-lg transition"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0F2A5C] mb-8">Admin Panel</h1>

      {/* Add Bridge */}
      <div className="border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-[#0F2A5C] mb-4">Add Bridge</h2>
        {addError && <p className="text-red-600 text-sm mb-3">{addError}</p>}
        {addSuccess && <p className="text-green-600 text-sm mb-3">{addSuccess}</p>}
        <form onSubmit={handleAddBridge} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bridge Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={newLat}
              onChange={(e) => setNewLat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={newLng}
              onChange={(e) => setNewLng(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Note</label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Opens on the hour and half-hour"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opening Times (comma-separated, 24hr format)
            </label>
            <input
              type="text"
              value={newTimes}
              onChange={(e) => setNewTimes(e.target.value)}
              placeholder="07:00, 07:30, 08:00, 08:30..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Add Bridge
            </button>
          </div>
        </form>
      </div>

      {/* Bridge List */}
      <h2 className="text-xl font-bold text-[#0F2A5C] mb-4">All Bridges ({bridges.length})</h2>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {bridges.map((bridge) => (
            <div
              key={bridge.id}
              className={`flex items-center justify-between border rounded-lg p-4 ${
                bridge.active ? 'border-gray-200' : 'border-red-200 bg-red-50'
              }`}
            >
              <div>
                <p className="font-bold text-[#0F2A5C]">{bridge.name}</p>
                <p className="text-sm text-gray-500">{bridge.city}, {bridge.state}</p>
              </div>
              <button
                onClick={() => toggleActive(bridge.id, bridge.active)}
                className={`text-sm font-medium px-4 py-1 rounded-full transition ${
                  bridge.active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {bridge.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
