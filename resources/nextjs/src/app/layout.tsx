import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "CheckHub - The World's Most Important Touch Guide | Early Detection Saves Lives",
  description:
    'CheckHub looks provocative, but delivers life-saving breast cancer awareness, self-examination guides, and early detection information. 1 in 8 women will be diagnosed. Check yourself today.',
  keywords: [
    'breast cancer awareness',
    'self exam guide',
    'early detection',
    'mammogram',
    'checkhub',
    'breast health',
  ],
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%237c1fb8"/><text x="50" y="72" font-size="66" font-family="Arial" font-weight="bold" text-anchor="middle" fill="%23ffffff">C</text></svg>',
  },
  openGraph: {
    title: 'CheckHub - Breast Cancer Awareness & Early Detection',
    description: '1 in 8 women will be diagnosed with breast cancer. Learn the life-saving monthly touch routine and early detection techniques.',
    url: 'https://checkhub.org',
    siteName: 'CheckHub',
    images: [
      {
        url: '/images/thumb_1.jpg',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="dark-theme">{children}</body>
    </html>
  );
}
