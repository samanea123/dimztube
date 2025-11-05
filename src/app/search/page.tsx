'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import VideoCard from '@/components/video-card';
import { Skeleton } from '@/components/ui/skeleton';
import { addToQueue, setQueue, setCurrentIndex } from '@/lib/queue';
import { useToast } from '@/hooks/use-toast';
import type { VideoItem as SearchVideoItem } from '@/components/SearchBar';
import QueueSidebar from '@/components/QueueSidebar';
import MiniPlayer from '@/components/MiniPlayer';

type VideoItem = {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  viewCount: string;
  publishedAt: string;
  duration: string;
  channelAvatarUrl?: string;
};

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (query) {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`)
        .then(res => res.json())
        "use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import VideoCard from '@/components/video-card';
import { Skeleton } from '@/components/ui/skeleton';
import { addToQueue, setQueue, setCurrentIndex } from '@/lib/queue';
import { useToast } from '@/hooks/use-toast';
import type { VideoItem as SearchVideoItem } from '@/components/SearchBar';
import QueueSidebar from '@/components/QueueSidebar';
import MiniPlayer from '@/components/MiniPlayer';
import HomeFeed from '@/components/HomeFeed';
import { getQueue } from '@/lib/queue';

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
        if (data.items) {
          // The search API returns a simpler Video object, let's adapt it
          const fetchedVideos: VideoItem[] = data.items.map((item: any) => ({
             id: item.id,
             title: item.title,
             thumbnailUrl: item.thumbnail,
             channelTitle: item.channel,
             viewCount: '', // Not provided by search API
             publishedAt: '', // Not provided by search API
             duration: '' // Not provided by search API
          }));
          setVideos(fetchedVideos);
        } else {
          setVideos([]);
        }
      } catch (err) {
        console.error("Failed to fetch search results:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [q, category]);

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Hasil untuk: <span className="text-primary">{q}</span>
      </h1>
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
        openVideoInNewTab(videoToPlay.id);
    }

     const openVideoInNewTab = (startVideoId: string) => {
        const url = `/player/${startVideoId}?autoplay=1`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="flex flex-col h-full">
            <Navbar 
              onReload={() => window.location.reload()} 
              onCast={() => {
                const context = cast.framework.CastContext.getInstance();
                context.requestSession().catch((err: any) => console.error(err));
              }}
              onSelectVideo={handleSelectVideoFromSearch}
            />
            <main className="flex-1 overflow-y-auto pb-32 sm:pb-4 pt-14">
                <Suspense fallback={<div>Loading...</div>}>
                    <SearchResultsContent />
                </Suspense>
            </main>
            <QueueSidebar onPlay={(videoId) => openVideoInNewTab(videoId)} />
            <MiniPlayer onPlay={(videoId) => openVideoInNewTab(videoId)} />
        </div>
    )
}
