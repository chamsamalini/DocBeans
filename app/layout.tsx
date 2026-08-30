import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://docbeans.ganga-devi-9467.chatgpt.site'),
  title: 'DocBeans — Knowledge-grounded document creation',
  description: 'Turn a clear five-part brief into a grounded, reviewable and traceable business document.',
  openGraph: {
    title: 'DocBeans — Build better documents, from a better brief.',
    description: 'Grounded. Traceable. Review-ready.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'DocBeans — Build better documents, from a better brief.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DocBeans — Build better documents, from a better brief.',
    description: 'Grounded. Traceable. Review-ready.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
