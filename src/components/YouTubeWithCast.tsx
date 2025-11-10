'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type Props = {
  videoId?: string; // jika tidak dikirim, bisa diisi dinamis
  className?: string;
};

export default function YouTubeWithCast({ videoId = 'dQw4w9WgXcQ', className = '' }: Props) {
  const playerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 1) inject YouTube IFrame API once
    if (!document.querySelector('script[data-yt-api]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.setAttribute('data-yt-api', '1');
      s.async = true;
      document.body.appendChild(s);
    }

    // 2) When API ready, create player
    window.onYouTubeIframeAPIReady = () => {
      if (!playerRef.current) return;

      // If a previous iframe exists, remove it first
      playerRef.current.innerHTML = '';

      // create player
      /* eslint-disable @typescript-eslint/no-explicit-any */
      new (window as any).YT.Player(playerRef.current, {
        height: '360',
        width: '640',
        videoId,
        playerVars: {
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          controls: 1,
          enablejsapi: 1, // Wajib untuk memunculkan ikon Cast
        },
        events: {
          onReady: (e: any) => {
            // do not autoplay by default; allow user to click play
            console.log('YouTube player ready', videoId);
          },
        },
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */
    };

    // Cleanup: remove handler (keamanan)
    return () => {
      try {
        // @ts-ignore
        delete window.onYouTubeIframeAPIReady;
      } catch {}
    };
  }, [videoId]);

  return (
    <div className={`youtube-cast-wrapper ${className}`}>
      <div ref={playerRef} id={`youtube-player-${videoId}`} />
      <p className="text-sm text-muted mt-2">
        Jika ada perangkat Chromecast / Android TV di jaringan yang sama, ikon Cast akan muncul di player.
      </p>
    </div>
  );
}
