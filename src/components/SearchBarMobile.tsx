"use client";
import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "./ui/button";

export default function SearchBarMobile() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="ghost" size="icon" className="sm:hidden">
        <Search className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-start p-3 gap-2">
      <Search className="mt-2 h-5 w-5 text-muted-foreground" />
      <input
        ref={inputRef}
        placeholder="Cari di DimzTube..."
        className="flex-1 bg-transparent border-b focus:border-primary outline-none transition-colors"
      />
      <Button onClick={() => setOpen(false)} variant="ghost" size="icon">
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
