'use client';

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ArrowLeft, Trash2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const KEY_USAGE_STORAGE_KEY = 'yt_keys_usage';
const CUSTOM_AVATAR_KEY = 'dimztubeCustomAvatar';
const QUOTA_LIMIT = 10000;

interface KeyUsage {
  id: number;
  used: number;
}

export default function ApiKeyMonitorPage() {
  const [keys, setKeys] = useState<KeyUsage[]>([]);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultAvatar = PlaceHolderImages.find(img => img.id === 'avatar1')?.imageUrl;

  useEffect(() => {
    setIsClient(true);
    const storedUsage = JSON.parse(localStorage.getItem(KEY_USAGE_STORAGE_KEY) || "[]");
    setKeys(storedUsage);
    
    const storedAvatar = localStorage.getItem(CUSTOM_AVATAR_KEY);
    setCustomAvatar(storedAvatar);

    const handleStorageChange = () => {
        const storedUsage = JSON.parse(localStorage.getItem(KEY_USAGE_STORAGE_KEY) || "[]");
        setKeys(storedUsage);
        const storedAvatar = localStorage.getItem(CUSTOM_AVATAR_KEY);
        setCustomAvatar(storedAvatar);
    }
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getPercent = (used: number) => Math.min((used / QUOTA_LIMIT) * 100, 100);

  const resetUsage = () => {
      if(confirm("Apakah Anda yakin ingin mereset semua penghitung kuota? Aksi ini biasanya dilakukan di awal hari.")) {
        const resetKeys = keys.map(k => ({ ...k, used: 0 }));
        localStorage.setItem(KEY_USAGE_STORAGE_KEY, JSON.stringify(resetKeys));
        setKeys(resetKeys);
      }
  }
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        localStorage.setItem(CUSTOM_AVATAR_KEY, dataUrl);
        setCustomAvatar(dataUrl);
        window.dispatchEvent(new Event('storage')); // Notify other tabs/windows
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomAvatar = () => {
    localStorage.removeItem(CUSTOM_AVATAR_KEY);
    setCustomAvatar(null);
    window.dispatchEvent(new Event('storage'));
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="mb-4">
            <Button asChild variant="ghost">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Halaman Utama
                </Link>
            </Button>
        </div>

        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>🖼️ Ganti Foto Profil</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={customAvatar || defaultAvatar} alt="User Avatar" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Pilih gambar dari perangkat Anda untuk dijadikan foto profil baru.
                        </p>
                        <div className="flex gap-2">
                             <Button onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4"/> Pilih Gambar
                            </Button>
                            {customAvatar && (
                                <Button variant="destructive" onClick={removeCustomAvatar}>
                                    <Trash2 className="mr-2 h-4 w-4"/> Hapus Gambar
                                </Button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>🔋 Pemakaian Kuota API YouTube</span>
                        <Button onClick={resetUsage} variant="destructive" size="sm">
                            Reset Kuota Harian
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-6">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Informasi Penting</AlertTitle>
                        <AlertDescription>
                            <p>Halaman ini menampilkan estimasi penggunaan kuota API YouTube berdasarkan aktivitas Anda di aplikasi ini. Pelacakan terjadi di browser Anda dan akan direset jika Anda membersihkan data situs.</p>
                            <p className="mt-2">Kuota harian YouTube direset pada tengah malam waktu Pasifik (sekitar jam 14:00 atau 15:00 WIB). Tekan tombol reset secara manual setiap hari untuk sinkronisasi.</p>
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        {keys.length > 0 ? keys.map((k) => (
                        <div key={k.id} className="bg-muted/50 p-3 rounded-lg border">
                            <div className="flex justify-between items-center mb-1 text-sm">
                            <span className="font-semibold text-foreground">API Key #{k.id + 1}</span>
                            <span className="font-mono text-muted-foreground">{k.used.toLocaleString()} / {QUOTA_LIMIT.toLocaleString()} unit</span>
                            </div>
                            <Progress value={getPercent(k.used)} />
                            {getPercent(k.used) > 95 && (
                            <p className="text-xs text-destructive mt-1">Peringatan: Kuota hampir habis.</p>
                            )}
                        </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">Belum ada aktivitas API yang tercatat. Coba muat ulang halaman utama untuk memulai pelacakan.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
