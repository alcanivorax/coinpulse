'use client';

import { useCoinGeckoWebSocket } from '@/hooks/useCoinGeckoWebSocket';
import { cn, formatCurrency, formatPercentage, trendingClasses } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

type PriceTickerProps = {
  coinSymbol: string;
  coinId: string;
  onPriceUpdate?: (price: number) => void;
};

export const PriceTicker = ({ coinSymbol, coinId, onPriceUpdate }: PriceTickerProps) => {
  const { price, isConnected } = useCoinGeckoWebSocket({ coinSymbol, coinId, liveInterval: '1s' });
  const prevPriceRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (!price?.usd) return;

    if (prevPriceRef.current !== null) {
      setFlash(price.usd > prevPriceRef.current ? 'up' : 'down');
      setTimeout(() => setFlash(null), 600);
    }

    prevPriceRef.current = price.usd;
    onPriceUpdate?.(price.usd);
  }, [price?.usd, onPriceUpdate]);

  const { textClass } = trendingClasses(price?.change24h ?? 0);

  return (
    <div className="price-ticker">
      <div className="price-ticker__status">
        <span className={cn('price-ticker__dot', isConnected ? 'is-live' : 'is-offline')} />
        <span className="price-ticker__label">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
      </div>

      <div
        className={cn('price-ticker__price', {
          'flash-up': flash === 'up',
          'flash-down': flash === 'down',
        })}
      >
        {price ? formatCurrency(price.usd, 2) : '—'}
      </div>

      {price?.change24h !== undefined && (
        <div className={cn('price-ticker__change', textClass)}>
          {price.change24h > 0 ? '▲' : '▼'} {formatPercentage(Math.abs(price.change24h))} (24h)
        </div>
      )}
    </div>
  );
};
