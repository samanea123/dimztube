import { PlaceHolderImages } from './placeholder-images';

export type Channel = {
  id: string;
  name: string;
  avatarId: string;
  subscribers: string;
};

export type Video = {
  id: string;
  thumbnailId: string;
  duration: string;
  title: string;
  description: string;
  channel: Channel;
  views: string;
  uploadedAt: string;
};

export type Comment = {
    id: string;
    author: {
        name: string;
        avatarId: string;
    };
    text: string;
    timestamp: string;
    likes: number;
}

const findImage = (id: string) => {
    const image = PlaceHolderImages.find(img => img.id === id);
    if (!image) {
        // In a real app, you'd have a fallback image. Here we use a placeholder if not found.
        return "https://picsum.photos/seed/fallback/48/48";
    }
    return image.imageUrl;
}

export const channels: Channel[] = [
  { id: 'ch1', name: 'Creative Minds', avatarId: 'avatar1', subscribers: '1.2M' },
  { id: 'ch2', name: 'TechExplained', avatarId: 'avatar2', subscribers: '5.8M' },
  { id: 'ch3', name: 'GamerX', avatarId: 'avatar3', subscribers: '3.1M' },
  { id: 'ch4', name: 'MusicVibes', avatarId: 'avatar4', subscribers: '10.5M' },
  { id: 'ch5', name: 'CineFix', avatarId: 'avatar5', subscribers: '2.4M' },
  { id: 'ch6', name: 'LiveNow', avatarId: 'avatar6', subscribers: '890K' },
];

export const videos: Video[] = [
  {
    id: 'vid1',
    thumbnailId: 'thumbnail1',
    duration: '10:45',
    title: 'Building a Responsive UI with Next.js',
    description: "A deep dive into creating modern user interfaces that work on all devices. We'll cover Tailwind CSS, responsive design principles, and more.",
    channel: channels[1],
    views: '1.2M',
    uploadedAt: '2 weeks ago',
  },
  {
    id: 'vid2',
    thumbnailId: 'thumbnail2',
    duration: '1:12:30',
    title: 'Fullstack Development in 2024',
    description: "Everything you need to know to become a fullstack developer. From frontend frameworks to backend architecture.",
    channel: channels[0],
    views: '3.4M',
    uploadedAt: '1 month ago',
  },
  {
    id: 'vid3',
    thumbnailId: 'thumbnail3',
    duration: '25:10',
    title: 'The Future of Gaming: Unreal Engine 5',
    description: "Exploring the groundbreaking features of Unreal Engine 5 and what they mean for the future of video games.",
    channel: channels[2],
    views: '876K',
    uploadedAt: '3 days ago',
  },
  {
    id: 'vid4',
    thumbnailId: 'thumbnail4',
    duration: '04:30',
    title: 'Lofi Beats to Relax/Study to',
    description: "A continuous mix of the best lofi hip hop beats to help you focus, relax, or study. Tune in and chill out.",
    channel: channels[3],
    views: '15M',
    uploadedAt: '1 year ago',
  },
  {
    id: 'vid5',
    thumbnailId: 'thumbnail5',
    duration: '15:00',
    title: 'Top 10 Movies of the Decade',
    description: "We're counting down the most influential and unforgettable films from the past ten years. Did your favorite make the list?",
    channel: channels[4],
    views: '2.1M',
    uploadedAt: '6 months ago',
  },
  {
    id: 'vid6',
    thumbnailId: 'thumbnail6',
    duration: 'LIVE',
    title: 'Live Q&A with the Developers',
    description: "Join us for a live session where we answer your questions about our latest projects and what's coming next.",
    channel: channels[5],
    views: '12K watching',
    uploadedAt: 'Now',
  },
  {
    id: 'vid7',
    thumbnailId: 'thumbnail7',
    duration: '08:22',
    title: 'Mastering CSS Grid in 8 Minutes',
    description: "A quick and easy guide to understanding and using CSS Grid for powerful and flexible layouts.",
    channel: channels[0],
    views: '450K',
    uploadedAt: '3 weeks ago',
  },
  {
    id: 'vid8',
    thumbnailId: 'thumbnail8',
    duration: '30:05',
    title: 'New Gadgets of 2024 Reviewed',
    description: "An in-depth review of the most exciting tech gadgets released this year. Are they worth your money?",
    channel: channels[1],
    views: '998K',
    uploadedAt: '1 week ago',
  },
  {
    id: 'vid9',
    thumbnailId: 'thumbnail9',
    duration: '18:40',
    title: 'Indie Game Gems You Must Play',
    description: "Discover hidden indie game treasures that you might have missed. These are the games that deserve your attention.",
    channel: channels[2],
    views: '312K',
    uploadedAt: '5 days ago',
  },
  {
    id: 'vid10',
    thumbnailId: 'thumbnail10',
    duration: '03:56',
    title: 'Summer Pop Hits - Official Music Video',
    description: "The official music video for the biggest pop anthem of the summer. Turn up the volume and enjoy!",
    channel: channels[3],
    views: '25M',
    uploadedAt: '2 months ago',
  },
  {
    id: 'vid11',
    thumbnailId: 'thumbnail11',
    duration: '22:18',
    title: 'Deconstructing a Movie Scene: The Art of Editing',
    description: "We break down a famous movie scene to analyze how editing techniques create tension, emotion, and narrative flow.",
    channel: channels[4],
    views: '750K',
    uploadedAt: '4 months ago',
  },
  {
    id: 'vid12',
    thumbnailId: 'thumbnail12',
    duration: 'LIVE',
    title: 'Major E-Sports Tournament Finals',
    description: "The final match of the international e-sports championship. Who will take home the grand prize?",
    channel: channels[5],
    views: '150K watching',
    uploadedAt: 'Now',
  },
];

export const categories = [
  'Semua',
  'Musik',
  'Lagu Karaoke',
  'Film',
  'Kuliner',
  'Berita',
  'Horor',
  'Film',
  'Wisata',
  'Trailer',
  'Komedi',
  'Hobi',
];

export const comments: Comment[] = [
    {
        id: 'com1',
        author: { name: 'Alice', avatarId: 'avatar2' },
        text: 'This was incredibly helpful, thank you!',
        timestamp: '2 hours ago',
        likes: 125,
    },
    {
        id: 'com2',
        author: { name: 'Bob', avatarId: 'avatar3' },
        text: 'Could you do a video on server components next?',
        timestamp: '1 hour ago',
        likes: 88,
    },
    {
        id: 'com3',
        author: { name: 'Charlie', avatarId: 'avatar4' },
        text: 'Finally, an explanation that makes sense. Great job!',
        timestamp: '30 minutes ago',
        likes: 210,
    }
]
