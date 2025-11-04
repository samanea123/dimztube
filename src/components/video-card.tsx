import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { VideoItem } from '@/lib/youtube';
import { cn } from '@/lib/utils';

type VideoCardProps = {
  video: VideoItem;
  variant?: 'default' | 'compact';
};

export default function VideoCard({ video, variant = 'default' }: VideoCardProps) {
  if (variant === 'compact') {
    return (
      <Link href={`/watch?v=${video.id}`}>
        <div className="flex gap-3">
          <div className="relative aspect-video w-40 flex-shrink-0">
             {video.thumbnailUrl && (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="rounded-lg object-cover"
                data-ai-hint="video thumbnail"
              />
            )}
            <Badge variant="secondary" className="absolute bottom-1 right-1">{video.duration}</Badge>
          </div>
          <div className="flex-grow">
            <h3 className="text-sm font-semibold line-clamp-2">{video.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
            <p className="text-xs text-muted-foreground">{video.viewCount} views • {video.publishedAt}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/watch?v=${video.id}`}>
      <div className="flex flex-col space-y-2 cursor-pointer">
        <div className="relative aspect-video">
          {video.thumbnailUrl && (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="rounded-xl object-cover transition-transform group-hover:scale-105"
              data-ai-hint="video thumbnail"
            />
          )}
          <Badge variant="secondary" className="absolute bottom-2 right-2">{video.duration}</Badge>
        </div>
        <div className="flex gap-3 items-start">
          <Avatar className="mt-1 flex-shrink-0">
            {video.channelAvatarUrl && <AvatarImage src={video.channelAvatarUrl} alt={video.channelTitle} />}
            <AvatarFallback>{video.channelTitle.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="font-semibold text-base line-clamp-2">{video.title}</h3>
            <div className="text-muted-foreground text-sm mt-1">
              <p>{video.channelTitle}</p>
              <p>{video.viewCount} views • {video.publishedAt}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
