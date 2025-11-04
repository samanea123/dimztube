import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { VideoItem } from '@/lib/youtube';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Play, Plus } from 'lucide-react';

type VideoCardProps = {
  video: VideoItem;
  variant?: 'default' | 'compact';
  onPlay?: () => void;
  onAddToQueue?: () => void;
};

export default function VideoCard({ video, variant = 'default', onPlay, onAddToQueue }: VideoCardProps) {
  const commonCardContent = (
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
  );

  const textContent = (
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
  );
  
  // If no actions, wrap with Link component for default navigation
  if (!onPlay && !onAddToQueue) {
    return (
      <Link href={`/watch?v=${video.id}`} className="flex flex-col space-y-2 group">
        {commonCardContent}
        {textContent}
      </Link>
    );
  }
  
  // Otherwise, the div with buttons handles interactions
  return (
     <div className="flex flex-col space-y-2">
      <div className="group cursor-pointer" onClick={onPlay}>
        {commonCardContent}
      </div>
      {textContent}
      <div className="flex gap-2 pt-1">
        {onPlay && (
          <Button onClick={onPlay} size="sm" className="flex-1">
            <Play className="mr-2 h-4 w-4" />
            Play
          </Button>
        )}
        {onAddToQueue && (
          <Button onClick={onAddToQueue} size="sm" variant="secondary" className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            Queue
          </Button>
        )}
      </div>
    </div>
  );
}
