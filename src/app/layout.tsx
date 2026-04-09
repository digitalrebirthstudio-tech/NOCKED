import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
