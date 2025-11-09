
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams }from 'next/navigation';
import { getQueue, getSettings, setCurrentIndex, savePlayHistory, type VideoItem } from '@/lib/queue';
import { useToast } from '@/hooks/use-toast';
import { Music, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

type MediaType = 'music' | 'karaoke' | null;

function isMusicOrKaraokeVideo(video: VideoItem): MediaType {
  if (!video) return null;
  
  const title = (video.title || '').toLowerCase();
  const tags = (video.tags || []).join(' ').toLowerCase();
  const categoryId = video.categoryId; // YouTube's category ID for Music is "10"

  const karaokeKeywords = [
    'karaoke', 'instrumental', 'minus one', 'no vocal', 
    'sing along', 'backing track'
  ];

  if (karaokeKeywords.some(keyword => title.includes(keyword) || tags.includes(keyword))) {
    return 'karaoke';
  }
  
  if (categoryId === '10') {
    return 'music';
  }

  const musicKeywords = [
    'music', 'song', 'official', 'track', 'lyric', 'audio', 'sound', 
    'single', 'album', 'cover', 'remix', 'mv'
  ];

  if (musicKeywords.some(keyword => title.includes(keyword) || tags.includes(keyword))) {
      return 'music';
  }

  return null;
}

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const videoId = params.id as string;
  const playerRef = useRef<any>(null);
  const isAutoplay = searchParams.get('autoplay') === '1';
  const { toast } = useToast();
  const wasPlayingBeforeHidden = useRef(false);
  const [mediaType, setMediaType] = useState<MediaType>(null);


  useEffect(() => {
    // Check for iOS and show a one-time warning toast
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
        toast({
            title: "Fitur Terbatas di iOS",
            description: "Pemutaran di latar belakang mungkin tidak berfungsi di browser ini. Gunakan aplikasi untuk pengalaman penuh.",
            duration: 5000,
        });
    }
  }, [toast]);


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
    
    if (nextIndex !== -1 && queue[nextIndex]) {
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
      
      if (queue[prevIndex]) {
        setCurrentIndex(prevIndex);
        window.location.href = `/player/${queue[prevIndex].id}?autoplay=1`;
      }
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
      
      const iframe = playerRef.current?.getIframe();
      if (iframe && iframe.contentDocument) {
        const videoEl = iframe.contentDocument.querySelector('video');
         if (videoEl) {
           videoEl.removeEventListener('enterpictureinpicture', handleEnterPiP);
           videoEl.removeEventListener('leavepictureinpicture', handleLeavePiP);
         }
      }
      // Clear media session on unmount
      if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = null;
          navigator.mediaSession.playbackState = 'none';
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
    const queue = getQueue();
    const currentVideo = queue.find(v => v.id === videoId);

    if (currentVideo) {
        // Simpan ke riwayat pemutaran
        savePlayHistory(currentVideo);
        
        const detectedType = isMusicOrKaraokeVideo(currentVideo);
        setMediaType(detectedType);
        if (detectedType) {
            setupMediaSession();
        }
    }

    const iframe = event.target.getIframe();
    if (iframe && iframe.contentDocument) {
      const videoEl = iframe.contentDocument.querySelector('video');
      if (videoEl) {
        videoEl.addEventListener('enterpictureinpicture', handleEnterPiP);
        videoEl.addEventListener('leavepictureinpicture', handleLeavePiP);
      }
    }
    
    if (isAutoplay) {
      // Small delay to ensure browser registers the play command reliably
      setTimeout(() => event.target.playVideo(), 100);

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
        // If Media Session is not set up, set it up now
        if (!navigator.mediaSession.metadata) {
            setupMediaSession();
        }
        if (playerRef.current.isMuted()) {
            const unmuteButton = document.getElementById("unmute");
            if (unmuteButton) {
                unmuteButton.style.display = "block";
            }
        }
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
    }
    if (event.data === YT.PlayerState.ENDED) {
        handleVideoEnd();
    }
    if (event.data === YT.PlayerState.PAUSED) {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = "paused";
        }
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
  
  const renderMediaBadge = () => {
    if (!mediaType) return null;
    
    const isKaraoke = mediaType === 'karaoke';
    const Icon = isKaraoke ? Mic : Music;
    const text = isKaraoke ? 'Karaoke Mode' : 'Music Mode';
    const bgColor = isKaraoke ? 'bg-blue-600/80' : 'bg-black/60';
    
    return (
        <div className={cn(
            "absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold",
            bgColor
        )}>
            <Icon className="h-4 w-4" />
            <span>{text}</span>
        </div>
    )
  }

  return (
    <>
      <div className="w-screen h-screen bg-black flex justify-center items-center relative">
        {renderMediaBadge()}
        <div id="player" className="w-full h-full"></div>
        <button id="unmute" onClick={handleUnmute} className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-3 rounded-full text-lg z-50" style={{display: 'none'}}>
            🔊 Aktifkan Suara
        </button>
      </div>
      <script src="https://www.youtube.com/iframe_api" async></script>
    </>
  );
}
