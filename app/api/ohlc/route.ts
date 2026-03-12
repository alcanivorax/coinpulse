import { NextRequest, NextResponse } from 'next/server';
import qs from 'query-string';

const BASE_URL = process.env.COINGECKO_BASE_URL?.replace(/\/$/, '');
const API_KEY = process.env.COINGECKO_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const coinId = searchParams.get('coinId');
  const days = searchParams.get('days') ?? '1';

  if (!coinId) {
    return NextResponse.json({ error: 'coinId is required' }, { status: 400 });
  }

  if (!BASE_URL || !API_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const url = qs.stringifyUrl({
    url: `${BASE_URL}/coins/${coinId}/ohlc`,
    query: { vs_currency: 'usd', days, precision: 'full' },
  });

  const res = await fetch(url, {
    headers: {
      'x-cg-demo-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    return NextResponse.json(
      { error: `CoinGecko API error ${res.status}: ${errorBody || res.statusText}` },
      { status: res.status },
    );
  }

  const data = await res.json();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
    },
  });
}
