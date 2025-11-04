import { channels, videos } from '@/lib/data';
import VideoCard from '@/components/video-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function SubscriptionsPage() {
  const getAvatar = (id: string) => PlaceHolderImages.find(img => img.id === id);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">Latest</h1>
        
        <div className="mb-8">
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {channels.map(channel => (
              <div key={channel.id} className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={getAvatar(channel.avatarId)?.imageUrl} />
                  <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-xs text-center truncate w-full">{channel.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </div>
  );
}
