import { Library, History } from 'lucide-react';
import { videos } from '@/lib/data';
import VideoCard from '@/components/video-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LibraryPage() {
  const historyVideos = videos.slice(0, 5);
  const playlistVideos = videos.slice(5, 10);

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <div className="flex items-center gap-4 mb-6">
          <History className="w-8 h-8" />
          <h1 className="text-2xl md:text-3xl font-bold">History</h1>
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {historyVideos.map((video) => (
            <VideoCard key={`history-${video.id}`} video={video} />
          ))}
        </div>
      </div>

      <div className="border-t pt-8">
        <div className="flex items-center gap-4 mb-6">
          <Library className="w-8 h-8" />
          <h1 className="text-2xl md:text-3xl font-bold">Playlists</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Watch Later</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{playlistVideos.length} videos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Liked Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">120 videos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>My Mix</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">50 videos</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
