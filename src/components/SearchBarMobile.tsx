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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // === AUTO-SUGGEST ===
  const fetchSuggestions = async (text: string) => {
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      // NOTE: This endpoint doesn't exist yet as per the prompt.
      // The user will likely ask to create it in the next step.
      // For now, let's use the main search endpoint to show something.
      const res = await fetch(`/api/search?q=${encodeURIComponent(text)}&category=${encodeURIComponent(category)}`);
      const data = await res.json();
      // We'll map video titles to suggestions for this demo
      const videoTitles = (data.items || []).map((item: any) => item.title);
      setSuggestions(videoTitles.slice(0, 5)); 
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (val: string) => {
    setQuery(val);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };
  
  const handleSelectSuggestion = (suggestion: string) => {
      // For now, let's just perform a search with the suggestion
      // and select the first result.
      setQuery(suggestion);
      setSuggestions([]);
      
      // A more direct search could be better.
      fetch(`/api/search?q=${encodeURIComponent(suggestion)}&category=${encodeURIComponent(category)}`)
        .then(res => res.json())
        .then(data => {
            if(data.items && data.items.length > 0 && onSelect) {
                onSelect(data.items[0]);
                setOpen(false);
                setQuery("");
            }
        });
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
          <div className="flex items-center p-3 gap-2 border-b">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Cari di DimzTube..."
              className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-base"
            />
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
                <span>Memuat saran...</span>
              </div>
            )}
             {suggestions.length > 0 && (
                <div className="py-2">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center"
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <Search size={16} className="mr-4 text-muted-foreground" />
                      <span className="font-medium">{s}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}
    </>
  );
}
