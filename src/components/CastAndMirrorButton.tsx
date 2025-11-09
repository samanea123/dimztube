'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cast, MonitorSmartphone, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startMiracast } from '@/lib/miracast';

export default function CastAndMirrorButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);
  
  const handleToggle = () => {
      setIsMenuOpen(!isMenuOpen);
  }

  return (
    <div className="relative" ref={containerRef}>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-primary"
          aria-label="Cast to device"
          onClick={handleToggle}
        >
          <Cast className="h-5 w-5" />
        </Button>
      
        {isMenuOpen && (
             <div className="absolute top-full right-0 mt-2 w-72 bg-card rounded-xl shadow-lg border p-2 z-[9999] animate-fadeIn">
                <div className="space-y-2 mb-2 p-2">
                    <h4 className="font-medium leading-none">Sambungkan ke Layar</h4>
                    <p className="text-sm text-muted-foreground">
                      Pilih mode untuk menampilkan konten ke layar lain.
                    </p>
                </div>
                <div className="grid gap-1">
                    <button
                        className="w-full text-left flex items-center px-3 py-2 rounded-lg hover:bg-muted"
                        onClick={() => {
                          startMiracast('cast');
                          setIsMenuOpen(false);
                        }}
                    >
                       <Cast className="mr-2 h-4 w-4" />
                        Cast Video (Miracast)
                    </button>
                    
                    <button
                        className="w-full text-left flex items-center px-3 py-2 rounded-lg hover:bg-muted"
                        onClick={() => {
                          startMiracast('mirror');
                          setIsMenuOpen(false);
                        }}
                    >
                       <MonitorSmartphone className="mr-2 h-4 w-4" />
                       Mirror Layar (WebRTC)
                    </button>

                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsMenuOpen(false)}>Batal</Button>
                </div>
             </div>
        )}
    </div>
  );
}
