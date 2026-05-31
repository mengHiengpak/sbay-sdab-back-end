import './globals.css';
import { Space_Grotesk, DM_Serif_Display, JetBrains_Mono } from 'next/font/google';
import ClientShell from '@/components/ClientShell';
import type { ReactNode } from 'react';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-dm-serif',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Sbay Sdab — Video & Music Downloader',
  description: 'ទាញ់យក និង Play Video/Music ពី Platform ទាំងអស់',
};

export const viewport = {
  themeColor: '#0a0a0f',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="km" className={`${spaceGrotesk.variable} ${dmSerifDisplay.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
