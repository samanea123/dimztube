"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Impor tipe VideoItem dari SearchBar desktop untuk konsistensi
import type { VideoItem } from "./SearchBar";

export default function SearchBarMobile({
  category = "semua",
  onSelect,
}: {
  category?: string;
  onSelect?: (v: VideoItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`);
      const data = await res.json();
      if (res.ok) {
        setResults(data.items || []);
      } else {
        setError(data.error || "Gagal mencari video");
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
      console.error("Gagal mencari video:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if(query) {
        debounceRef.current = window.setTimeout(() => {
            handleSearch(query);
        }, 500);
    } else {
        setResults([]);
        setError(null);
    }
    return () => {
        if(debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category]);
  
  useEffect(() => {
    // Reset query and results when category changes
    setQuery("");
    setResults([]);
    setError(null);
  }, [category]);


  const handleSelect = (video: VideoItem) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    onSelect?.(video);
  }

  return (
    <>
      {/* Tombol search (muncul saat tertutup) */}
      <Button
        onClick={() => setOpen(true)}
        variant="ghost"
        size="icon"
        className="sm:hidden"
        aria-label="Buka Pencarian"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Overlay pencarian fullscreen */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background animate-fadeIn flex flex-col">
          <div className="flex items-start p-3 gap-2 border-b">
             <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="flex-1 flex items-center gap-2">
                <Search className="mt-0 h-5 w-5 text-muted-foreground" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Cari di DimzTube...`}
                    className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-base"
                />
             </form>
            <Button
              onClick={() => setOpen(false)}
              variant="ghost"
              size="icon"
              aria-label="Tutup Pencarian"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
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
            {!loading && !error && results.length === 0 && query.length > 2 && (
              <div className="p-4 text-center text-muted-foreground">
                Tidak ada hasil untuk &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
