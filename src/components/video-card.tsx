import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Video } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

type VideoCardProps = {
  video: Video;
  variant?: 'default' | 'compact';
};

export default function VideoCard({ video, variant = 'default' }: VideoCardProps) {
  const thumbnail = PlaceHolderImages.find((img) => img.id === video.thumbnailId);
  const avatar = PlaceHolderImages.find((img) => img.id === video.channel.avatarId);

  if (variant === 'compact') {
    return (
      <Link href="/watch">
        <div className="flex gap-3">
          <div className="relative aspect-video w-40 flex-shrink-0">
             {thumbnail && (
              <Image
                src={thumbnail.imageUrl}
                alt={video.title}
                fill
                className="rounded-lg object-cover"
                data-ai-hint={thumbnail.imageHint}
              />
            )}
            <Badge variant="secondary" className="absolute bottom-1 right-1">{video.duration}</Badge>
          </div>
          <div className="flex-grow">
            <h3 className="text-sm font-semibold line-clamp-2">{video.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{video.channel.name}</p>
            <p className="text-xs text-muted-foreground">{video.views} views • {video.uploadedAt}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/watch">
      <div className="flex flex-col space-y-2 cursor-pointer">
        <div className="relative aspect-video">
          {thumbnail && (
            <Image
              src={thumbnail.imageUrl}
              alt={video.title}
              fill
              className="rounded-xl object-cover transition-transform group-hover:scale-105"
              data-ai-hint={thumbnail.imageHint}
            />
          )}
          <Badge variant="secondary" className="absolute bottom-2 right-2">{video.duration}</Badge>
        </div>
        <div className="flex gap-3 items-start">
          <Avatar className="mt-1 flex-shrink-0">
            {avatar && <AvatarImage src={avatar.imageUrl} alt={video.channel.name} />}
            <AvatarFallback>{video.channel.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="font-semibold text-base line-clamp-2">{video.title}</h3>
            <div className="text-muted-foreground text-sm mt-1">
              <p>{video.channel.name}</p>
              <p>{video.views} views • {video.uploadedAt}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
