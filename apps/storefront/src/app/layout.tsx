import './globals.css';
import '@cannasaas/ui/src/casual.css';
import '@cannasaas/ui/src/themes/theme.casual.css';
import '@cannasaas/ui/src/themes/theme.dark.css';
import '@cannasaas/ui/src/themes/theme.regal.css';
import '@cannasaas/ui/src/themes/theme.modern.css';
import '@cannasaas/ui/src/themes/theme.minimal.css';
import '@cannasaas/ui/src/themes/theme.apothecary.css';
import '@cannasaas/ui/src/themes/theme.citrus.css';
import '@cannasaas/ui/src/themes/theme.earthy.css';
import '@cannasaas/ui/src/themes/theme.midnight.css';
import '@cannasaas/ui/src/themes/theme.neon.css';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'CannaSaas Dispensary',
  description:
    'Licensed cannabis dispensary — order online for pickup or delivery',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a1a0f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-bg text-txt antialiased min-h-screen flex flex-col"
      >
        <Providers>
          <ThemeProvider />
          <ServiceWorkerRegistrar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
