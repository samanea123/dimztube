
"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export type VideoItem = { id: string; title: string; channel: string; thumbnail: string; };

export default function SearchBar({
  category = "semua",
  onSelect,
}: {
  category?: string;
  onSelect?: (v: VideoItem) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🔥 Fungsi ambil cache (sessionStorage)
  const getCache = (query: string, cat: string) => {
    try {
      const key = `search:${cat}:${query.toLowerCase()}`;
      const cached = sessionStorage.getItem(key);
      if (!cached) return null;
      const { data, ts } = JSON.parse(cached);
      // cache valid 15 menit
      if (Date.now() - ts < 15 * 60 * 1000) return data;
      sessionStorage.removeItem(key); // Hapus cache kadaluarsa
      return null;
    } catch {
      return null;
    }
  };

  // 🔥 Simpan cache
  const setCache = (query: string, cat: string, data: any) => {
    try {
      const key = `search:${cat}:${query.toLowerCase()}`;
      sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch (err) {
      console.warn("Cache gagal disimpan", err);
    }
  };


  const doSearch = async (query: string) => {
    if (!query.trim()) {
        setResults([]);
        return;
    };

    setError(null);
    
    // 💾 Cek cache dulu
    const cached = getCache(query, category);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = `/api/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        const items = json.items || [];
        setResults(items);
        setCache(query, category, items); // Simpan ke cache
      } else {
        setError(json.error || "Gagal mengambil hasil pencarian");
        setResults([]);
      }
    } catch {
      setError("Koneksi error. Periksa jaringan Anda.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if(q.trim()){
        debounceRef.current = window.setTimeout(() => doSearch(q), 500);
    } else {
        setResults([]);
        setError(null);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, category]);

  useEffect(() => {
    // Tiap ganti kategori, hapus hasil lama dan query di layar
    setResults([]);
    setQ("");
    setError(null);
  }, [category]);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder={`Cari video${category !== "Semua" ? ` dalam kategori ${category}`: ""}...`}
        className="w-full h-10 pl-10 pr-4 rounded-full border bg-background focus:bg-transparent focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {isFocused && (q.length > 0 || loading || error) && (
        <div className="absolute left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg max-h-96 overflow-auto z-50">
          {loading && (
             <div className="p-4 flex items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Memuat...</span>
            </div>
          )}
          {error && <div className="p-4 text-destructive text-center">{error}</div>}
          {!loading && !error && results.length > 0 && (
              <ul>
                {results.map((r) => (
                    <li key={r.id} onClick={() => { onSelect?.(r); setIsFocused(false); }}
                        className="p-2 flex items-center gap-3 hover:bg-muted cursor-pointer">
                    <div className="relative w-24 h-14 rounded-md overflow-hidden flex-shrink-0">
                        <Image src={r.thumbnail} alt={r.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-semibold truncate">{r.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.channel}</div>
                    </div>
                    </li>
                ))}
              </ul>
          )}
          {!loading && !error && results.length === 0 && q.length > 0 && (
            <div className="p-4 text-center text-muted-foreground">
                Tidak ada hasil untuk &quot;{q}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
