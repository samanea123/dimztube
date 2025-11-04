import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VideoCard from "@/components/video-card";
import { videos, comments } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ThumbsUp, ThumbsDown, Share2, MessageCircle } from "lucide-react";

export default function WatchPage() {
  const mainVideo = videos[0];
  const suggestedVideos = videos.slice(1);
  const getAvatar = (id: string) => PlaceHolderImages.find(img => img.id === id);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
      <div className="lg:w-2/3 w-full">
        <AspectRatio ratio={16 / 9} className="bg-muted rounded-xl overflow-hidden">
          <div className="w-full h-full bg-black flex items-center justify-center">
            <p className="text-muted-foreground">Video Player</p>
          </div>
        </AspectRatio>
        <div className="py-4">
          <h1 className="text-xl font-bold">{mainVideo.title}</h1>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={getAvatar(mainVideo.channel.avatarId)?.imageUrl} />
                <AvatarFallback>{mainVideo.channel.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{mainVideo.channel.name}</p>
                <p className="text-sm text-muted-foreground">{mainVideo.channel.subscribers} subscribers</p>
              </div>
              <Button className="ml-4 bg-primary text-primary-foreground hover:bg-primary/90">Subscribe</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost">
                <ThumbsUp className="mr-2 h-4 w-4" /> {mainVideo.views}
              </Button>
              <Button variant="ghost">
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 mt-4">
          <p className="font-semibold">{mainVideo.views} views • {mainVideo.uploadedAt}</p>
          <p className="text-sm mt-2">{mainVideo.description}</p>
        </div>
        <div className="mt-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5" />
                <span>{comments.length} Comments</span>
            </h2>
            <div className="flex items-center gap-3 mb-6">
                <Avatar>
                    <AvatarImage src={getAvatar('avatar1')?.imageUrl} />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <Input placeholder="Add a comment..." />
            </div>
            <div className="space-y-6">
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={getAvatar(comment.author.avatarId)?.imageUrl} />
                            <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{comment.author.name}</p>
                                <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                            </div>
                            <p>{comment.text}</p>
                            <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                                <button className="flex items-center gap-1 text-xs"><ThumbsUp className="w-3 h-3" /> {comment.likes}</button>
                                <button className="flex items-center gap-1 text-xs"><ThumbsDown className="w-3 h-3" /></button>
                                <button className="text-xs font-semibold">Reply</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
      <div className="lg:w-1/3 w-full space-y-4">
        {suggestedVideos.map(video => (
            <VideoCard key={video.id} video={video} variant="compact" />
        ))}
      </div>
    </div>
  );
}
