'use client';

import { useEffect, useState } from 'react';
import CategoryBar from '@/components/category-bar';
import Navbar from '@/components/Navbar';
import HomeFeed from '@/components/HomeFeed';
import { getPopularVideos, getVideosByCategory, type VideoItem } from '@/lib/youtube';
import { addToQueue, getQueue } from '@/lib/queue';
import { useToast } from '@/hooks/use-toast';


const categories = [
  'Semua', 'Musik', 'Lagu Karaoke', 'Film', 'Kuliner', 'Berita',
  'Horor', 'Wisata', 'TV', 'Komedi', 'Hobi',
];

export default function HomePageContainer() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const { toast } = useToast();

  const fetchAndSetVideos = async (category: string, forceRefresh = false) => {
    setLoading(true);
    const cacheKey = `videos_${category}`;
    
    if (!forceRefresh) {
      const cachedVideos = sessionStorage.getItem(cacheKey);
      if (cachedVideos) {
        setVideos(JSON.parse(cachedVideos));
        setLoading(false);
        return;
      }
    }

    let newVideos: VideoItem[] = [];
    try {
      if (category === 'Semua') {
        newVideos = await getPopularVideos();
      } else {
        newVideos = await getVideosByCategory(category);
      }
      
      if(newVideos.length > 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify(newVideos));
      }
    } catch(err) {
      console.error("Gagal mengambil data video:", err);
    }


    setVideos(newVideos);
    setLoading(false);
  };

  useEffect(() => {
    window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
      if (isAvailable) {
        initializeCastApi();
      }
    };
    fetchAndSetVideos(selectedCategory);
  }, [selectedCategory]);

  const handleReload = () => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('videos_')) {
        sessionStorage.removeItem(key);
      }
    });
    fetchAndSetVideos(selectedCategory, true);
  };
  
  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const initializeCastApi = () => {
    try {
        const context = cast.framework.CastContext.getInstance();
        context.setOptions({
            receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        console.log('Google Cast API berhasil diinisialisasi.');
    } catch(error) {
        console.error('Gagal inisialisasi Google Cast API:', error);
    }
  };

  const castVideo = (videoId: string) => {
    const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
    
    if (!castSession) {
      alert("Mulai sesi Cast terlebih dahulu melalui ikon Cast di pojok kanan atas.");
      return;
    }

    const mediaInfo = new chrome.cast.media.MediaInfo(videoId, 'video/youtube');
    console.log(`Akan memutar video ${videoId} di perangkat Cast.`);
    openVideoInNewTab(videoId); 
  };

  const openVideoInNewTab = (startVideoId: string, videoToPlay?: VideoItem) => {
    if (videoToPlay) {
      localStorage.setItem("dimztubeQueue", JSON.stringify([videoToPlay]));
    }
    const queue = getQueue();
    let currentIndex = queue.findIndex(v => v.id === startVideoId);
    if (currentIndex === -1) currentIndex = 0;

    const playerWindow = window.open("", "_blank");

    if (!playerWindow) {
      alert("Popup diblokir! Izinkan popup untuk DimzTube agar bisa buka video fullscreen.");
      return;
    }

    playerWindow.document.write(`
      <html>
        <head>
          <title>DimzTube Player</title>
          <style>
            * { box-sizing: border-box; }
            html, body {
              margin: 0; padding: 0; width: 100%; height: 100%;
              background-color: black;
              display: flex; justify-content: center; align-items: center;
              overflow: hidden; font-family: system-ui, sans-serif;
              color: white;
            }
            #player { width: 100vw; height: 100vh; }
            #unmute {
              position: absolute; bottom: 70px; left: 50%;
              transform: translateX(-50%);
              background: rgba(255,255,255,0.15); color: white;
              font-size: 16px; border: none; padding: 12px 24px;
              border-radius: 8px; cursor: pointer; transition: background 0.3s;
              display: none;
            }
            #unmute:hover { background: rgba(255,255,255,0.3); }
            #queueInfo {
              position: absolute; top: 10px; right: 15px;
              background: rgba(0,0,0,0.5);
              padding: 6px 10px;
              border-radius: 8px;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div id="player"></div>
          <button id="unmute">🔊 Aktifkan Suara</button>
          <div id="queueInfo"></div>

          <script src="https://www.youtube.com/iframe_api"></script>
          <script>
            const queue = ${JSON.stringify(queue)};
            let index = ${currentIndex};
            let player;

            const infoEl = document.getElementById("queueInfo");
            const unmuteButton = document.getElementById("unmute");

            function onYouTubeIframeAPIReady() {
              playCurrentVideo();
            }

            function playCurrentVideo() {
                if (!queue[index]) {
                    window.close();
                    return;
                }
                const currentVideo = queue[index];
                infoEl.innerText = "Memutar: " + currentVideo.title + " (" + (index + 1) + "/" + queue.length + ")";
                
                if (player) {
                    player.loadVideoById(currentVideo.id);
                } else {
                    player = new YT.Player('player', {
                        videoId: currentVideo.id,
                        playerVars: { 'autoplay': 1, 'controls': 1, 'fs': 1, 'rel': 0 },
                        events: {
                            'onReady': onPlayerReady,
                            'onStateChange': onPlayerStateChange
                        }
                    });
                }
            }

            function onPlayerReady(event) {
              event.target.mute();
              event.target.playVideo();
              const iframe = document.getElementById('player');
              const requestFullScreen = iframe.requestFullscreen || iframe.mozRequestFullScreen || iframe.webkitRequestFullScreen;
              if (requestFullScreen) {
                requestFullScreen.call(iframe).catch(() => console.log("Gagal masuk fullscreen otomatis"));
              }
            }

            function onPlayerStateChange(event) {
                if (event.data === YT.PlayerState.PLAYING && player.isMuted()) {
                    unmuteButton.style.display = "block";
                    unmuteButton.onclick = () => {
                        player.unMute();
                        unmuteButton.style.display = "none";
                    };
                }
                if (event.data === YT.PlayerState.ENDED) {
                    index++;
                    if (index < queue.length) {
                        playCurrentVideo();
                    } else {
                        window.close();
                    }
                }
            }
          </script>
        </body>
      </html>
    `);
    playerWindow.document.close();
  };

  const handleAddToQueue = (video: VideoItem) => {
    addToQueue(video);
    toast({
        title: "✅ Ditambahkan ke antrian",
        description: `"${video.title}" telah ditambahkan.`,
    });
  };

  return (
    <div className="flex flex-col h-full">
        <Navbar onReload={handleReload} onCast={() => {
            const context = cast.framework.CastContext.getInstance();
            context.requestSession().catch((err: any) => console.error(err));
        }} />
        <div className="sticky top-14 z-10 bg-background/95 backdrop-blur">
             <CategoryBar
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
            />
        </div>
        <main className="flex-1 overflow-y-auto">
            <HomeFeed 
                videos={videos} 
                loading={loading} 
                onPlayVideo={(video) => openVideoInNewTab(video.id, video)} 
                onAddToQueue={handleAddToQueue}
            />
        </main>
    </div>
  );
}
