import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'DzDigital CRM | Algeria Digital Goods & Sales Tracker',
  description: 'Dual-currency CRM for Algerian digital products sellers. Real net profit, Meta ads attribution, and instant cloud sync.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DzDigital CRM',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0F17',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark h-full", "font-sans", geist.variable)}>
      <body className="h-full bg-[#0B0F17] text-slate-100 antialiased selection:bg-blue-600 selection:text-white overscroll-none">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
