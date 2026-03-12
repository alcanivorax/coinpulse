import { NextRequest, NextResponse } from 'next/server';
import qs from 'query-string';

const BASE_URL = process.env.COINGECKO_BASE_URL?.replace(/\/$/, '');
const API_KEY = process.env.COINGECKO_API_KEY;

export async function GET(req: NextRequest) {
  const coinId = req.nextUrl.searchParams.get('coinId');

  if (!coinId) {
    return NextResponse.json({ error: 'coinId is required' }, { status: 400 });
  }

  if (!BASE_URL || !API_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const url = qs.stringifyUrl({
    url: `${BASE_URL}/simple/price`,
    query: {
      ids: coinId,
      vs_currencies: 'usd',
      include_24hr_change: 'true',
    },
  });

  const res = await fetch(url, {
    headers: {
      'x-cg-demo-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `CoinGecko error ${res.status}` }, { status: res.status });
  }

  const data = await res.json();
  const coinData = data[coinId];

  if (!coinData) {
    return NextResponse.json({ error: 'Coin not found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      usd: coinData.usd,
      change24h: coinData.usd_24h_change ?? 0,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15' },
    },
  );
}
