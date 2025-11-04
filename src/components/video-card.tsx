import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { VideoItem } from '@/lib/youtube';
import { cn } from '@/lib/utils';

type VideoCardProps = {
  video: VideoItem;
  variant?: 'default' | 'compact';
  onVideoClick?: () => void;
};

export default function VideoCard({ video, variant = 'default', onVideoClick }: VideoCardProps) {
  const cardContent = (
    <div 
      className={cn(
        variant === 'default' ? 'flex flex-col space-y-2' : 'flex gap-3',
        onVideoClick && 'cursor-pointer group'
      )}
      onClick={onVideoClick}
    >
      <div className={cn(
        "relative aspect-video",
        variant === 'default' ? 'w-full' : 'w-40 flex-shrink-0'
      )}>
         {video.thumbnailUrl && (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="rounded-lg object-cover transition-transform group-hover:scale-105"
            data-ai-hint="video thumbnail"
          />
        )}
        <Badge variant="secondary" className="absolute bottom-1 right-1">{video.duration}</Badge>
      </div>
      <div className={cn(variant === 'compact' && 'flex-grow')}>
        <div className={cn(variant === 'default' && 'flex gap-3 items-start')}>
          {variant === 'default' && (
            <Avatar className="mt-1 flex-shrink-0">
              {video.channelAvatarUrl && <AvatarImage src={video.channelAvatarUrl} alt={video.channelTitle} />}
              <AvatarFallback>{video.channelTitle.slice(0, 1)}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <h3 className={cn(
              'line-clamp-2',
              variant === 'default' ? 'font-semibold text-base' : 'text-sm font-semibold'
            )}>{video.title}</h3>
            <div className={cn(
              'text-muted-foreground',
              variant === 'default' ? 'text-sm mt-1' : 'text-xs mt-1'
            )}>
              <p>{video.channelTitle}</p>
              <p>{video.viewCount} views • {video.publishedAt}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (onVideoClick) {
    return cardContent;
  }

  return (
    <Link href={`/watch?v=${video.id}`}>
      {cardContent}
    </Link>
  );
}
