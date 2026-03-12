'use client';

import { useCoinGeckoWebSocket } from '@/hooks/useCoinGeckoWebSocket';
import { cn, formatCurrency, formatPercentage, trendingClasses } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

type PriceTickerProps = {
  coinSymbol: string;
  coinId: string;
  initialPrice?: number;
  onPriceUpdate?: (price: number) => void;
};

export const PriceTicker = ({
  coinSymbol,
  coinId,
  initialPrice,
  onPriceUpdate,
}: PriceTickerProps) => {
  const { price } = useCoinGeckoWebSocket({ coinSymbol, coinId, liveInterval: '1s' });
  const prevPriceRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (!price?.usd) return;

    // Derive flash direction from the ref — no setState called synchronously here,
    // the setTimeout callback runs asynchronously so it doesn't cause cascading renders.
    if (prevPriceRef.current !== null && price.usd !== prevPriceRef.current) {
      const direction = price.usd > prevPriceRef.current ? 'up' : 'down';

      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);

      // Defer the setState to the next tick so it is never synchronous within the effect body
      flashTimeoutRef.current = setTimeout(() => {
        setFlash(direction);
        flashTimeoutRef.current = setTimeout(() => setFlash(null), 600);
      }, 0);
    }

    prevPriceRef.current = price.usd;
    onPriceUpdate?.(price.usd);

    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, [price?.usd, onPriceUpdate]);

  const displayPrice = price?.usd ?? initialPrice;
  const displayChange = price?.change24h;
  const { textClass } = trendingClasses(displayChange ?? 0);
  const isLive = !!price?.usd;

  return (
    <div className="price-ticker">
      <div className="price-ticker__status">
        <span className={cn('price-ticker__dot', isLive ? 'is-live' : 'is-offline')} />
        <span className="price-ticker__label">{isLive ? 'LIVE' : 'LOADING'}</span>
      </div>

      <div
        className={cn('price-ticker__price', {
          'flash-up': flash === 'up',
          'flash-down': flash === 'down',
        })}
      >
        {displayPrice != null ? formatCurrency(displayPrice, 2) : '—'}
      </div>

      {displayChange !== undefined && (
        <div className={cn('price-ticker__change', textClass)}>
          {displayChange > 0 ? '▲' : '▼'} {formatPercentage(Math.abs(displayChange))} (24h)
        </div>
      )}
    </div>
  );
};
