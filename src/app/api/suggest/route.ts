import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (!q) return NextResponse.json({ suggestions: [] });

  try {
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    return NextResponse.json({ suggestions: data[1] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ suggestions: [] });
  }
}
