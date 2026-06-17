export const runtime = "edge";

import { getSession } from "@/lib/session";
import { getWatchHistory, getUserRatings } from "@/lib/trakt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.accessToken || !session?.username) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { mood } = await req.json() as { mood: string };
  if (!mood) {
    return NextResponse.json({ error: "Mood is required" }, { status: 400 });
  }

  const [history, ratings] = await Promise.all([
    getWatchHistory(session.accessToken, session.username),
    getUserRatings(session.accessToken, session.username),
  ]);

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

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: `AI API error ${res.status}: ${body}` },
      { status: 500 }
    );
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  const text = data.choices[0]?.message?.content ?? "";

  let recommendations;
  try {
    recommendations = JSON.parse(text);
  } catch {
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
