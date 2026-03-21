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

import type { Metadata } from 'next';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'CannaSaas Dispensary',
  description: 'Licensed cannabis dispensary — order online for pickup or delivery',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-txt antialiased min-h-screen flex flex-col">
        <Providers>
          <ThemeProvider />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
