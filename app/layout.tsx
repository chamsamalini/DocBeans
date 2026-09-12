import type { Metadata } from 'next';
import { Montserrat, Playfair_Display, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const sourceSans = Source_Sans_3({
  variable: '--font-source-sans',
  subsets: ['latin'],
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://docbeans.ganga-devi-9467.chatgpt.site'),
  title: 'DocBeans — Knowledge-grounded document creation',
  description: 'Develop grounded, reviewable and traceable business documents from trusted knowledge and a clear content brief.',
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
        className={`${sourceSans.variable} ${montserrat.variable} ${playfair.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
