import './globals.css';

import type { Metadata } from 'next';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AgeGate } from '@/components/AgeGate';

export const metadata: Metadata = {
  title: 'CannaSaas Dispensary',
  description: 'Licensed cannabis dispensary — order online for pickup or delivery',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/all-themes.css" />
      </head>
      <body suppressHydrationWarning className="bg-bg text-txt antialiased min-h-screen flex flex-col">
        <Providers>
          <ThemeProvider />
          <AgeGate>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AgeGate>
        </Providers>
      </body>
    </html>
  );
}
