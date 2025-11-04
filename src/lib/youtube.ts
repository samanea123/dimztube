'use server';

import { google } from 'googleapis';

// 1. Get all API keys from environment variables
const apiKeys = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
  process.env.YOUTUBE_API_KEY_4,
  process.env.YOUTUBE_API_KEY_5,
].filter((key): key is string => !!key);

let currentApiKeyIndex = 0;

// 2. Function to get the current youtube service instance
const getYoutubeService = () => {
    if (apiKeys.length === 0) {
        return null;
    }
    const apiKey = apiKeys[currentApiKeyIndex];
    return google.youtube({
        version: 'v3',
        auth: apiKey,
    });
}

// 3. Function to switch to the next API key
const switchToNextApiKey = () => {
    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
    console.log(`Switching to YouTube API key index: ${currentApiKeyIndex}`);
};

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

// New response structure that includes monitoring data
export interface VideoApiResponse {
    videos: VideoItem[];
    apiKeyIndex: number;
    totalApiKeys: number;
    cost: number;
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

// 4. Wrap API calls to handle retries with different keys
async function callYoutubeApi(apiCall: (youtube: any) => Promise<any>, cost: number): Promise<{ response: any; usedApiKeyIndex: number, cost: number } | null> {
    if (apiKeys.length === 0) {
        console.warn('YouTube API keys are not configured. Please set YOUTUBE_API_KEY_1, etc. environment variables. Returning empty video list.');
        return null;
    }
    
    const initialKeyIndex = currentApiKeyIndex;

    for (let i = 0; i < apiKeys.length; i++) {
        const youtube = getYoutubeService();
        if (!youtube) return null;

        const keyIndexToReport = currentApiKeyIndex;

        try {
            const response = await apiCall(youtube);
            return { response, usedApiKeyIndex: keyIndexToReport, cost };
        } catch (error: any) {
            // Check for quota exceeded or invalid key errors
            if (error.code === 403 || error.code === 400) {
                console.warn(`API key at index ${currentApiKeyIndex} failed. Reason: ${error.message}. Trying next key.`);
                switchToNextApiKey();
                
                // If we've tried all keys and are back to the start, stop.
                if (currentApiKeyIndex === initialKeyIndex) {
                    console.error('All YouTube API keys have failed. Stopping retries.');
                    break;
                }
            } else {
                console.error('An unexpected error occurred with YouTube API:', error);
                // Don't retry on other errors
                return null;
            }
        }
    }
    
    console.error('All YouTube API keys have failed.');
    return null;
}

async function processVideoResponse(apiResult: { response: any; usedApiKeyIndex: number, cost: number } | null): Promise<VideoApiResponse> {
    const emptyResponse = { videos: [], apiKeyIndex: -1, totalApiKeys: apiKeys.length, cost: 0 };
    if (!apiResult || !apiResult.response || !apiResult.response.data.items) {
        return emptyResponse;
    }
    
    const { response, usedApiKeyIndex, cost } = apiResult;

    const videoItems: VideoItem[] = [];
    
    const videoIds = response.data.items.map((item: any) => item.id.videoId || item.id).filter(Boolean);
    
    if (videoIds.length === 0) {
      return { ...emptyResponse, apiKeyIndex: usedApiKeyIndex, cost: cost };
    }
    
    // Video details cost 1 unit per call.
    const videoDetailsResult = await callYoutubeApi(youtube => youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: videoIds,
    }), 1);

    if (!videoDetailsResult || !videoDetailsResult.response || !videoDetailsResult.response.data.items) {
      return { ...emptyResponse, apiKeyIndex: usedApiKeyIndex, cost: cost };
    }

    const channelIds = videoDetailsResult.response.data.items.map((item: any) => item.snippet?.channelId).filter((id: string | undefined): id is string => !!id);
    
    const channelAvatars = new Map<string, string>();
    let channelCost = 0;
    if (channelIds.length > 0) {
        // Channel details cost 1 unit per call.
        channelCost = 1;
        const channelsResult = await callYoutubeApi(youtube => youtube.channels.list({
          part: ['snippet'],
          id: [...new Set(channelIds)], // Use Set to avoid duplicate IDs
        }), 1);

        channelsResult?.response?.data.items?.forEach((channel: any) => {
            if (channel.id && channel.snippet?.thumbnails?.default?.url) {
                channelAvatars.set(channel.id, channel.snippet.thumbnails.default.url);
            }
        });
    }

    for (const item of videoDetailsResult.response.data.items) {
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
    return { videos: videoItems, apiKeyIndex: usedApiKeyIndex, totalApiKeys: apiKeys.length, cost: cost + videoDetailsResult.cost + channelCost };
}

export async function getPopularVideos(): Promise<VideoApiResponse> {
  // videos.list costs 1 unit.
  const apiResult = await callYoutubeApi(youtube => youtube.videos.list({
    part: ['id'],
    chart: 'mostPopular',
    regionCode: 'ID',
    maxResults: 20,
  }), 1);
  return processVideoResponse(apiResult);
}

export async function getVideosByCategory(category: string): Promise<VideoApiResponse> {
    // search.list costs 100 units.
    const apiResult = await callYoutubeApi(youtube => youtube.search.list({
        part: ['id'],
        q: category,
        type: 'video',
        videoCategoryId: category === 'Musik' ? '10' : undefined,
        maxResults: 20,
        regionCode: 'ID'
    }), 100);
    return processVideoResponse(apiResult);
}
