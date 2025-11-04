import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Play, Plus } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Video } from '@/lib/data';

type VideoCardProps = {
  video: Video;
  variant?: 'default' | 'compact';
  onPlay?: () => void;
  onAddToQueue?: () => void;
};

export default function VideoCard({ video, variant = 'default', onPlay, onAddToQueue }: VideoCardProps) {
  
  const thumbnail = PlaceHolderImages.find(img => img.id === video.thumbnailId);
  const avatar = PlaceHolderImages.find(img => img.id === video.channel.avatarId);

  const cardContent = (
    <>
      <div className={cn(
        "relative aspect-video",
        variant === 'default' ? 'w-full' : 'w-40 flex-shrink-0'
      )}>
         {thumbnail && (
          <Image
            src={thumbnail.imageUrl}
            alt={video.title}
            fill
            className="rounded-lg object-cover transition-transform group-hover:scale-105"
            data-ai-hint="video thumbnail"
          />
        )}
      </div>
      <div className={cn('flex-grow', variant === 'default' ? 'mt-3' : 'ml-3')}>
        <div className="flex gap-3 items-start">
          {variant === 'default' && (
            <Avatar className="mt-1 flex-shrink-0">
              {avatar && <AvatarImage src={avatar.imageUrl} alt={video.channel.name} />}
              <AvatarFallback>{video.channel.name.slice(0, 1)}</AvatarFallback>
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
              <p>{video.channel.name}</p>
              <p>{video.views} views • {video.uploadedAt}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const containerClasses = cn(
    "group",
    variant === 'compact' ? 'flex items-start' : 'flex flex-col'
  );
  
  if (!onPlay && !onAddToQueue) {
    return (
      <Link href={`/watch?v=${video.id}`} className={containerClasses}>
        {cardContent}
      </Link>
    );
  }
  
  return (
     <div className="flex flex-col space-y-2">
      <div className="group cursor-pointer" onClick={onPlay}>
         <div className={cn(
            "relative aspect-video",
            variant === 'default' ? 'w-full' : 'w-40 flex-shrink-0'
          )}>
             {thumbnail && (
              <Image
                src={thumbnail.imageUrl}
                alt={video.title}
                fill
                className="rounded-lg object-cover transition-transform group-hover:scale-105"
                data-ai-hint="video thumbnail"
              />
            )}
          </div>
      </div>

       <div className={cn('flex-grow', variant === 'default' ? 'mt-3' : 'ml-3')}>
        <div className="flex gap-3 items-start">
          {variant === 'default' && (
            <Avatar className="mt-1 flex-shrink-0">
              {avatar && <AvatarImage src={avatar.imageUrl} alt={video.channel.name} />}
              <AvatarFallback>{video.channel.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <h3 className={cn(
              'line-clamp-2',
              'font-semibold text-base'
            )}>{video.title}</h3>
            <div className={cn(
              'text-muted-foreground',
              'text-sm mt-1'
            )}>
              <p>{video.channel.name}</p>
              <p>{video.views} views • {video.uploadedAt}</p>
            </div>
          </div>
        </div>
      </div>

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
