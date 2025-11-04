'use client';

import { useEffect, useState } from 'react';
import CategoryBar from '@/components/category-bar';
import VideoCard from '@/components/video-card';
import { getPopularVideos, getVideosByCategory, type VideoItem } from '@/lib/youtube';
import { Skeleton } from '@/components/ui/skeleton';

const categories = [
  'Semua',
  'Musik',
  'Lagu Karaoke',
  'Film',
  'Kuliner',
  'Berita',
  'Horor',
  'Wisata',
  'TV',
  'Komedi',
  'Hobi',
];

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

export default function Home() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      let newVideos: VideoItem[] = [];
      if (selectedCategory === 'Semua') {
        newVideos = await getPopularVideos();
      } else {
        newVideos = await getVideosByCategory(selectedCategory);
      }
      setVideos(newVideos);
      setLoading(false);
    };

    fetchVideos();
  }, [selectedCategory]);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <CategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>
      {loading ? (
        <VideoGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </main>
  );
}
