'use server';

import qs from 'query-string';

const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

if (!BASE_URL) throw new Error('Could not get base url');
if (!API_KEY) throw new Error('Could not get api key');

export async function fetcher<T>(
  endpoint: string,
  params?: QueryParams,
  revalidate = 60,
): Promise<T> {
  const url = qs.stringifyUrl(
    {
      url: `${BASE_URL}/${endpoint}`,
      query: params,
    },
    { skipEmptyString: true, skipNull: true },
  );

  const response = await fetch(url, {
    headers: {
      'x-cg-demo-api-key': API_KEY,
      'Content-Type': 'application/json',
    } as Record<string, string>,
    next: { revalidate },
  });

  if (!response.ok) {
    const errorBody: CoinGeckoErrorBody = await response.json().catch(() => ({}));

    throw new Error(`API Error: ${response.status}: ${errorBody.error || response.statusText} `);
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

  // Fetch 24h price changes for the top results in one call
  const ids = data.coins.slice(0, 10).map((c) => c.id).join(',');

  const priceData = await fetcher<
    Record<string, { usd: number; usd_24h_change: number }>
  >('/simple/price', {
    ids,
    vs_currencies: 'usd',
    include_24hr_change: true,
  }, 60);

  return data.coins.slice(0, 10).map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    market_cap_rank: coin.market_cap_rank,
    thumb: coin.thumb,
    large: coin.large,
    data: {
      price: priceData[coin.id]?.usd ?? undefined,
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

  if (network && contractAddress) {
    try {
      const poolData = await fetcher<{ data: PoolData[] }>(
        `/onchain/networks/${network}/tokens/${contractAddress}/pools`,
      );

      return poolData.data?.[0] ?? fallback;
    } catch (error) {
      console.log(error);
      return fallback;
    }
  }

  try {
    const poolData = await fetcher<{ data: PoolData[] }>('/onchain/search/pools', { query: id });

    return poolData.data?.[0] ?? fallback;
  } catch {
    return fallback;
  }
}