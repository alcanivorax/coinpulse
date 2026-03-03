import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { fetcher } from '@/lib/coingecko.actions';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CoinPulse',
  description: 'Crypto Screener App with a built-in High-Frequency Terminal & Dashboard',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const trending = await fetcher<{ coins: TrendingCoin[] }>('/search/trending').catch(() => ({ coins: [] }));

  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header trendingCoins={trending.coins} />
        {children}
      </body>
    </html>
  );
}