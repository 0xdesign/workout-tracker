import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WorkoutDataProvider } from "@/providers/WorkoutDataProvider";
import { BottomNav } from "@/components/BottomNav";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "A workout tracking app with AI-powered coaching",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Workout Tracker",
  },
};

export const viewport: Viewport = {
  themeColor: "#1F1F1F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="/disable-wallet-conflicts.js" strategy="beforeInteractive" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#1F1F1F]`}
      >
        <WorkoutDataProvider>
          <main className="pb-20">
            {children}
          </main>
          <BottomNav />
        </WorkoutDataProvider>
      </body>
    </html>
  );
}
