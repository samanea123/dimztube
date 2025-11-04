'use client';

import { useEffect, useState } from 'react';
import CategoryBar from '@/components/category-bar';
import Navbar from '@/components/Navbar';
import HomeFeed from '@/components/HomeFeed';
import { getPopularVideos, getVideosByCategory, type VideoItem } from '@/lib/youtube';

const categories = [
  'Semua', 'Musik', 'Lagu Karaoke', 'Film', 'Kuliner', 'Berita',
  'Horor', 'Wisata', 'TV', 'Komedi', 'Hobi',
];

export default function HomePageContainer() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

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

  const handleCast = () => {
    if (window.cast && window.cast.framework) {
      const context = cast.framework.CastContext.getInstance();
      const session = context.getCurrentSession();

      if (!session) {
        context.requestSession()
          .then(() => console.log("Sesi Cast berhasil dimulai!"))
          .catch((err) => console.error("Gagal memulai sesi Cast:", err));
      } else {
        // Jika sudah ada sesi, tombol ini akan menghentikannya.
        // Dalam implementasi nyata, Anda mungkin ingin mengubah state ikon.
        context.endCurrentSession(true)
            .then(() => console.log("Sesi Cast dihentikan."))
            .catch((err) => console.error("Gagal menghentikan sesi Cast:", err));
      }
    } else {
      console.warn("Google Cast API tidak tersedia.");
      alert("Fungsi Google Cast tidak tersedia di perangkat atau browser ini.");
    }
  };

  return (
    <div className="flex flex-col h-full">
        <Navbar onReload={handleReload} onCast={handleCast} />
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
    </div>
  );
}
