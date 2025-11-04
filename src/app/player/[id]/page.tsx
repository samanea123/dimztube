'use client';

import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getQueue, getSettings, setCurrentIndex, playNext } from '@/lib/queue';

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const videoId = params.id as string;
  const playerRef = useRef<any>(null);
  const isAutoplay = searchParams.get('autoplay') === '1';

  useEffect(() => {
    // If the API is already loaded, proceed to create the player
    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      // Otherwise, set up the callback for when the API loads
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }
  
    // Add fullscreen change listeners
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      // Clean up player and listeners
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      window.onYouTubeIframeAPIReady = undefined;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [videoId]); // Re-run effect if videoId changes

  const handleFullscreenChange = () => {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    if (!isFullscreen && screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  };

  function onYouTubeIframeAPIReady() {
    if (!document.getElementById('player')) return;
    
    playerRef.current = new YT.Player('player', {
      videoId: videoId,
      playerVars: { 
        'autoplay': isAutoplay ? 1 : 0, 
        'controls': 1, 
        'fs': 1, 
        'rel': 0 
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  }

  async function onPlayerReady(event: any) {
    if (isAutoplay) {
      // Mute to allow autoplay in most browsers
      event.target.mute();
      event.target.playVideo();

      try {
        const iframe = document.getElementById('player');
        if (iframe?.requestFullscreen) await iframe.requestFullscreen();
        else if (iframe?.mozRequestFullScreen) await iframe.mozRequestFullScreen();
        else if (iframe?.webkitRequestFullScreen) await iframe.webkitRequestFullScreen();
        
        if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock("landscape");
        }
      } catch (e) {
        console.warn("Gagal masuk fullscreen atau rotasi otomatis:", e);
      }
    }
  }

  function onPlayerStateChange(event: any) {
    // Show unmute button when video starts playing and is muted
    if (event.data === YT.PlayerState.PLAYING && playerRef.current.isMuted()) {
        const unmuteButton = document.getElementById("unmute");
        if (unmuteButton) {
            unmuteButton.style.display = "block";
        }
    }
    // When video ends
    if (event.data === YT.PlayerState.ENDED) {
        handleVideoEnd();
    }
  }

  const handleVideoEnd = () => {
    const queue = getQueue();
    const settings = getSettings();
    const currentIndex = queue.findIndex(v => v.id === videoId);

    if (currentIndex === -1 || currentIndex === queue.length - 1) {
        // If it's the last video or not in queue
        if (settings.repeat) {
            if (queue.length > 0) {
                setCurrentIndex(0);
                window.location.href = `/player/${queue[0].id}?autoplay=1`;
            }
        } else {
            window.close(); // Close tab if not repeating
        }
    } else {
        // Play next video
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        window.location.href = `/player/${queue[nextIndex].id}?autoplay=1`;
    }
  };

  const handleUnmute = () => {
      if (playerRef.current) {
          playerRef.current.unMute();
          const unmuteButton = document.getElementById("unmute");
          if (unmuteButton) {
              unmuteButton.style.display = 'none';
          }
      }
  }

  return (
    <>
      <div className="w-screen h-screen bg-black flex justify-center items-center">
        <div id="player" className="w-full h-full"></div>
        <button id="unmute" onClick={handleUnmute} className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-3 rounded-full text-lg z-50" style={{display: 'none'}}>
            🔊 Aktifkan Suara
        </button>
      </div>
      <script src="https://www.youtube.com/iframe_api" async></script>
    </>
  );
}
