// src/app/api/search/route.ts
import { NextResponse } from "next/server";

const API_KEYS = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
  process.env.YOUTUBE_API_KEY_4,
  process.env.YOUTUBE_API_KEY_5,
].filter(Boolean);

async function fetchYouTube(q: string, key: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "24");
  url.searchParams.set("q", q);
  url.searchParams.set("key", key as string);

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const data = await res.json();
  return { status: res.status, data };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();
  const cat = searchParams.get("category") || ""; // Match the client-side param

  if (!query) return NextResponse.json({ items: [] });
  
  // Topic ID mapping for more accurate category search
  const topicIds: { [key: string]: string } = {
    'musik': '/m/04rlf',
    'music': '/m/04rlf',
    'game': '/m/0bzvm2',
    'gaming': '/m/0bzvm2',
    'film': '/m/02vxn',
    'movies': '/m/02vxn',
    'berita': '/m/09s1f',
    'news': '/m/09s1f',
    'olahraga': '/m/06ntj',
    'sports': '/m/06ntj',
  };

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("q", query);

  if (cat && topicIds[cat.toLowerCase()]) {
      url.searchParams.set("topicId", topicIds[cat.toLowerCase()]);
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
        return NextResponse.json({ items: results });
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
