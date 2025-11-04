export type Channel = {
  id: string;
  name: string;
  avatarId: string;
  subscribers: string;
};

export type Video = {
  id: string;
  title: string;
  thumbnailId: string;
  channel: Channel;
  views: string;
  uploadedAt: string;
  description: string;
};

export type Comment = {
  id: string;
  author: {
    name: string;
    avatarId: string;
  };
  timestamp: string;
  text: string;
  likes: number;
};

export const channels: Channel[] = [
  { id: 'ch1', name: 'Music World', avatarId: 'avatar4', subscribers: '1.2M' },
  { id: 'ch2', name: 'GamerZone', avatarId: 'avatar3', subscribers: '3.5M' },
  { id: 'ch3', name: 'Movie Buffs', avatarId: 'avatar5', subscribers: '800K' },
  { id: 'ch4', name: 'Code Masters', avatarId: 'avatar2', subscribers: '450K' },
  { id: 'ch5', name: 'Art & Design', avatarId: 'avatar6', subscribers: '620K' },
  { id: 'ch6', name: 'Tech Today', avatarId: 'avatar1', subscribers: '2.1M' },
];

export const videos: Video[] = [
  {
    id: 'vid1',
    title: 'Top 10 Hits of the Summer - Official Music Video Compilation',
    thumbnailId: 'thumbnail10',
    channel: channels[0],
    views: '15M',
    uploadedAt: '2 weeks ago',
    description: 'Enjoy the best music of this summer. A compilation of top 10 hits that will make you dance. Subscribe for more music content!'
  },
  {
    id: 'vid2',
    title: 'Pro Gameplay Walkthrough - Final Boss Battle',
    thumbnailId: 'thumbnail3',
    channel: channels[1],
    views: '2.3M',
    uploadedAt: '3 days ago',
    description: 'Watch as I defeat the final boss in the new hit game. This was a tough one! Let me know your thoughts in the comments.'
  },
  {
    id: 'vid3',
    title: 'Upcoming Movies 2025 - Official Trailer Compilation',
    thumbnailId: 'thumbnail5',
    channel: channels[2],
    views: '5.1M',
    uploadedAt: '1 month ago',
    description: 'Check out the most anticipated movie trailers of 2025. Which one are you most excited for?'
  },
  {
    id: 'vid4',
    title: 'Learn React in 60 Minutes - Full Course for Beginners',
    thumbnailId: 'thumbnail7',
    channel: channels[3],
    views: '1.8M',
    uploadedAt: '5 months ago',
    description: 'A comprehensive guide to learning React for beginners. We cover components, hooks, and state management.'
  },
  {
    id: 'vid5',
    title: 'Digital Painting Timelapse - Fantasy Landscape',
    thumbnailId: 'thumbnail1',
    channel: channels[4],
    views: '750K',
    uploadedAt: '6 days ago',
    description: 'A relaxing timelapse of me creating a fantasy landscape from scratch using digital painting tools.'
  },
  {
    id: 'vid6',
    title: 'The Future of AI - Top 5 Gadgets You Must See',
    thumbnailId: 'thumbnail8',
    channel: channels[5],
    views: '4.2M',
    uploadedAt: '1 week ago',
    description: 'Reviewing the most innovative AI-powered gadgets of the year. The future is here!'
  },
  {
    id: 'vid7',
    title: 'Creating a Hit Song - Studio Session Behind The Scenes',
    thumbnailId: 'thumbnail4',
    channel: channels[0],
    views: '980K',
    uploadedAt: '2 months ago',
    description: 'Go behind the scenes with us in the studio as we produce a new hit track from start to finish.'
  },
  {
    id: 'vid8',
    title: 'E-Sports Finals - The Winning Moment',
    thumbnailId: 'thumbnail12',
    channel: channels[1],
    views: '3.9M',
    uploadedAt: '1 day ago',
    description: 'The incredible final moments of the international e-sports championship. History was made!'
  },
];

export const comments: Comment[] = [
    { 
        id: 'com1', 
        author: { name: 'Alex', avatarId: 'avatar1' }, 
        timestamp: '2 hours ago', 
        text: 'This is amazing! Thanks for sharing.',
        likes: 125
    },
    { 
        id: 'com2', 
        author: { name: 'Jane', avatarId: 'avatar3' }, 
        timestamp: '5 hours ago', 
        text: 'I learned so much from this video. Really helpful content.',
        likes: 240
    },
    { 
        id: 'com3', 
        author: { name: 'Sam', avatarId: 'avatar2' }, 
        timestamp: '1 day ago', 
        text: 'Can you make a video about Vue.js next? Great tutorial!',
        likes: 88
    },
    { 
        id: 'com4', 
        author: { name: 'Chris', avatarId: 'avatar5' }, 
        timestamp: '3 days ago', 
        text: 'That boss battle was intense! Awesome skills.',
        likes: 312
    },
];
