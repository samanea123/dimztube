// src/app/page.tsx (Next.js app router)
import YouTubeWithCast from '@/components/YouTubeWithCast';

export default function HomePage() {
  return (
    <main className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">DimzTube — YouTube Cast Demo</h1>
      <YouTubeWithCast videoId="dQw4w9WgXcQ" />
    </main>
  );
}
