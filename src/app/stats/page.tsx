"use client";

import { useState } from "react";

interface Visit {
  timestamp: string;
  page: string;
  country: string;
  city: string;
  region: string;
}

export default function StatsPage() {
  const [password, setPassword] = useState("");
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/stats?password=${encodeURIComponent(password)}`);
    const data = await res.json() as { visits: Visit[]; total: number; error?: string };
    if (!res.ok) {
      setError("Wrong password");
    } else {
      setVisits(data.visits);
    }
    setLoading(false);
  }

  // Group by country+city
  const locationCounts = visits?.reduce<Record<string, number>>((acc, v) => {
    const key = `${v.city}, ${v.region}, ${v.country}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topLocations = Object.entries(locationCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  if (visits === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold mb-6">Stats</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none mb-4"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={load}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "Loading..." : "View Stats"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Stats</h1>
        <div className="text-neutral-400 text-sm">{visits.length} total visits</div>
      </div>

      {/* Top locations */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-4 text-neutral-200">Top Locations</h2>
        {topLocations.length === 0 ? (
          <p className="text-neutral-500 text-sm">No visits yet</p>
        ) : (
          <div className="space-y-2">
            {topLocations.map(([location, count]) => (
              <div key={location} className="flex items-center justify-between">
                <span className="text-neutral-300 text-sm">{location}</span>
                <span className="text-white font-medium text-sm">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent visits */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="font-semibold mb-4 text-neutral-200">Recent Visits</h2>
        {visits.length === 0 ? (
          <p className="text-neutral-500 text-sm">No visits yet</p>
        ) : (
          <div className="space-y-3">
            {visits.slice(0, 50).map((v, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-neutral-800 pb-3 last:border-0 last:pb-0">
                <div>
                  <span className="text-white">{v.city}, {v.country}</span>
                  <span className="text-neutral-500 ml-2">{v.page}</span>
                </div>
                <span className="text-neutral-500 text-xs">
                  {new Date(v.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
