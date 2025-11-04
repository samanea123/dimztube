'use client';

import { useEffect, useState } from 'react';
import CategoryBar from '@/components/category-bar';
import Navbar from '@/components/Navbar';
import HomeFeed from '@/components/HomeFeed';
import { getPopularVideos, getVideosByCategory, type VideoItem } from '@/lib/youtube';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tv, MonitorSmartphone } from 'lucide-react';

const categories = [
  'Semua', 'Musik', 'Lagu Karaoke', 'Film', 'Kuliner', 'Berita',
  'Horor', 'Wisata', 'TV', 'Komedi', 'Hobi',
];

export default function HomePageContainer() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showCastModal, setShowCastModal] = useState(false);

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
    if (category === 'Semua') {
      newVideos = await getPopularVideos();
    } else {
      newVideos = await getVideosByCategory(category);
    }
    
    if(newVideos.length > 0) {
      sessionStorage.setItem(cacheKey, JSON.stringify(newVideos));
    }

    setVideos(newVideos);
    setLoading(false);
  };

  useEffect(() => {
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

  return (
    <div className="flex flex-col h-full">
        <Navbar onReload={handleReload} onCast={() => setShowCastModal(true)} />
        <div className="sticky top-14 z-10 bg-background/95 backdrop-blur">
             <CategoryBar
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
            />
        </div>
        <main className="flex-1 overflow-y-auto">
            <HomeFeed videos={videos} loading={loading} />
        </main>
        
        {/* Cast Modal using Popover */}
        <Popover open={showCastModal} onOpenChange={setShowCastModal}>
          <PopoverTrigger asChild>
            <div />
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
             <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Sambungkan ke perangkat</h4>
                <p className="text-sm text-muted-foreground">
                  Pilih perangkat untuk melakukan cast.
                </p>
              </div>
              <div className="grid gap-2">
                <Button variant="ghost" className="justify-start">
                  <Tv className="mr-2 h-4 w-4" />
                  TV Ruang Tamu
                </Button>
                <Button variant="ghost" className="justify-start">
                  <MonitorSmartphone className="mr-2 h-4 w-4" />
                  Chromecast Dapur
                </Button>
                 <Button variant="outline" onClick={() => setShowCastModal(false)}>Batal</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
    </div>
  );
}
