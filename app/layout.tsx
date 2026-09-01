import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NAJAR Digital Logbook',
  description:
    'Industrial inspection, reporting, analytics, and unit access platform for plant operations.',
  openGraph: {
    title: 'NAJAR Digital Logbook',
    description:
      'Industrial inspection, reporting, analytics, and unit access platform for plant operations.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'NAJAR Digital Logbook industrial inspection platform preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NAJAR Digital Logbook',
    description:
      'Industrial inspection, reporting, analytics, and unit access platform for plant operations.',
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
