'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const KEY_USAGE_STORAGE_KEY = 'yt_keys_usage';
const QUOTA_LIMIT = 10000;

interface KeyUsage {
  id: number;
  used: number;
}

export default function ApiKeyMonitorPage() {
  const [keys, setKeys] = useState<KeyUsage[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateKeys = () => {
        const stored = JSON.parse(localStorage.getItem(KEY_USAGE_STORAGE_KEY) || "[]");
        setKeys(stored);
    }
    updateKeys();
    
    // Listen for storage changes from the main page
    window.addEventListener('storage', updateKeys);
    return () => window.removeEventListener('storage', updateKeys);
  }, []);

  const getPercent = (used: number) => Math.min((used / QUOTA_LIMIT) * 100, 100);

  const resetUsage = () => {
      if(confirm("Apakah Anda yakin ingin mereset semua penghitung kuota? Aksi ini biasanya dilakukan di awal hari.")) {
        const resetKeys = keys.map(k => ({ ...k, used: 0 }));
        localStorage.setItem(KEY_USAGE_STORAGE_KEY, JSON.stringify(resetKeys));
        setKeys(resetKeys);
      }
  }

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
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
  );
}
