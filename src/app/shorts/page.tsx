'use client';

import { videos } from '@/lib/data';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const shortsVideos = videos.slice(0, 5);

export default function ShortsPage() {
  const getAvatar = (id: string) => PlaceHolderImages.find((img) => img.id === id);
  const getThumbnail = (id: string) => PlaceHolderImages.find((img) => img.id === id);

  return (
    <div className="relative h-[calc(100vh_-_theme(spacing.14)_-_env(safe-area-inset-bottom))] md:h-[calc(100vh_-_theme(spacing.14))] w-full flex justify-center bg-black">
      <div className="h-full w-full max-w-sm overflow-y-auto snap-y snap-mandatory scroll-smooth">
        {shortsVideos.map((video, index) => (
          <div key={video.id} className="h-full w-full relative flex-shrink-0 snap-start">
            <Image
              src={getThumbnail(video.thumbnailId)?.imageUrl || ''}
              alt={video.title}
              fill
              className="object-cover"
              data-ai-hint="short-form video"
            />
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <div className="flex items-end justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={getAvatar(video.channel.avatarId)?.imageUrl} />
                       <AvatarFallback>{video.channel.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{video.channel.name}</p>
                    <Button size="sm" className="bg-white text-black hover:bg-white/90 h-8">Subscribe</Button>
                  </div>
                  <h3 className="font-medium">{video.title}</h3>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
                    <ThumbsUp className="h-7 w-7" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
                    <ThumbsDown className="h-7 w-7" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
                    <MessageCircle className="h-7 w-7" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
                    <Share2 className="h-7 w-7" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
