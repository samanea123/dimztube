
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

function HomePageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q');
  
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const { toast } = useToast();
  
  const updateKeyUsage = (apiKeyIndex: number, cost: number, totalKeys: number) => {
    if (typeof window === 'undefined' || apiKeyIndex === -1) return;

    const storedUsage = JSON.parse(localStorage.getItem(KEY_USAGE_STORAGE_KEY) || '[]');
    let keys: KeyUsage[] = storedUsage;

    if (keys.length !== totalKeys) {
        keys = Array.from({ length: totalKeys }, (_, i) => ({ id: i, used: 0 }));
    }

    const keyToUpdate = keys.find(k => k.id === apiKeyIndex);
    if (keyToUpdate) {
        keyToUpdate.used += cost;
    } else if (apiKeyIndex >= 0 && apiKeyIndex < totalKeys) {
        keys[apiKeyIndex] = { id: apiKeyIndex, used: cost };
    }
    
    localStorage.setItem(KEY_USAGE_STORAGE_KEY, JSON.stringify(keys));
    window.dispatchEvent(new Event('storage'));
  };

  const fetchAndSetVideos = async (category: string, searchQuery: string | null, forceRefresh = false) => {
    setLoading(true);
    const cacheKey = searchQuery ? `search_${searchQuery}_${category}` : `videos_${category}`;
    
    if (!forceRefresh) {
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        setVideos(JSON.parse(cachedData));
        setLoading(false);
        return;
      }
    }

    try {
      let data: VideoItem[] = [];
      let apiKeyIndex = -1;
      let cost = 0;
      let totalApiKeys = 0;

      if (searchQuery) {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(category)}`);
        const searchData = await res.json();
        if (res.ok && searchData.items) {
          // The search API returns a simpler format, let's adapt it.
           data = searchData.items.map((item: any) => ({
             id: item.id,
             title: item.title,
             thumbnailUrl: item.thumbnail,
             channelTitle: item.channel,
             viewCount: '',
             publishedAt: '',
             duration: ''
          }));
          // Note: The proxy search API doesn't return cost/key info, so we can't track usage here.
        } else {
            toast({ variant: "destructive", title: "Error Pencarian", description: searchData.error || "Gagal memuat hasil." });
        }
      } else {
        let response: VideoApiResponse | null = null;
        if (category === 'Semua') {
          response = await getPopularVideos();
        } else {
          response = await getVideosByCategory(category);
        }
        
        if (response) {
          data = response.videos;
          apiKeyIndex = response.apiKeyIndex;
          cost = response.cost;
          totalApiKeys = response.totalApiKeys;
        }
      }
      
      if (data.length > 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        setVideos(data);
        if (apiKeyIndex !== -1) {
          updateKeyUsage(apiKeyIndex, cost, totalApiKeys);
        }
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
     // if there is a search query 'q', we ignore the selected category from the bar
     // and pass the query to our fetch function.
    fetchAndSetVideos(q ? 'Semua' : selectedCategory, q);
  }, [selectedCategory, q]);

  const handleReload = () => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('videos_') || key.startsWith('search_')) {
        sessionStorage.removeItem(key);
      }
    });
    fetchAndSetVideos(selectedCategory, q, true);
  };
  
  const handleSelectCategory = (category: string) => {
    // When a category is selected, clear any search query
    window.history.pushState({}, '', '/');
    setSelectedCategory(category);
  };

  const initializeCastApi = () => {
    try {
        const context = cast.framework.CastContext.getInstance();
        context.setOptions({
            receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
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
        const videoFromQueue = getQueue().find(v => v.id === startVideoId);
        if (videoFromQueue) {
            setQueue([videoFromQueue]);
            setCurrentIndex(0);
        } else {
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
    // This now navigates to the home page with a search query
     const term = video.title;
     window.location.href = `/?q=${encodeURIComponent(term)}`;
  }

  return (
    <div className="flex flex-col h-full">
        <Navbar 
          onReload={handleReload} 
          onCast={() => {
             try {
                const context = cast.framework.CastContext.getInstance();
                context.requestSession().catch((err: any) => console.error(err));
             } catch(e) { console.error(e) }
          }}
          category={selectedCategory}
          onSelectVideo={handleSelectVideoFromSearch}
        />
        <div className="sticky top-14 z-10 bg-background/95 backdrop-blur">
             <CategoryBar
                categories={categories}
                selectedCategory={q ? 'Semua' : selectedCategory}
                onSelectCategory={handleSelectCategory}
            />
        </div>
        <main className="flex-1 overflow-y-auto pb-32 sm:pb-4">
             {q && (
              <h1 className="text-2xl font-bold mb-0 pt-6 px-4">
                Hasil untuk: <span className="text-primary">{q}</span>
              </h1>
            )}
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


export default function HomePageContainer() {
  // Wrap with Suspense for useSearchParams
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </React.Suspense>
  )
}
