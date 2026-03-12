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
  initialOhlcData?: OHLCData[];
};

export const TradingPanel = ({ coins: initialCoins, initialOhlcData }: TradingPanelProps) => {
  const [coins, setCoins] = useState<TradeableCoin[]>(initialCoins);
  const [selectedCoin, setSelectedCoin] = useState<TradeableCoin>(initialCoins[0]);
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

  // If the coin is already in the list just select it.
  // Otherwise append it and select it.
  const handleAddCoin = useCallback((coin: TradeableCoin) => {
    setCoins((prev) => {
      if (prev.some((c) => c.id === coin.id)) return prev;
      return [...prev, coin];
    });
    setSelectedCoin(coin);
    setLivePrice(null);
  }, []);

  // Only use the pre-fetched data for the initially selected coin (initialCoins[0]).
  // When the user picks a different coin the chart remounts (key prop) and
  // fetches fresh data on its own.
  const chartData =
    selectedCoin.id === initialCoins[0].id && initialOhlcData?.length ? initialOhlcData : undefined;

  return (
    <div className="trading-panel">
      <CoinSelector
        coins={coins}
        selectedCoinId={selectedCoin.id}
        onSelect={handleSelectCoin}
        onAddCoin={handleAddCoin}
      />

      <div className="trading-panel__main">
        <div className="trading-panel__chart-area">
          <div className="trading-panel__chart-header">
            <h1 className="trading-panel__coin-name">{selectedCoin.name}</h1>
            <PriceTicker
              key={selectedCoin.id}
              coinSymbol={selectedCoin.symbol}
              coinId={selectedCoin.id}
              initialPrice={selectedCoin.currentPrice}
              onPriceUpdate={handlePriceUpdate}
            />
          </div>
          <div className="trading-panel__chart">
            <CandlestickChart
              key={selectedCoin.id}
              coinId={selectedCoin.id}
              data={chartData}
              liveInterval="1m"
              setLiveInterval={() => {}}
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
