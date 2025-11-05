// src/app/api/search/route.ts
import { NextResponse } from "next/server";

const KEYS = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
  process.env.YOUTUBE_API_KEY_4,
  process.env.YOUTUBE_API_KEY_5,
].filter(Boolean);

async function tryKey(key: string, q: string, cat?: string) {
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
  url.searchParams.set("q", q); // The main query
  url.searchParams.set("key", key);

  if (cat && topicIds[cat.toLowerCase()]) {
      url.searchParams.set("topicId", topicIds[cat.toLowerCase()]);
  }

  const res = await fetch(url.toString(), { method: "GET" });
  const data = await res.json();
  return { status: res.status, data };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const cat = searchParams.get("category") || ""; // Use 'category' to match client
  if (!q) return NextResponse.json({ error: "query empty" }, { status: 400 });

  let lastErr = null;
  for (const k of KEYS) {
    try {
      const { status, data } = await tryKey(k as string, q, cat);
      if (status === 200 && data && Array.isArray(data.items)) {
        const items = data.items.map((it: any) => ({
          id: it.id?.videoId || (it.id && it.id.videoId) || null,
          title: it.snippet?.title,
          channel: it.snippet?.channelTitle,
          thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url,
        }));
        return NextResponse.json({ items });
      } else {
        lastErr = data || { status };
        // If quotaExceeded, try next key
        continue;
      }
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  return NextResponse.json({ error: "All API keys failed", detail: lastErr }, { status: 502 });
}
