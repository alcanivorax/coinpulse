'use client';

import { useEffect, useRef, useState } from 'react';

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';
const WS_FALLBACK_TIMEOUT_MS = 3000;
const REST_POLL_INTERVAL_MS = 10000;

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
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let wsReceivedData = false;

    const clearFallback = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const fetchPriceRest = async () => {
      try {
        const res = await fetch(`/api/price?coinId=${coinId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.usd != null) {
          setPrice({
            usd: data.usd,
            coin: coinId,
            price: data.usd,
            change24h: data.change24h ?? 0,
            timestamp: Date.now(),
          });
        }
      } catch {
        // silently ignore network errors
      }
    };

    const startRestFallback = () => {
      clearFallback();
      fetchPriceRest();
      pollInterval = setInterval(fetchPriceRest, REST_POLL_INTERVAL_MS);
    };

    const symbol = toBinanceSymbol(coinSymbol);

    // No valid Binance symbol — go straight to REST polling
    if (!symbol) {
      startRestFallback();
      return () => clearFallback();
    }

    const interval = toBinanceInterval(liveInterval);
    const streamUrl = `${BINANCE_WS_BASE}/${symbol}@trade/${symbol}@ticker/${symbol}@kline_${interval}`;

    const ws = new WebSocket(streamUrl);
    wsRef.current = ws;

    // If no data arrives within the timeout, fall back to REST
    fallbackTimer = setTimeout(() => {
      if (!wsReceivedData) startRestFallback();
    }, WS_FALLBACK_TIMEOUT_MS);

    ws.onopen = () => setIsWsReady(true);

    ws.onmessage = (event: MessageEvent) => {
      let msg: WebSocketMessage;
      try {
        msg = JSON.parse(event.data) as WebSocketMessage;
      } catch {
        return;
      }

      // Binance sends { error: { code, msg } } for invalid stream names
      if ((msg as unknown as { error?: unknown }).error) {
        startRestFallback();
        return;
      }

      if (msg.e === 'trade') {
        wsReceivedData = true;
        const tradePrice = parseFloat(String(msg.p ?? 0));
        const tradeAmount = parseFloat(String(msg.q ?? 0));
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
        wsReceivedData = true;
        // WS is delivering data — cancel the REST fallback timer
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        setPrice({
          usd: parseFloat(String(msg.c ?? 0)),
          coin: coinId,
          price: parseFloat(String(msg.c ?? 0)),
          change24h: parseFloat(String(msg.P ?? 0)),
          volume24h: parseFloat(String(msg.v ?? 0)),
          timestamp: msg.E,
        });
      }

      if (msg.e === 'kline' && msg.k) {
        wsReceivedData = true;
        const k = msg.k;
        setOhlcv([k.t, parseFloat(k.o), parseFloat(k.h), parseFloat(k.l), parseFloat(k.c)]);
      }
    };

    ws.onerror = () => {
      setIsWsReady(false);
      startRestFallback();
    };

    ws.onclose = () => setIsWsReady(false);

    return () => {
      ws.close();
      wsRef.current = null;
      clearFallback();
    };
  }, [coinSymbol, coinId, liveInterval]);

  return { price, trades, ohlcv, isConnected: isWsReady };
};
