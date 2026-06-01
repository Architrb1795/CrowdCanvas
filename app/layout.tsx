import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import { GlobalDialogProvider } from '@/components/providers/GlobalDialogProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CrowdCanvas | AI-Powered Event & Media Management',
  description:
    'The premium event and media management platform for clubs, photographers, and communities.',
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
