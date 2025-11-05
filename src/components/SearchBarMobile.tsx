"use client";
import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";

type VideoItem = { id: string; title: string; channel: string; thumbnail: string; };

export default function SearchBarMobile({ 
  category = "semua",
  onSelect 
}: { 
  category?: string,
  onSelect?: (v: VideoItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  let timer: NodeJS.Timeout;

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // === AUTO-SUGGEST ===
  const fetchSuggestions = async (text: string) => {
    if (!text) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(text)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (val: string) => {
    setQuery(val);
    clearTimeout(timer);
    timer = setTimeout(() => fetchSuggestions(val), 400);
  };
  
  const handleSelectSuggestion = (suggestion: string) => {
     // This is a placeholder. In a real app, you'd trigger a search.
     // For now, we will just open the YouTube search results in a new tab.
     window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(suggestion)}`, "_blank");
  }

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    // We can reuse the suggestion list to show full search results
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`);
      const data = await res.json();
      // Since the search API returns full video items, we need a different state or a type guard
      // For simplicity, we'll just log it for now. A full implementation would show these results.
      console.log(data.items);
      if (onSelect && data.items.length > 0) {
        onSelect(data.items[0]); // Select the first result
        setOpen(false);
      }

    } catch (err) {
      console.error("Gagal mencari video:", err);
    } finally {
      setLoading(false);
    }
  }


  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="ghost"
        size="icon"
        className="sm:hidden"
        aria-label="Buka Pencarian"
      >
        <Search className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background p-3 animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="flex items-center mb-2">
            <Search className="text-muted-foreground" size={22} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Cari di DimzTube..."
              className="flex-1 mx-2 bg-transparent border-0 focus:ring-0 focus:outline-none text-base"
            />
            <Button
              onClick={() => setOpen(false)}
              variant="ghost"
              size="icon"
              type="button"
            >
              <X size={22} />
            </Button>
          </form>

          {/* === LIST AUTO-SUGGEST === */}
          {suggestions.length > 0 && (
            <div className="bg-muted/50 rounded-lg shadow-inner">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="px-3 py-2 border-b border-border hover:bg-muted cursor-pointer flex items-center"
                  onClick={() => handleSelectSuggestion(s)}
                >
                  <Search size={16} className="mr-3 text-muted-foreground" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          {loading && (
             <div className="p-4 flex items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Memuat...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
