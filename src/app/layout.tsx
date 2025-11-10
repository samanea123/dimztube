
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/layout/bottom-nav";
import { FirebaseClientProvider } from "@/firebase";

export const metadata: Metadata = {
  title: "DimzTube",
  description: "A YouTube-like responsive web application prototype.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const preference = localStorage.getItem('theme');
                  const systemSetting = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (preference === 'dark' || (!preference && systemSetting)) {
                    document.documentElement.classList.add('dark');
                  }

                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').then(function(registration) {
                        console.log('Service Worker registration successful with scope: ', registration.scope);
                      }, function(err) {
                        console.log('Service Worker registration failed: ', err);
                      });
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script src="https://www.gstatic.com/cv/js/sender/v1/cast_framework.js" async></script>
        <script src="https://www.youtube.com/iframe_api" async></script>
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
            <div className="relative flex min-h-screen w-full flex-col">
              <main className="flex-1">
                  {children}
              </main>
              <BottomNav />
              <Toaster />
            </div>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
