
// src/app/api/search/route.ts
import { NextResponse } from "next/server";

const API_KEYS = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
  process.env.YOUTUBE_API_KEY_4,
  process.env.YOUTUBE_API_KEY_5,
].filter(Boolean);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();
  const cat = searchParams.get("category") || ""; // Match the client-side param
  const pageToken = searchParams.get("pageToken") || "";

  if (!query) return NextResponse.json({ items: [], nextPageToken: null });
  
  let searchQuery = query;
  const lowerCat = cat.toLowerCase();

  // Custom search query based on category
  if (lowerCat === 'lagu karaoke') {
    searchQuery = `${query} karaoke`;
  } else if (lowerCat === 'musik') {
    searchQuery = `${query} music`;
  } else if (lowerCat === 'film') {
    searchQuery = `${query} movie trailer`;
  } else if (lowerCat === 'game') {
      searchQuery = `${query} gameplay`;
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "24");
  url.searchParams.set("q", searchQuery);

  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  for (const key of API_KEYS) {
    if (!key) continue;
    
    url.searchParams.set("key", key);
    
    try {
      const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
      const data = await res.json();

      if (res.status === 200 && data?.items) {
        const results = data.items.map((item: any) => ({
          id: item.id?.videoId,
          title: item.snippet?.title,
          channel: item.snippet?.channelTitle,
          thumbnail: item.snippet?.thumbnails?.medium?.url,
        }));
        return NextResponse.json({ items: results, nextPageToken: data.nextPageToken });
      }

      if (data?.error?.errors?.[0]?.reason === "quotaExceeded") {
        console.warn(`API Key starting with ${key.substring(0,4)}... has exceeded its quota.`);
        continue;
      }
    } catch (err) {
      console.error("API key failed:", err);
      continue;
    }
  }

  return NextResponse.json(
    { error: "Semua API key quota-nya habis 😅. Coba lagi nanti ya!" },
    { status: 429 }
  );
}
