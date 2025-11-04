'use server';

import { google } from 'googleapis';

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  throw new Error('YouTube API key is not configured. Please set YOUTUBE_API_KEY environment variable.');
}

const youtube = google.youtube({
  version: 'v3',
  auth: API_KEY,
});

export interface VideoItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId: string;
  viewCount: string;
  publishedAt: string;
  duration: string; 
  channelAvatarUrl?: string;
  description?: string;
}

const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';

  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatViews = (views: string): string => {
    const num = parseInt(views);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
};

const formatPublishedAt = (publishedAt: string): string => {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
};

export async function getPopularVideos(): Promise<VideoItem[]> {
  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      chart: 'mostPopular',
      regionCode: 'ID',
      maxResults: 20,
    });

    const videoItems: VideoItem[] = [];
    if (response.data.items) {
      const channelIds = response.data.items.map(item => item.snippet?.channelId).filter((id): id is string => !!id);
      const channelsResponse = await youtube.channels.list({
          part: ['snippet'],
          id: channelIds,
      });

      const channelAvatars = new Map<string, string>();
      channelsResponse.data.items?.forEach(channel => {
          if (channel.id && channel.snippet?.thumbnails?.default?.url) {
              channelAvatars.set(channel.id, channel.snippet.thumbnails.default.url);
          }
      });

      for (const item of response.data.items) {
        if (item.id && item.snippet && item.contentDetails && item.statistics) {
          videoItems.push({
            id: item.id,
            title: item.snippet.title || 'No title',
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
            channelTitle: item.snippet.channelTitle || 'Unknown channel',
            channelId: item.snippet.channelId || '',
            viewCount: formatViews(item.statistics.viewCount || '0'),
            publishedAt: formatPublishedAt(item.snippet.publishedAt || ''),
            duration: formatDuration(item.contentDetails.duration || ''),
            channelAvatarUrl: channelAvatars.get(item.snippet.channelId || '')
          });
        }
      }
    }
    return videoItems;
  } catch (error) {
    console.error('Error fetching popular videos:', error);
    return [];
  }
}
