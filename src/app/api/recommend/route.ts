export const runtime = "edge";

import { auth } from "@/auth";
import { getWatchHistory, getUserRatings } from "@/lib/trakt";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken || !session?.traktUsername) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { mood } = await req.json();
  if (!mood) {
    return NextResponse.json({ error: "Mood is required" }, { status: 400 });
  }

  const [history, ratings] = await Promise.all([
    getWatchHistory(session.accessToken, session.traktUsername),
    getUserRatings(session.accessToken, session.traktUsername),
  ]);

  // Merge ratings into history
  const enriched = history.map((item) => ({
    ...item,
    rating: ratings[item.title] ?? null,
  }));

  const topRated = enriched
    .filter((i) => i.rating && i.rating >= 8)
    .slice(0, 15)
    .map((i) => `${i.title} (${i.type}, rated ${i.rating}/10)`);

  const recentShows = enriched
    .filter((i) => i.type === "show")
    .slice(0, 10)
    .map((i) => `${i.title} (${i.plays} plays)`);

  const recentMovies = enriched
    .filter((i) => i.type === "movie")
    .slice(0, 10)
    .map((i) => `${i.title} (${i.plays} plays)`);

  const prompt = `You are a personal TV show and movie recommendation engine. Based on this person's watch history and current mood, recommend 6 things to watch.

CURRENT MOOD: "${mood}"

THEIR WATCH HISTORY:
Top rated: ${topRated.length ? topRated.join(", ") : "none yet"}
Shows watched: ${recentShows.length ? recentShows.join(", ") : "none yet"}
Movies watched: ${recentMovies.length ? recentMovies.join(", ") : "none yet"}

Return ONLY a JSON array of 6 recommendations. Each item must have:
- "title": string (exact show/movie name)
- "year": number
- "type": "show" or "movie"
- "reason": string (1-2 sentences, why it fits their mood AND taste based on what they've watched — be specific and personal)
- "genres": string array (2-4 genres)
- "vibe": string (3-5 word mood description, e.g. "dark and suspenseful thriller")

Mix shows and movies. Prioritize variety. Don't recommend things they've already watched unless it's a clear "comfort rewatch" situation based on their mood.

Return raw JSON only, no markdown, no explanation.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  let recommendations;
  try {
    recommendations = JSON.parse(text);
  } catch {
    // Try to extract JSON if Claude added any wrapping text
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      recommendations = JSON.parse(match[0]);
    } else {
      return NextResponse.json(
        { error: "Failed to parse recommendations" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ recommendations });
}
