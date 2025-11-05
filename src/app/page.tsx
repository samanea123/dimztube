
'use client';

import { useEffect, useState } from 'react';
import CategoryBar from '@/components/category-bar';
import Navbar from '@/components/Navbar';
import HomeFeed from '@/components/HomeFeed';
import { getPopularVideos, getVideosByCategory, type VideoItem, type VideoApiResponse } from '@/lib/youtube';
import { addToQueue, getQueue, setQueue, setCurrentIndex, getSettings } from '@/lib/queue';
import { useToast } from '@/hooks/use-toast';
import QueueSidebar from '@/components/QueueSidebar';
import MiniPlayer from '@/components/MiniPlayer';
import type { VideoItem as SearchVideoItem } from '@/components/SearchBar';

const KEY_USAGE_STORAGE_KEY = 'yt_keys_usage';

interface KeyUsage {
    id: number;
    used: number;
}

const categories = [
  'Semua', 'Musik', 'Lagu Karaoke', 'Film', 'Kuliner', 'Berita',
  'Horor', 'Wisata', 'TV', 'Komedi', 'Hobi',
];

export default function HomePageContainer() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const { toast } = useToast();
  
  const updateKeyUsage = (apiKeyIndex: number, cost: number, totalKeys: number) => {
    if (typeof window === 'undefined' || apiKeyIndex === -1) return;

    const storedUsage = JSON.parse(localStorage.getItem(KEY_USAGE_STORAGE_KEY) || '[]');
    let keys: KeyUsage[] = storedUsage;

    // Initialize if not present or length is wrong
    if (keys.length !== totalKeys) {
        keys = Array.from({ length: totalKeys }, (_, i) => ({ id: i, used: 0 }));
    }

    const keyToUpdate = keys.find(k => k.id === apiKeyIndex);
    if (keyToUpdate) {
        keyToUpdate.used += cost;
    } else {
        keys[apiKeyIndex] = { id: apiKeyIndex, used: cost };
    }
    
    localStorage.setItem(KEY_USAGE_STORAGE_KEY, JSON.stringify(keys));
    // Dispatch an event to notify the monitor page
    window.dispatchEvent(new Event('storage'));
  };

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

    let response: VideoApiResponse | null = null;
    try {
      if (category === 'Semua') {
        response = await getPopularVideos();
      } else {
        response = await getVideosByCategory(category);
      }
      
      if (response && response.videos.length > 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify(response.videos));
        setVideos(response.videos);
        updateKeyUsage(response.apiKeyIndex, response.cost, response.totalApiKeys);
      } else {
        setVideos([]);
      }
    } catch(err) {
      console.error("Gagal mengambil data video:", err);
      setVideos([]);
    }

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
      const videoToPlay = videos.find(v => v.id === startVideoId);
      if (videoToPlay) {
         setQueue([videoToPlay]);
         setCurrentIndex(0);
      } else {
        // Fallback for video not in the main list (e.g. from queue page or search)
        const videoFromQueue = getQueue().find(v => v.id === startVideoId);
        if (videoFromQueue) {
            setQueue([videoFromQueue]);
            setCurrentIndex(0);
        } else {
            // If it's not anywhere, just create a new queue with a basic object
            setQueue([{ id: startVideoId, title: 'Video', thumbnailUrl: '', channelTitle: '' }]);
            setCurrentIndex(0);
        }
      }
    } else {
       setCurrentIndex(currentIndex);
    }
    
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
  
  const handleSelectVideoFromSearch = (video: SearchVideoItem) => {
    const videoToPlay: VideoItem = {
        id: video.id,
        title: video.title,
        channelTitle: video.channel,
        thumbnailUrl: video.thumbnail,
        viewCount: '',
        publishedAt: '',
        duration: '',
    }
    setQueue([videoToPlay]);
    setCurrentIndex(0);
    openVideoInNewTab(video.id);
  }

  return (
    <div className="flex flex-col h-full">
        <Navbar 
          onReload={handleReload} 
          onCast={() => {
            const context = cast.framework.CastContext.getInstance();
            context.requestSession().catch((err: any) => console.error(err));
          }}
          category={selectedCategory}
          onSelectVideo={handleSelectVideoFromSearch}
        />
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
