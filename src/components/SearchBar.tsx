
"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Cache functions
  const getCache = (query: string, cat: string) => {
    try {
      const key = `search:${cat}:${query.toLowerCase()}`;
      const cached = sessionStorage.getItem(key);
      if (!cached) return null;
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < 15 * 60 * 1000) return data;
      sessionStorage.removeItem(key);
      return null;
    } catch {
      return null;
    }
  };

  const setCache = (query: string, cat: string, data: any) => {
    try {
      const key = `search:${cat}:${query.toLowerCase()}`;
      sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch (err) {
      console.warn("Cache failed to save", err);
    }
  };

  const doSearch = async (query: string) => {
    if (!query.trim()) {
        setResults([]);
        return;
    };

    setError(null);
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
        setCache(query, category, items);
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
  
  useEffect(() => {
      if (isMobileOpen && mobileInputRef.current) {
          mobileInputRef.current.focus();
      }
  }, [isMobileOpen]);

  const showResults = (isFocused || isMobileOpen) && (q.length > 0 || loading || error);

  const handleSelect = (video: VideoItem) => {
    onSelect?.(video);
    setIsFocused(false);
    setIsMobileOpen(false);
    setQ('');
    setResults([]);
  };

  return (
    <div className="relative flex w-full justify-end sm:justify-center" ref={containerRef}>
       {/* Mobile search button */}
      <Button variant="ghost" size="icon" className="sm:hidden flex-shrink-0" onClick={() => setIsMobileOpen(true)}>
          <Search className="h-5 w-5" />
      </Button>

      {/* Desktop Search Input */}
      <div className="hidden sm:flex relative w-full items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={`Cari di DimzTube...`}
          className="flex h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-sm md:text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
        />
         {showResults && (
            <div className="absolute left-0 right-0 top-12 bg-card border rounded-lg shadow-lg max-h-96 overflow-auto z-50">
              {/* Result list here */}
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
                        <li key={r.id} onClick={() => handleSelect(r)}
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

       {/* Mobile Search Overlay */}
      {isMobileOpen && (
          <>
            <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"></div>
            <div className="fixed top-0 left-0 right-0 p-3 bg-background z-50 flex items-center gap-2 shadow-md sm:hidden">
                 <input
                    ref={mobileInputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={`Cari di DimzTube...`}
                    className="flex h-10 w-full rounded-full border border-input bg-transparent px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                    <X className="h-5 w-5" />
                </Button>
            </div>
             {showResults && (
                <div className="fixed left-0 right-0 top-16 bg-card max-h-[70vh] overflow-auto z-50 sm:hidden">
                    {/* The same result list logic */}
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
                                <li key={r.id} onClick={() => handleSelect(r)}
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
          </>
      )}
    </div>
  );
}
