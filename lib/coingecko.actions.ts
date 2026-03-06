'use server';

import { COMPILER_NAMES } from 'next/dist/shared/lib/constants';
import qs from 'query-string';

const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

if (!BASE_URL) throw new Error('Missing COINGECKO_BASE_URL');
if (!API_KEY) throw new Error('Missing COINGECKO_API_KEY');

const API_BASE = BASE_URL.replace(/\/$/, '');

export async function fetcher<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>,
  revalidate = 60,
): Promise<T> {
  const url = qs.stringifyUrl(
    {
      url: `${API_BASE}/${endpoint}`,
      query: params,
    },
    { skipEmptyString: true, skipNull: true },
  );

  const response = await fetch(url, {
    headers: {
      'x-cg-demo-api-key': API_KEY!,
      'Content-Type': 'application/json',
    },
    next: { revalidate },
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(`CoinGecko API Error ${response.status}: ${errorBody || response.statusText}`);
  }

  return response.json();
}

export async function searchCoins(query: string): Promise<SearchCoin[]> {
  if (!query) return [];

  const data = await fetcher<{
    coins: {
      id: string;
      name: string;
      symbol: string;
      market_cap_rank: number | null;
      thumb: string;
      large: string;
    }[];
  }>('/search', { query }, 0);

  if (!data.coins.length) return [];

  const topCoins = data.coins.slice(0, 10);

  const ids = topCoins.map((c) => c.id).join(',');

  const priceData = await fetcher<Record<string, { usd: number; usd_24h_change: number }>>(
    '/simple/price',
    {
      ids,
      vs_currencies: 'usd',
      include_24hr_change: true,
    },
    60,
  );

  return topCoins.map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    market_cap_rank: coin.market_cap_rank,
    thumb: coin.thumb,
    large: coin.large,
    data: {
      price: priceData[coin.id]?.usd,
      price_change_percentage_24h: priceData[coin.id]?.usd_24h_change ?? 0,
    },
  }));
}

export async function getPools(
  id: string,
  network?: string | null,
  contractAddress?: string | null,
): Promise<PoolData> {
  const fallback: PoolData = {
    id: '',
    address: '',
    name: '',
    network: '',
  };

  try {
    if (network && contractAddress) {
      const poolData = await fetcher<{ data: PoolData[] }>(
        `/onchain/networks/${network}/tokens/${contractAddress}/pools`,
      );

      if (poolData.data?.length) {
        return poolData.data[0];
      }
    }

    const poolData = await fetcher<{ data: PoolData[] }>('/onchain/search/pools', { query: id });

    return poolData.data?.[0] ?? fallback;
  } catch (error) {
    console.error('Pool fetch error:', error);
    return fallback;
  }
}
