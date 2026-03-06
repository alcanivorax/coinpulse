'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

type CoinSelectorProps = {
  coins: TradeableCoin[];
  selectedCoinId: string;
  onSelect: (coin: TradeableCoin) => void;
};

export const CoinSelector = ({ coins, selectedCoinId, onSelect }: CoinSelectorProps) => {
  return (
    <div className="coin-selector">
      {coins.map((coin) => (
        <button
          key={coin.id}
          className={cn('coin-selector__item', { 'is-active': coin.id === selectedCoinId })}
          onClick={() => onSelect(coin)}
        >
          {coin.thumb && (
            <Image
              src={coin.thumb}
              alt={coin.name}
              width={20}
              height={20}
              className="coin-selector__img"
            />
          )}
          <span className="coin-selector__symbol">{coin.symbol.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
};
