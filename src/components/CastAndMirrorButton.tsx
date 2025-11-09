'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cast, MonitorSmartphone, X } from 'lucide-react';
import { useCastManager } from '@/lib/useCastManager';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import CastDeviceSelector from './CastDeviceSelector';
import { startMiracast } from '@/lib/miracast';

export default function CastAndMirrorButton() {
  const { status, mode, stopSession, startAutoCast } = useCastManager();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isActive = status === 'connected';

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
      if (isActive) {
          stopSession();
      } else {
          setIsMenuOpen(!isMenuOpen);
      }
  }
  
  const handleStartCast = () => {
    setIsMenuOpen(false);
    setIsSelectorOpen(true);
  }

  if (isActive) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => stopSession()}
        className={cn(
          'hover:text-white text-white bg-sky-500 hover:bg-sky-600'
        )}
        aria-label="Stop Session"
        title={mode === 'mirror' ? 'Hentikan Mirror' : 'Hentikan Cast'}
      >
        <X className="h-5 w-5" />
      </Button>
    );
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
                    <h4 className="font-medium leading-none">Sambungkan ke perangkat</h4>
                    <p className="text-sm text-muted-foreground">
                    Pilih mode untuk menampilkan konten ke layar lebar.
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
                        Sambungkan ke TV (Miracast)
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
        
        <CastDeviceSelector
          isOpen={isSelectorOpen}
          onOpenChange={setIsSelectorOpen}
          onSelectDevice={() => {
              setIsSelectorOpen(false);
              startAutoCast();
          }}
        />
    </div>
  );
}
