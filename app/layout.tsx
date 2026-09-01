import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NAJAR Digital Logbook',
  description:
    'Daily boiler and autoclave meter-photo reading logbook for assigned plant units.',
  openGraph: {
    title: 'NAJAR Digital Logbook',
    description:
      'Daily boiler and autoclave meter-photo reading logbook for assigned plant units.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'NAJAR Digital Logbook meter reading platform preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NAJAR Digital Logbook',
    description:
      'Daily boiler and autoclave meter-photo reading logbook for assigned plant units.',
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
      <body>{children}</body>
    </html>
  );
}
