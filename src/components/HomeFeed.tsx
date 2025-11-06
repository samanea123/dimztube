"use client";

import VideoCard from '@/components/video-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { VideoItem } from '@/lib/youtube';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="flex gap-3 items-start">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col space-y-2 flex-1">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface HomeFeedProps {
  videos: VideoItem[];
  loading: boolean;
  onPlayVideo: (video: VideoItem) => void;
  onAddToQueue: (video: VideoItem) => void;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
  loadingMore?: boolean;
}

export default function HomeFeed({ videos, loading, onPlayVideo, onAddToQueue, onLoadMore, canLoadMore, loadingMore }: HomeFeedProps) {
  if (loading) {
    return <VideoGridSkeleton />;
  }

  // Safeguard: Ensure videos is always an array to prevent .map errors
  const videoList = Array.isArray(videos) ? videos : [];
  
  if (videoList.length === 0 && !loading) {
    return (
        <div className="text-center py-16 text-muted-foreground">
            <p>Tidak ada video untuk ditampilkan.</p>
            <p className='text-sm'>Coba segarkan halaman atau pilih kategori lain.</p>
        </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {videoList.map((video, index) => (
          <VideoCard 
            key={`${video.id}-${index}`}
            video={video} 
            onPlay={() => onPlayVideo(video)} 
            onAddToQueue={() => onAddToQueue(video)}
          />
        ))}
      </div>
      {canLoadMore && (
          <div className="flex justify-center my-8">
              <Button onClick={onLoadMore} disabled={loadingMore}>
                  {loadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memuat...
                      </>
                  ) : (
                    "Muat Lebih Banyak"
                  )}
              </Button>
          </div>
      )}
    </>
  );
}

    