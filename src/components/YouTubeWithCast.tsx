'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubeWithCast() {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fungsi untuk inisialisasi player
    const initializePlayer = () => {
      if (playerRef.current && window.YT) {
        new window.YT.Player(playerRef.current, {
          height: '360',
          width: '640',
          videoId: 'dQw4w9WgXcQ', // Ganti ke ID video kamu
          playerVars: {
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              console.log('YouTube player siap:', event);
            },
          },
        });
      }
    };
    
    // Cek jika YT API sudah ada, langsung inisialisasi.
    // Jika belum, tunggu event onYouTubeIframeAPIReady.
    if (window.YT && window.YT.Player) {
      initializePlayer();
    } else {
      window.onYouTubeIframeAPIReady = initializePlayer;
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <div id="youtube-player" ref={playerRef}></div>
      <p className="text-sm text-gray-500 mt-2">
        🔥 Logo cast muncul otomatis kalau ada TV/Chromecast di jaringan yang sama.
      </p>
    </div>
  );
}
