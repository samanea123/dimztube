'use client';

import { useEffect, useState } from 'react';
import CategoryBar from '@/components/category-bar';
import Navbar from '@/components/Navbar';
import HomeFeed from '@/components/HomeFeed';
import { getPopularVideos, getVideosByCategory, type VideoItem } from '@/lib/youtube';
import { addToQueue, getQueue, setQueue, setCurrentIndex, getSettings } from '@/lib/queue';
import { useToast } from '@/hooks/use-toast';
import QueueSidebar from '@/components/QueueSidebar';
import MiniPlayer from '@/components/MiniPlayer';


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

  const openVideoInNewTab = (startVideoId: string) => {
    const queue = getQueue();
    let currentIndex = queue.findIndex(v => v.id === startVideoId);
    if (currentIndex === -1) {
      // If video not in queue, just play it. Queue logic will be handled by player page.
      setQueue([videos.find(v => v.id === startVideoId)!]);
      currentIndex = 0;
    }
    setCurrentIndex(currentIndex);
    
    const url = `/player/${startVideoId}?autoplay=1`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePlayVideo = (video: VideoItem) => {
    setQueue([video]);
    setCurrentIndex(0);
    openVideoInNewTab(video.id);
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
        <main className="flex-1 overflow-y-auto pb-32 sm:pb-4">
            <HomeFeed 
                videos={videos} 
                loading={loading} 
                onPlayVideo={handlePlayVideo} 
                onAddToQueue={handleAddToQueue}
            />
        </main>
        <QueueSidebar onPlay={(videoId) => openVideoInNewTab(videoId)} />
        <MiniPlayer onPlay={(videoId) => openVideoInNewTab(videoId)} />
    </div>
  );
}
