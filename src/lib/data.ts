// src/lib/data.ts
// Fungsi dan data dummy supaya build tidak error.
// Nanti bisa lo ganti dengan data real (misal ambil dari YouTube API).

export const sampleVideos = [
  {
    id: "dQw4w9WgXcQ",
    title: "Contoh Video",
    channel: "DimzTube Official",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  },
];

export const getVideos = async () => {
  // Placeholder fetch function
  return sampleVideos;
};
