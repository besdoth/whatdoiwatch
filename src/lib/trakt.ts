const TRAKT_API = "https://api.trakt.tv";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

function traktHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "trakt-api-version": "2",
    "trakt-api-key": process.env.TRAKT_CLIENT_ID!,
    "Content-Type": "application/json",
  };
}

export interface WatchedItem {
  type: "show" | "movie";
  title: string;
  year: number | null;
  genres: string[];
  rating: number | null;
  plays: number;
}

export async function getWatchHistory(
  accessToken: string,
  username: string
): Promise<WatchedItem[]> {
  const [showsRes, moviesRes] = await Promise.all([
    fetch(`${TRAKT_API}/users/${username}/watched/shows?extended=noseasons`, {
      headers: traktHeaders(accessToken),
    }),
    fetch(`${TRAKT_API}/users/${username}/watched/movies`, {
      headers: traktHeaders(accessToken),
    }),
  ]);

  const [shows, movies] = await Promise.all([
    showsRes.json(),
    moviesRes.json(),
  ]);

  const showItems: WatchedItem[] = (Array.isArray(shows) ? shows : [])
    .slice(0, 30)
    .map((s: any) => ({
      type: "show" as const,
      title: s.show?.title ?? "Unknown",
      year: s.show?.year ?? null,
      genres: s.show?.genres ?? [],
      rating: null,
      plays: s.plays ?? 1,
    }));

  const movieItems: WatchedItem[] = (Array.isArray(movies) ? movies : [])
    .slice(0, 20)
    .map((m: any) => ({
      type: "movie" as const,
      title: m.movie?.title ?? "Unknown",
      year: m.movie?.year ?? null,
      genres: m.movie?.genres ?? [],
      rating: null,
      plays: m.plays ?? 1,
    }));

  return [...showItems, ...movieItems];
}

export async function getUserRatings(
  accessToken: string,
  username: string
): Promise<Record<string, number>> {
  const [showRatings, movieRatings] = await Promise.all([
    fetch(`${TRAKT_API}/users/${username}/ratings/shows`, {
      headers: traktHeaders(accessToken),
    }).then((r) => r.json()),
    fetch(`${TRAKT_API}/users/${username}/ratings/movies`, {
      headers: traktHeaders(accessToken),
    }).then((r) => r.json()),
  ]);

  const ratings: Record<string, number> = {};
  for (const item of [...(showRatings ?? []), ...(movieRatings ?? [])]) {
    const title = item.show?.title ?? item.movie?.title;
    if (title) ratings[title] = item.rating;
  }
  return ratings;
}
