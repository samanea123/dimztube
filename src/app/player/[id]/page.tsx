'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getQueue, getSettings, setCurrentIndex, playNext, playPrev } from '@/lib/queue';
import { useToast } from '@/hooks/use-toast';

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const videoId = params.id as string;
  const playerRef = useRef<any>(null);
  const videoElementRef = useRef<HTMLElement | null>(null);
  const isAutoplay = searchParams.get('autoplay') === '1';
  const { toast } = useToast();
  const wasPlayingBeforeHidden = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const player = playerRef.current;
      if (!player) return;

      const playerState = player.getPlayerState();
      
      if (document.hidden) {
        if (playerState === YT.PlayerState.PLAYING) {
            wasPlayingBeforeHidden.current = true;
            toast({
                title: '🎧 Pemutaran tetap aktif di background',
                description: 'Audio akan terus berjalan saat layar mati atau aplikasi diminimize.',
            });
        }
      } else {
        if (wasPlayingBeforeHidden.current) {
            toast({
                title: '▶️ Lanjutkan dari background',
                description: 'Selamat menikmati kembali videonya!',
            });
            wasPlayingBeforeHidden.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [toast]);


  const handleVideoEnd = (forceNext = false) => {
    const queue = getQueue();
    const settings = getSettings();
    const currentIndex = queue.findIndex(v => v.id === videoId);

    if (currentIndex === -1) {
      if (!forceNext) window.close();
      return;
    }
  
    let nextIndex = -1;

    if (forceNext) {
        if (currentIndex < queue.length - 1) {
            nextIndex = settings.shuffle ? Math.floor(Math.random() * queue.length) : currentIndex + 1;
        } else if (settings.repeat) {
            nextIndex = settings.shuffle ? Math.floor(Math.random() * queue.length) : 0;
        }
    } else {
        if (currentIndex < queue.length - 1) {
           nextIndex = settings.shuffle ? Math.floor(Math.random() * queue.length) : currentIndex + 1;
        } else if (settings.repeat) {
           nextIndex = settings.shuffle ? Math.floor(Math.random() * queue.length) : 0;
        }
    }
    
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
      window.location.href = `/player/${queue[nextIndex].id}?autoplay=1`;
    } else {
      window.close();
    }
  };


  const handlePlayPrev = () => {
      const queue = getQueue();
      const currentIndex = queue.findIndex(v => v.id === videoId);
      const settings = getSettings();

      if (queue.length === 0 || currentIndex === -1) return;
      
      if (currentIndex === 0 && !settings.repeat) return;

      const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
      setCurrentIndex(prevIndex);
      window.location.href = `/player/${queue[prevIndex].id}?autoplay=1`;
  }

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

    navigator.mediaSession.setActionHandler('play', () => playerRef.current?.playVideo());
    navigator.mediaSession.setActionHandler('pause', () => playerRef.current?.pauseVideo());
    navigator.mediaSession.setActionHandler('stop', () => window.close());
    navigator.mediaSession.setActionHandler('previoustrack', handlePlayPrev);
    navigator.mediaSession.setActionHandler('nexttrack', () => handleVideoEnd(true));
  };
  
  const handleEnterPiP = () => {
    toast({
        title: "📺 Video tetap berjalan di layar kecil."
    });
  }

  const handleLeavePiP = () => {
    // Optional: add any logic needed when PiP is exited.
  }

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
      
      if (videoElementRef.current) {
        videoElementRef.current.removeEventListener('enterpictureinpicture', handleEnterPiP);
        videoElementRef.current.removeEventListener('leavepictureinpicture', handleLeavePiP);
      }
    };
  }, [videoId]);

  const handleFullscreenChange = () => {
    const isFullscreen = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement;
    if (!isFullscreen && screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  };

  function onYouTubeIframeAPIReady() {
    const playerElement = document.getElementById('player');
    if (!playerElement) return;
    
    playerRef.current = new YT.Player('player', {
      videoId: videoId,
      playerVars: { 
        'autoplay': isAutoplay ? 1 : 0, 
        'controls': 1, 
        'fs': 1, 
        'rel': 0,
        'playsinline': 1,
        'mute': isAutoplay ? 1 : 0,
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  }

  async function onPlayerReady(event: any) {
    setupMediaSession();

    // Attach PiP listeners
    const iframe = event.target.getIframe();
    videoElementRef.current = iframe?.contentDocument?.querySelector('video');
    if (videoElementRef.current) {
        videoElementRef.current.addEventListener('enterpictureinpicture', handleEnterPiP);
        videoElementRef.current.addEventListener('leavepictureinpicture', handleLeavePiP);
    }
    
    if (isAutoplay) {
      event.target.playVideo();

      try {
        if (iframe?.requestFullscreen) await iframe.requestFullscreen({ navigationUI: "hide" });
        else if ((iframe as any)?.mozRequestFullScreen) await (iframe as any).mozRequestFullScreen();
        else if ((iframe as any)?.webkitRequestFullScreen) await (iframe as any).webkitRequestFullScreen();
        
        if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock("landscape").catch(e => console.warn("Gagal mengunci orientasi:", e));
        }
      } catch (e) {
        console.warn("Gagal masuk fullscreen atau rotasi otomatis:", e);
      }
    }
  }

  function onPlayerStateChange(event: any) {
    if (event.data === YT.PlayerState.PLAYING) {
        if (playerRef.current.isMuted()) {
            const unmuteButton = document.getElementById("unmute");
            if (unmuteButton) {
                unmuteButton.style.display = "block";
            }
        } else {
             if (isAutoplay && !wasPlayingBeforeHidden.current) {
                toast({
                    title: "🎧 Pemutaran di background aktif",
                });
             }
        }
        navigator.mediaSession.playbackState = "playing";
    }
    if (event.data === YT.PlayerState.ENDED) {
        handleVideoEnd();
    }
    if (event.data === YT.PlayerState.PAUSED) {
        navigator.mediaSession.playbackState = "paused";
    }
  }

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
