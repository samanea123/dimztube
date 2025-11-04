import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import Script from "next/script";

export const metadata: Metadata = {
  title: "DimzTube",
  description: "A YouTube-like responsive web application prototype.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
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
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <div className="relative flex min-h-screen w-full flex-col">
          <Header />
          <div className="flex flex-1">
            <main className="flex-1 !bg-background">
              {children}
            </main>
          </div>
          <BottomNav />
          <Toaster />
        </div>
        <Script src="https://www.gstatic.com/cv/js/sender/v1/cast_framework.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
