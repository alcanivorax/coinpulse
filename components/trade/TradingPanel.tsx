'use client';

import { useState, useCallback, useRef } from 'react';
import { CoinSelector } from './CoinSelector';
import { OrderForm } from './OrderForm';
import { Portfolio } from './Portfolio';
import { OrderHistory } from './OrderHistory';
import { PriceTicker } from './PriceTicker';
import CandlestickChart from '@/components/CandlestickChart';

type TradingPanelProps = {
  coins: TradeableCoin[];
};

export const TradingPanel = ({ coins }: TradingPanelProps) => {
  const [selectedCoin, setSelectedCoin] = useState<TradeableCoin>(coins[0]);
  const livePricesRef = useRef<Record<string, number>>({});
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const handlePriceUpdate = useCallback(
    (price: number) => {
      setLivePrice(price);
      livePricesRef.current = { ...livePricesRef.current, [selectedCoin.id]: price };
      setLivePrices({ ...livePricesRef.current });
    },
    [selectedCoin.id],
  );

  const handleSelectCoin = useCallback((coin: TradeableCoin) => {
    setSelectedCoin(coin);
    setLivePrice(null);
  }, []);

  return (
    <div className="trading-panel">
      <CoinSelector coins={coins} selectedCoinId={selectedCoin.id} onSelect={handleSelectCoin} />

      <div className="trading-panel__main">
        <div className="trading-panel__chart-area">
          <div className="trading-panel__chart-header">
            <h1 className="trading-panel__coin-name">{selectedCoin.name}</h1>
            <PriceTicker
              coinSymbol={selectedCoin.symbol}
              coinId={selectedCoin.id}
              onPriceUpdate={handlePriceUpdate}
            />
          </div>
          <div className="trading-panel__chart">
            <CandlestickChart
              coinId={selectedCoin.id}
              coinSymbol={selectedCoin.symbol}
              liveInterval="1m"
            />
          </div>
        </div>

        <div className="trading-panel__order-area">
          <OrderForm selectedCoin={selectedCoin} livePrice={livePrice} />
        </div>
      </div>

      <Portfolio livePrices={livePrices} />
      <OrderHistory />
    </div>
  );
};
