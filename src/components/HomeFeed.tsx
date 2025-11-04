"use client";

import VideoCard from '@/components/video-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { VideoItem } from '@/lib/youtube';

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
  onVideoClick: (videoId: string) => void;
}

export default function HomeFeed({ videos, loading, onVideoClick }: HomeFeedProps) {
  if (loading) {
    return <VideoGridSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} onVideoClick={() => onVideoClick(video.id)} />
      ))}
    </div>
  );
}
