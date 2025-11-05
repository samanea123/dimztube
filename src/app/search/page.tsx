"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { addToQueue, setQueue, setCurrentIndex, getQueue } from '@/lib/queue';
import { useToast } from '@/hooks/use-toast';
import type { VideoItem as SearchVideoItem } from '@/components/SearchBar';
import QueueSidebar from '@/components/QueueSidebar';
import MiniPlayer from '@/components/MiniPlayer';
import HomeFeed from '@/components/HomeFeed';
import { cast } from 'genkit';

type VideoItem = {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  viewCount: string;
  publishedAt: string;
  duration: string;
  channelAvatarUrl?: string;
};

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!q) {
      setVideos([]);
      return;
    }
    
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`);
        const data = await res.json();
        if (res.ok && data.items) {
          const fetchedVideos: VideoItem[] = data.items.map((item: any) => ({
             id: item.id,
             title: item.title,
             thumbnailUrl: item.thumbnail,
             channelTitle: item.channel,
             viewCount: '',
             publishedAt: '',
             duration: ''
          }));
          setVideos(fetchedVideos);
        } else {
          setVideos([]);
          toast({
            variant: "destructive",
            title: "Error Pencarian",
            description: data.error || "Gagal memuat hasil pencarian.",
          });
        }
      } catch (err) {
        console.error("Failed to fetch search results:", err);
        setVideos([]);
         toast({
            variant: "destructive",
            title: "Error Jaringan",
            description: "Gagal menyambung ke server. Coba lagi nanti.",
          });
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [q, category, toast]);

  const openVideoInNewTab = (startVideoId: string) => {
    const queue = getQueue();
    let currentIndex = queue.findIndex(v => v.id === startVideoId);
    if (currentIndex === -1) {
      const videoToPlay = videos.find(v => v.id === startVideoId);
      if (videoToPlay) {
         setQueue([videoToPlay]);
         setCurrentIndex(0);
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

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
      {q && (
          <h1 className="text-2xl font-bold mb-6">
            Hasil untuk: <span className="text-primary">{q}</span>
          </h1>
      )}
       <HomeFeed 
          videos={videos} 
          loading={loading} 
          onPlayVideo={handlePlayVideo} 
          onAddToQueue={handleAddToQueue}
      />
    </div>
  );
}


export default function SearchPage() {
    const router = useRouter();

    const handleSelectVideoFromSearch = (video: SearchVideoItem) => {
        // When a video is selected from search, we navigate to the search page.
        const term = video.title;
        router.push(`/search?q=${encodeURIComponent(term)}`);
    }

     const openVideoInNewTab = (startVideoId: string) => {
        const url = `/player/${startVideoId}?autoplay=1`;
        window.open(url, "_blank", "noopener,noreferrer");
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

    useEffect(() => {
        if (window.cast && window.cast.framework) {
            initializeCastApi();
        } else {
            window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
                if (isAvailable) initializeCastApi();
            };
        }
    }, []);

    return (
        <div className="flex flex-col h-screen">
            <Navbar 
              onReload={() => window.location.reload()} 
              onCast={() => {
                try {
                    const context = cast.framework.CastContext.getInstance();
                    context.requestSession().catch((err: any) => console.error(err));
                } catch(e) { console.error(e) }
              }}
              onSelectVideo={handleSelectVideoFromSearch}
            />
            <main className="flex-1 overflow-y-auto pt-14 pb-16 sm:pb-0">
                <Suspense fallback={<div className="p-4 text-center">Memuat...</div>}>
                    <SearchResultsContent />
                </Suspense>
            </main>
            <QueueSidebar onPlay={(videoId) => openVideoInNewTab(videoId)} />
            <MiniPlayer onPlay={(videoId) => openVideoInNewTab(videoId)} />
        </div>
    )
}
