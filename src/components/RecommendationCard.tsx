"use client";

import { Recommendation } from "@/app/page";

interface Props {
  rec: Recommendation;
}

const TYPE_COLORS = {
  show: "bg-blue-900/50 text-blue-300 border-blue-800",
  movie: "bg-purple-900/50 text-purple-300 border-purple-800",
};

export default function RecommendationCard({ rec }: Props) {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    rec.title + " " + rec.year + " " + rec.type
  )}`;

  return (
    <a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-5 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight text-white group-hover:text-neutral-100 truncate">
            {rec.title}
          </h3>
          <span className="text-neutral-500 text-sm">{rec.year}</span>
        </div>
        <span
          className={`ml-3 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[rec.type]}`}
        >
          {rec.type}
        </span>
      </div>

      <p className="text-neutral-400 text-sm leading-relaxed mb-4 line-clamp-3">
        {rec.reason}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {rec.genres.slice(0, 3).map((genre) => (
          <span
            key={genre}
            className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full"
          >
            {genre}
          </span>
        ))}
      </div>

      <div className="mt-3 text-xs text-neutral-600 italic">
        {rec.vibe}
      </div>
    </a>
  );
}
