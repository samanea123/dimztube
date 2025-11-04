import CategoryBar from "@/components/category-bar";
import VideoCard from "@/components/video-card";
import { getPopularVideos, type VideoItem } from "@/lib/youtube";

const categories = [
  "Semua",
  "Musik",
  "Lagu Karaoke",
  "Film",
  "Kuliner",
  "Berita",
  "Horor",
  "Film",
  "Wisata",
  "TV",
  "Komedi",
  "Hobi",
];

export default async function Home() {
  const videos: VideoItem[] = await getPopularVideos();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <CategoryBar categories={categories} />
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </main>
  );
}
