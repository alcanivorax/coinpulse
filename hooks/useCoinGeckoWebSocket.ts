'use client';

import { useEffect, useRef, useState } from 'react';

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';

const toBinanceSymbol = (symbol?: string) => (symbol ? `${symbol.toLowerCase()}usdt` : null);

const toBinanceInterval = (liveInterval: '1s' | '1m') => (liveInterval === '1s' ? '1s' : '1m');

export const useCoinGeckoWebSocket = ({
  coinSymbol,
  coinId,
  liveInterval = '1m',
}: UseCoinGeckoWebSocketProps): UseCoinGeckoWebSocketReturn => {
  const wsRef = useRef<WebSocket | null>(null);

  const [price, setPrice] = useState<ExtendedPriceData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [ohlcv, setOhlcv] = useState<OHLCData | null>(null);
  const [isWsReady, setIsWsReady] = useState(false);

  useEffect(() => {
    const symbol = toBinanceSymbol(coinSymbol);
    if (!symbol) return;
    const interval = toBinanceInterval(liveInterval);

    const streamUrl = `${BINANCE_WS_BASE}/${symbol}@trade/${symbol}@ticker/${symbol}@kline_${interval}`;

    const ws = new WebSocket(streamUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsWsReady(true);

    ws.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);

      if (msg.e === 'trade') {
        const tradePrice = parseFloat(msg.p);
        const tradeAmount = parseFloat(msg.q);

        setTrades((prev) =>
          [
            {
              price: tradePrice,
              amount: tradeAmount,
              value: tradePrice * tradeAmount,
              type: msg.m ? 's' : 'b',
              timestamp: msg.T,
            },
            ...prev,
          ].slice(0, 7),
        );
      }

      if (msg.e === '24hrTicker') {
        setPrice({
          usd: parseFloat(msg.c),
          coin: coinId,
          price: parseFloat(msg.c),
          change24h: parseFloat(msg.P),
          marketCap: undefined,
          volume24h: parseFloat(msg.v),
          timestamp: msg.E,
        });
      }

      if (msg.e === 'kline') {
        const k = msg.k;
        setOhlcv([k.t, parseFloat(k.o), parseFloat(k.h), parseFloat(k.l), parseFloat(k.c)]);
      }
    };

    ws.onclose = () => setIsWsReady(false);
    ws.onerror = () => setIsWsReady(false);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [coinSymbol, coinId, liveInterval]);

  return { price, trades, ohlcv, isConnected: isWsReady };
};
