// src/app/page.tsx (Next.js app router)
'use client';

import YouTubeWithCast from '@/components/YouTubeWithCast';
import CastAndMirrorButton from '@/components/CastAndMirrorButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <main className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">DimzTube — YouTube Cast Demo</h1>
      
      {isClient && isMobile ? (
        <div className="p-8 border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col items-center gap-4">
            <p className="text-center text-muted-foreground">Gunakan tombol di bawah untuk memulai cast atau mirror.</p>
            <CastAndMirrorButton />
        </div>
      ) : (
        <YouTubeWithCast videoId="dQw4w9WgXcQ" />
      )}
      
    </main>
  );
}
