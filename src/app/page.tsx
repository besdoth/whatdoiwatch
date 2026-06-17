"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import RecommendationCard from "@/components/RecommendationCard";
import MoodPicker from "@/components/MoodPicker";

export interface Recommendation {
  title: string;
  year: number;
  type: "show" | "movie";
  reason: string;
  genres: string[];
  vibe: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [mood, setMood] = useState("");
  const [customMood, setCustomMood] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeMood = mood === "custom" ? customMood : mood;

  async function getRecommendations() {
    if (!activeMood.trim()) return;
    setLoading(true);
    setError("");
    setRecommendations([]);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: activeMood }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setRecommendations(data.recommendations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold mb-3 tracking-tight">
            What Do I Watch?
          </h1>
          <p className="text-neutral-400 text-lg mb-10">
            Connect your Trakt account and tell us your mood. We&apos;ll figure out
            the rest.
          </p>
          <button
            onClick={() => signIn("trakt")}
            className="bg-red-600 hover:bg-red-500 transition-colors text-white font-semibold px-8 py-3 rounded-xl text-lg"
          >
            Connect with Trakt
          </button>
          <p className="text-neutral-600 text-sm mt-6">
            Your watch history stays private — it&apos;s only used to generate
            recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            What Do I Watch?
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Hey {session.user?.name || session.traktUsername} — let&apos;s find
            something good.
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="text-neutral-500 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Mood Picker */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-neutral-200">
          What&apos;s the vibe right now?
        </h2>
        <MoodPicker selected={mood} onSelect={setMood} />

        {mood === "custom" && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="e.g. something emotional but not too heavy..."
              value={customMood}
              onChange={(e) => setCustomMood(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && getRecommendations()}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Go button */}
      <button
        onClick={getRecommendations}
        disabled={!activeMood.trim() || loading}
        className="w-full bg-white text-black font-bold py-3 rounded-xl text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors mb-10"
      >
        {loading ? "Finding something good..." : "Find me something to watch"}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-4 mb-8">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-neutral-900 rounded-2xl p-5 animate-pulse h-48"
            />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && recommendations.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-4 text-neutral-300">
            Here&apos;s what you should watch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>
          <button
            onClick={getRecommendations}
            className="mt-8 w-full border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 font-medium py-3 rounded-xl transition-colors"
          >
            Give me different options
          </button>
        </>
      )}
    </div>
  );
}
