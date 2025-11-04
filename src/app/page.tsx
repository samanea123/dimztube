'use client';

import { useEffect, useState } from 'react';
import CategoryBar from '@/components/category-bar';
import Navbar from '@/components/Navbar';
import HomeFeed from '@/components/HomeFeed';
import { getPopularVideos, getVideosByCategory, type VideoItem } from '@/lib/youtube';
import { addToQueue } from '@/lib/queue';
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
    
    // Ini adalah cara untuk memuat konten YouTube langsung di receiver
    // Namun, ini memerlukan custom receiver. Untuk default receiver, kita hanya bisa
    // mengirim URL dasar.
    // Untuk menyederhanakan, kita akan membuka tab baru dan memutarnya di sana
    // sebagai gantinya, seperti yang diminta.
    
    // Logika alternatif jika menggunakan custom receiver:
    // const request = new chrome.cast.media.LoadRequest(mediaInfo);
    // castSession.loadMedia(request)
    //   .then(() => console.log('Video dikirim ke TV 🎬'))
    //   .catch((err: any) => console.error('Gagal mengirim video:', err));

    console.log(`Akan memutar video ${videoId} di perangkat Cast.`);
    openVideoInNewTab(videoId); // Buka di tab baru sebagai fallback
  };

  const openVideoInNewTab = (videoId: string, video?: VideoItem) => {
    if (video) {
        // Ganti antrian hanya dengan video ini
        localStorage.setItem("dimztubeQueue", JSON.stringify([video]));
    }
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
            }
            #player { width: 100vw; height: 100vh; }
            #unmute {
              position: absolute; bottom: 70px; left: 50%;
              transform: translateX(-50%);
              background: rgba(255,255,255,0.15); color: white;
              font-size: 16px; border: none; padding: 12px 24px;
              border-radius: 8px; cursor: pointer; transition: background 0.3s;
              display: none; /* Sembunyikan dulu */
            }
            #unmute:hover { background: rgba(255,255,255,0.3); }
          </style>
        </head>
        <body>
          <div id="player"></div>
          <button id="unmute">🔊 Aktifkan Suara</button>

          <script src="https://www.youtube.com/iframe_api"></script>
          <script>
            let player;
            function onYouTubeIframeAPIReady() {
              player = new YT.Player('player', {
                videoId: '${videoId}',
                playerVars: {
                  'autoplay': 1,
                  'controls': 1,
                  'showinfo': 0,
                  'rel': 0,
                  'fs': 1,
                  'playsinline': 1
                },
                events: {
                  'onReady': onPlayerReady,
                  'onStateChange': onPlayerStateChange
                }
              });
            }

            function onPlayerReady(event) {
              event.target.mute();
              event.target.playVideo();
              // Coba masuk fullscreen
              const iframe = document.getElementById('player');
              const requestFullScreen = iframe.requestFullscreen || iframe.mozRequestFullScreen || iframe.webkitRequestFullScreen;
              if (requestFullScreen) {
                requestFullScreen.call(iframe).catch(() => console.log("Gagal masuk fullscreen otomatis"));
              }
            }

            function onPlayerStateChange(event) {
                // Saat video mulai diputar (dan masih di-mute)
                if (event.data === YT.PlayerState.PLAYING && player.isMuted()) {
                    const unmuteButton = document.getElementById("unmute");
                    unmuteButton.style.display = "block";

                    unmuteButton.addEventListener("click", () => {
                        player.unMute();
                        unmuteButton.style.display = "none";
                    });
                }
                // Jika video selesai, tutup tab
                if (event.data === YT.PlayerState.ENDED) {
                    window.close();
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
