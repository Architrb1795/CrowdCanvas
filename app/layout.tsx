import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import { GlobalDialogProvider } from '@/components/providers/GlobalDialogProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CrowdCanvas | AI-Powered Event & Media Management',
  description: 'The premium event and media management platform for clubs, photographers, and communities.',
  metadataBase: new URL('https://crowdcanvas.app'), // Replace with actual production domain when ready
  openGraph: {
    title: 'CrowdCanvas | Intelligent Event Hub',
    description: 'Discover events, join communities, and find photos of yourself instantly with AI facial recognition.',
    url: 'https://crowdcanvas.app',
    siteName: 'CrowdCanvas',
    images: [
      {
        url: '/favicon.ico', // Re-using favicon as social share logo as requested
        width: 800,
        height: 800,
        alt: 'CrowdCanvas Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrowdCanvas | Intelligent Event Hub',
    description: 'Discover events, join communities, and find photos of yourself instantly with AI facial recognition.',
    images: ['/favicon.ico'], // Re-using favicon as logo
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark-theme bg-slate-950 text-slate-50">
      <body className={`${inter.className} min-h-screen bg-slate-950 flex flex-col`}>
        <GlobalDialogProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
        </GlobalDialogProvider>
      </body>
    </html>
  );
}
