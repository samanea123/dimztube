'use server';

// 1. Get all API keys from environment variables
const apiKeys = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
  process.env.YOUTUBE_API_KEY_4,
  process.env.YOUTUBE_API_KEY_5,
].filter((key): key is string => !!key);

let currentApiKeyIndex = 0;

// 2. Function to get the current API key
const getApiKey = () => {
    if (apiKeys.length === 0) return null;
    return apiKeys[currentApiKeyIndex];
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
  channelId?: string; // Made optional as search endpoint doesn't provide it
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
    nextPageToken?: string | null;
}

interface FetchOptions {
    pageToken?: string | null;
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


async function fetchFromYouTube(endpoint: string, params: Record<string, string>, cost: number): Promise<{ response: any; usedApiKeyIndex: number, cost: number } | null> {
    if (apiKeys.length === 0) {
        console.warn('YouTube API keys are not configured. Returning empty video list.');
        return null;
    }

    const initialKeyIndex = currentApiKeyIndex;
    const baseUrl = `https://www.googleapis.com/youtube/v3/${endpoint}`;

    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = getApiKey();
        if (!apiKey) return null;

        const keyIndexToReport = currentApiKeyIndex;
        const url = new URL(baseUrl);
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
        url.searchParams.set('key', apiKey);

        try {
            const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
            const data = await res.json();
            
            if (res.status === 200 && data.items) {
                 return { response: data, usedApiKeyIndex: keyIndexToReport, cost };
            }

            if (data?.error?.errors?.[0]?.reason === "quotaExceeded") {
                console.warn(`API key at index ${currentApiKeyIndex} failed due to quota. Trying next key.`);
                switchToNextApiKey();
                if (currentApiKeyIndex === initialKeyIndex) {
                    console.error('All YouTube API keys have exceeded their quota.');
                    break;
                }
            } else {
                 console.error(`An unexpected error occurred with YouTube API: ${data?.error?.message || 'Unknown error'}`);
                 // Don't retry on other errors
                 return null;
            }
        } catch (error: any) {
            console.error('An unexpected error occurred while fetching from YouTube:', error);
            switchToNextApiKey();
            if (currentApiKeyIndex === initialKeyIndex) {
              console.error('All YouTube API keys have failed after network errors.');
              break;
            }
        }
    }

    console.error('All YouTube API keys have failed.');
    return null;
}

async function processVideoResponse(apiResult: { response: any; usedApiKeyIndex: number, cost: number } | null): Promise<VideoApiResponse> {
    const emptyResponse: VideoApiResponse = { videos: [], apiKeyIndex: -1, totalApiKeys: apiKeys.length, cost: 0, nextPageToken: null };
    if (!apiResult || !apiResult.response || !apiResult.response.items) {
        return emptyResponse;
    }
    
    const { response, usedApiKeyIndex, cost } = apiResult;

    const videoItems: VideoItem[] = [];
    
    const videoIds = response.items.map((item: any) => item.id.videoId || item.id).filter(Boolean);
    
    if (videoIds.length === 0) {
      return { ...emptyResponse, apiKeyIndex: usedApiKeyIndex, cost: cost, nextPageToken: response.nextPageToken || null };
    }
    
    const videoDetailsResult = await fetchFromYouTube('videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoIds.join(','),
    }, 1);


    if (!videoDetailsResult || !videoDetailsResult.response || !videoDetailsResult.response.items) {
      return { ...emptyResponse, apiKeyIndex: usedApiKeyIndex, cost: cost, nextPageToken: response.nextPageToken || null };
    }

    const channelIds = videoDetailsResult.response.items.map((item: any) => item.snippet?.channelId).filter(Boolean);
    const channelAvatars = new Map<string, string>();
    let channelCost = 0;
    if (channelIds.length > 0) {
        channelCost = 1;
        const channelsResult = await fetchFromYouTube('channels', {
          part: 'snippet',
          id: [...new Set(channelIds)].join(','),
        }, 1);

        channelsResult?.response?.items?.forEach((channel: any) => {
            if (channel.id && channel.snippet?.thumbnails?.default?.url) {
                channelAvatars.set(channel.id, channel.snippet.thumbnails.default.url);
            }
        });
    }

    for (const item of videoDetailsResult.response.items) {
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
    const totalCost = cost + (videoDetailsResult.cost || 0) + channelCost;
    return { 
        videos: videoItems, 
        apiKeyIndex: videoDetailsResult.usedApiKeyIndex, 
        totalApiKeys: apiKeys.length, 
        cost: totalCost,
        nextPageToken: response.nextPageToken || null
    };
}


export async function getPopularVideos(options: FetchOptions = {}): Promise<VideoApiResponse> {
  const params: Record<string, string> = {
    part: 'id',
    chart: 'mostPopular',
    regionCode: 'ID',
    maxResults: '20',
  };
  if(options.pageToken) {
    params.pageToken = options.pageToken;
  }
  const apiResult = await fetchFromYouTube('videos', params, 1);
  return processVideoResponse(apiResult);
}

export async function getVideosByCategory(category: string, options: FetchOptions = {}): Promise<VideoApiResponse> {
    const params: Record<string, string> = {
        part: 'id',
        q: category,
        type: 'video',
        maxResults: '20',
        regionCode: 'ID'
    };
    if (options.pageToken) {
        params.pageToken = options.pageToken;
    }
    const apiResult = await fetchFromYouTube('search', params, 100);
    return processVideoResponse(apiResult);
}
