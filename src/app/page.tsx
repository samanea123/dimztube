
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
import CastStatusIndicator from '@/components/CastStatusIndicator';

const KEY_USAGE_STORAGE_KEY = 'yt_keys_usage';
const TOTAL_API_KEYS = 5; // Define total keys available

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const { toast } = useToast();
  
  const updateKeyUsage = (apiKeyIndex: number, cost: number) => {
    if (typeof window === 'undefined' || apiKeyIndex === -1) return;

    let keys: KeyUsage[];
    try {
        const storedUsage = JSON.parse(localStorage.getItem(KEY_USAGE_STORAGE_KEY) || '[]');
        if (Array.isArray(storedUsage)) {
            keys = storedUsage;
        } else {
            keys = [];
        }
    } catch (e) {
        keys = [];
    }
    
    if (keys.length !== TOTAL_API_KEYS) {
        const newKeys = Array.from({ length: TOTAL_API_KEYS }, (_, i) => {
            const existingKey = keys.find(k => k.id === i);
            return existingKey || { id: i, used: 0 };
        });
        keys = newKeys;
    }

    const keyToUpdate = keys.find(k => k.id === apiKeyIndex);
    if (keyToUpdate) {
        keyToUpdate.used += cost;
    } 
    
    localStorage.setItem(KEY_USAGE_STORAGE_KEY, JSON.stringify(keys));
    window.dispatchEvent(new Event('storage'));
  };

  const initializeKeyUsage = (totalKeys: number) => {
    if (typeof window === 'undefined') return;

    try {
        let keys: KeyUsage[] = JSON.parse(localStorage.getItem(KEY_USAGE_STORAGE_KEY) || '[]');

        if (!Array.isArray(keys) || keys.some(k => typeof k.id !== 'number' || typeof k.used !== 'number')) {
            keys = []; // Reset if format is incorrect
        }

        if (keys.length !== totalKeys) {
            const newKeys = Array.from({ length: totalKeys }, (_, i) => {
                const existingKey = keys.find(k => k.id === i);
                return existingKey || { id: i, used: 0 };
            });
            localStorage.setItem(KEY_USAGE_STORAGE_KEY, JSON.stringify(newKeys));
            window.dispatchEvent(new Event('storage'));
        }
    } catch (e) {
        // If parsing fails, initialize with a fresh array
        const freshKeys = Array.from({ length: totalKeys }, (_, i) => ({ id: i, used: 0 }));
        localStorage.setItem(KEY_USAGE_STORAGE_KEY, JSON.stringify(freshKeys));
        window.dispatchEvent(new Event('storage'));
        console.warn("Initialized API key usage due to corrupted storage data.");
    }
  }

  const fetchAndSetVideos = async (category: string, searchQuery: string | null, forceRefresh = false, pageToken: string | null = null) => {
    if (pageToken) {
        setLoadingMore(true);
    } else {
        setLoading(true);
    }
    const cacheKey = searchQuery ? `search_${searchQuery}_${category}_${pageToken || 'first'}` : `videos_${category}_${pageToken || 'first'}`;
    
    if (!forceRefresh) {
      try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          const { cachedVideos, cachedToken } = JSON.parse(cachedData);
          const currentVideos = pageToken ? videos : [];
          setVideos([...currentVideos, ...cachedVideos]);
          setNextPageToken(cachedToken);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
      } catch (e) {
        console.warn("Failed to read from sessionStorage", e);
      }
    }

    try {
      let data: VideoItem[] = [];
      let newNextPageToken: string | null = null;
      let apiKeyIndex = -1;
      let cost = 0;

      if (searchQuery) {
        let url = `/api/search?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(category)}`;
        if (pageToken) {
            url += `&pageToken=${pageToken}`;
        }
        const res = await fetch(url);
        
        const searchData = await res.json();
        
        if (!res.ok || searchData.error) {
            toast({ variant: "destructive", title: "Error Pencarian", description: searchData.error || "Gagal memuat hasil." });
            setVideos(pageToken ? videos : []); 
            setNextPageToken(null);
            setLoading(false);
            setLoadingMore(false);
            return;
        } 
        
        data = (searchData.items || []).map((item: any) => ({
         id: item.id,
         title: item.title,
         thumbnailUrl: item.thumbnail,
         channelTitle: item.channel,
         viewCount: '',
         publishedAt: '',
         duration: ''
        }));
        newNextPageToken = searchData.nextPageToken || null;
      
      } else {
        let response: VideoApiResponse | null = null;
        if (category === 'Semua') {
          response = await getPopularVideos({ pageToken });
        } else {
          response = await getVideosByCategory(category, { pageToken });
        }
        
        if (response && response.videos) {
          data = response.videos;
          apiKeyIndex = response.apiKeyIndex;
          cost = response.cost;
          newNextPageToken = response.nextPageToken || null;
           if (apiKeyIndex !== -1) {
            updateKeyUsage(apiKeyIndex, cost);
          }
        }
      }
      
      const newVideos = pageToken ? [...videos, ...data] : data;
      setVideos(newVideos);
      setNextPageToken(newNextPageToken);

      if (data.length > 0) {
        try {
          const cachePayload = { cachedVideos: data, cachedToken: newNextPageToken };
          sessionStorage.setItem(cacheKey, JSON.stringify(cachePayload));
        } catch (e) {
            console.warn("Failed to write to sessionStorage", e);
        }
      }
      
    } catch(err) {
      console.error("Gagal mengambil data video:", err);
      toast({ variant: "destructive", title: "Gagal Memuat Video", description: "Terjadi masalah saat mengambil data. Coba muat ulang halaman." });
      setVideos(pageToken ? videos : []);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  useEffect(() => {
    initializeKeyUsage(TOTAL_API_KEYS);
    fetchAndSetVideos(q ? 'Semua' : selectedCategory, q, false);
  }, [selectedCategory, q]);

  const handleReload = () => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('videos_') || key.startsWith('search_')) {
        sessionStorage.removeItem(key);
      }
    });
    fetchAndSetVideos(q ? 'Semua' : selectedCategory, q, true);
  };
  
  const handleSelectCategory = (category: string) => {
    if (q) {
        window.history.pushState({}, '', '/');
    }
    setSelectedCategory(category);
  };

  const handleLoadMore = () => {
      if (nextPageToken) {
          fetchAndSetVideos(q ? 'Semua' : selectedCategory, q, false, nextPageToken);
      }
  }

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
     const term = video.title;
     window.location.href = `/?q=${encodeURIComponent(term)}`;
  }

  return (
    <div className="flex flex-col h-full">
        <Navbar 
          onReload={handleReload} 
          category={selectedCategory}
          onSelectVideo={handleSelectVideoFromSearch}
        />
        <CastStatusIndicator />
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
                onLoadMore={handleLoadMore}
                canLoadMore={!!nextPageToken}
                loadingMore={loadingMore}
            />
        </main>
        <QueueSidebar onPlay={(videoId) => openVideoInNewTab(videoId)} />
        <MiniPlayer onPlay={(videoId) => openVideoInNewTab(videoId)} />
    </div>
  );
}

// Wrapper component to provide Suspense context for useSearchParams
function HomePageWrapper() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Memuat...</div>}>
      <HomePageContent />
    </React.Suspense>
  );
}

export default HomePageWrapper;
