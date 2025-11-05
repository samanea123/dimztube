// src/app/api/search/route.ts
import { NextResponse } from "next/server";

const API_KEYS = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
  process.env.YOUTUBE_API_KEY_4,
  process.env.YOUTUBE_API_KEY_5,
].filter(Boolean);

async function fetchWithKey(key: string, q: string, category?: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", q);
  url.searchParams.set("key", key);

  // 🔥 Tambah logika kategori (opsional)
  if (category) {
    switch (category.toLowerCase()) {
      case "musik":
      case "music":
        url.searchParams.set("topicId", "/m/04rlf"); // YouTube Music
        break;
      case "game":
      case "gaming":
        url.searchParams.set("topicId", "/m/0bzvm2"); // Gaming
        break;
      case "film":
      case "movies":
        url.searchParams.set("topicId", "/m/02vxn"); // Movies
        break;
      case "berita":
      case "news":
        url.searchParams.set("topicId", "/m/09s1f"); // News & Politics
        break;
      case "olahraga":
      case "sports":
        url.searchParams.set("topicId", "/m/06ntj"); // Sports
        break;
      default:
        // kalau gak ada topicId, tetap global
        break;
    }
  }

  const res = await fetch(url.toString());
  const data = await res.json();
  return { status: res.status, data };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const category = searchParams.get("category") || "";
  if (!q) return NextResponse.json({ error: "query empty" }, { status: 400 });

  let lastError: any = null;
  for (const key of API_KEYS) {
    try {
      const { status, data } = await fetchWithKey(key as string, q, category);
      if (status === 200 && data && data.items) {
        const items = data.items.map((it: any) => ({
          id: it.id?.videoId,
          title: it.snippet?.title,
          channel: it.snippet?.channelTitle,
          thumbnail: it.snippet?.thumbnails?.medium?.url,
        }));
        return NextResponse.json({ items });
      }
      lastError = { status, data };
      continue;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  return NextResponse.json({ error: "All API keys failed", detail: lastError }, { status: 502 });
}
