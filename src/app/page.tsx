'use client';

import { useEffect, useState } from 'react';
import CategoryBar from '@/components/category-bar';
import Navbar from '@/components/Navbar';
import HomeFeed from '@/components/HomeFeed';
import { getPopularVideos, getVideosByCategory, type VideoItem } from '@/lib/youtube';

const categories = [
  'Semua', 'Musik', 'Lagu Karaoke', 'Film', 'Kuliner', 'Berita',
  'Horor', 'Wisata', 'TV', 'Komedi', 'Hobi',
];

export default function HomePageContainer() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

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
    // Inisialisasi Cast API
    window['__onGCastApiAvailable'] = (isAvailable) => {
      if (isAvailable) {
        initializeCastApi();
      }
    };
    // Ambil data video
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

  const handleCast = () => {
    if (window.cast && window.cast.framework) {
      const context = cast.framework.CastContext.getInstance();
      const session = context.getCurrentSession();

      if (!session) {
        context.requestSession()
          .then(() => console.log("Sesi Cast berhasil dimulai!"))
          .catch((err) => console.error("Gagal memulai sesi Cast:", err));
      } else {
        context.endCurrentSession(true)
            .then(() => console.log("Sesi Cast dihentikan."))
            .catch((err) => console.error("Gagal menghentikan sesi Cast:", err));
      }
    } else {
      console.warn("Google Cast API tidak tersedia.");
      alert("Fungsi Google Cast tidak tersedia di perangkat atau browser ini.");
    }
  };

  const castVideo = (videoId: string) => {
    if (window.cast && window.cast.framework) {
      const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
      if (castSession) {
        const mediaInfo = new chrome.cast.media.MediaInfo(videoId, 'video/mp4');
        const request = new chrome.cast.media.LoadRequest(mediaInfo);
        
        // Atur untuk video YouTube
        mediaInfo.contentType = 'application/x-www-form-urlencoded';
        mediaInfo.contentId = videoId;

        castSession.loadMedia(request)
          .then(() => console.log('Memutar video di TV...'))
          .catch((error: any) => console.error('Gagal memuat media:', error));
      } else {
        cast.framework.CastContext.getInstance().requestSession()
          .then(() => {
             console.log("Memulai sesi cast dan mencoba memutar video...");
             setTimeout(() => castVideo(videoId), 1000);
          })
          .catch((err: any) => {
            console.error('Gagal memulai sesi cast:', err);
          });
      }
    } else {
        alert("Fungsi Google Cast tidak tersedia di perangkat atau browser ini.");
    }
  };


  return (
    <div className="flex flex-col h-full">
        <Navbar onReload={handleReload} onCast={handleCast} />
        <div className="sticky top-14 z-10 bg-background/95 backdrop-blur">
             <CategoryBar
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
            />
        </div>
        <main className="flex-1 overflow-y-auto">
            <HomeFeed videos={videos} loading={loading} onVideoClick={castVideo} />
        </main>
    </div>
  );
}
