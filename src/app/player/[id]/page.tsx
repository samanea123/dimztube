'use client';

import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getQueue, getSettings, setCurrentIndex, playNext } from '@/lib/queue';
import { VideoItem } from '@/lib/youtube';

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const videoId = params.id as string;
  const playerRef = useRef<any>(null);
  const isAutoplay = searchParams.get('autoplay') === '1';

  const setupMediaSession = () => {
    if (!('mediaSession' in navigator)) {
      return;
    }
    
    const queue = getQueue();
    const video = queue.find(v => v.id === videoId);

    if (!video) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: video.title,
      artist: video.channelTitle,
      album: 'DimzTube',
      artwork: [
        { src: video.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => {
        playerRef.current?.playVideo();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        playerRef.current?.pauseVideo();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
       const queue = getQueue();
       const currentIndex = queue.findIndex(v => v.id === videoId);
       if (currentIndex > 0) {
           const prevIndex = currentIndex - 1;
           setCurrentIndex(prevIndex);
           window.location.href = `/player/${queue[prevIndex].id}?autoplay=1`;
       }
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleVideoEnd(true); // Treat as video end to play next
    });

  };

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }
  
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      window.onYouTubeIframeAPIReady = undefined;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [videoId]);

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
    setupMediaSession();
    if (isAutoplay) {
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
    if (event.data === YT.PlayerState.PLAYING && playerRef.current.isMuted()) {
        const unmuteButton = document.getElementById("unmute");
        if (unmuteButton) {
            unmuteButton.style.display = "block";
        }
    }
    if (event.data === YT.PlayerState.ENDED) {
        handleVideoEnd();
    }
     if (event.data === YT.PlayerState.PLAYING) {
        navigator.mediaSession.playbackState = "playing";
    } else if (event.data === YT.PlayerState.PAUSED) {
        navigator.mediaSession.playbackState = "paused";
    }
  }

  const handleVideoEnd = (forceNext = false) => {
    const queue = getQueue();
    const settings = getSettings();
    const currentIndex = queue.findIndex(v => v.id === videoId);

    if (currentIndex === -1) {
        if (!forceNext) window.close();
        return;
    }

    if (currentIndex === queue.length - 1) {
        if (settings.repeat || forceNext) {
            if (queue.length > 0) {
                const nextIndex = settings.shuffle ? Math.floor(Math.random() * queue.length) : 0;
                setCurrentIndex(nextIndex);
                window.location.href = `/player/${queue[nextIndex].id}?autoplay=1`;
            }
        } else if (!forceNext) {
            window.close();
        }
    } else {
        const nextIndex = settings.shuffle ? Math.floor(Math.random() * queue.length) : currentIndex + 1;
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
