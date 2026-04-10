// v1.1 - force redeploy
import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Nocked — Field Archery Calculator',
  description: 'Calculate perfect sight marks, track scores, and analyze your performance. The ultimate tool for field archers.',
  openGraph: {
    title: 'Nocked — Field Archery Calculator',
    description: 'Calculate perfect sight marks, track scores, and analyze your performance.',
    url: 'https://nocked.vercel.app',
    siteName: 'Nocked',
    images: [
      {
        url: 'https://nocked.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nocked — Field Archery Calculator',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nocked — Field Archery Calculator',
    description: 'Calculate perfect sight marks, track scores, and analyze your performance.',
    images: ['https://nocked.vercel.app/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#141414', color: '#fff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              const theme = localStorage.getItem('nocked_theme') || 'dark';
              document.body.style.background = theme === 'light' ? '#f5f5f5' : '#141414';
              document.body.style.color = theme === 'light' ? '#111' : '#fff';
            } catch(e) {}
          `
        }} />
        <Header />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
