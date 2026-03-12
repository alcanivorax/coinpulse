import { fetcher } from '@/lib/coingecko.actions';
import { TradingPanel } from '@/components/trade/TradingPanel';
import { PERIOD_CONFIG } from '@/constants';

async function getTradeableCoins(): Promise<TradeableCoin[]> {
  const data = await fetcher<
    {
      id: string;
      symbol: string;
      name: string;
      image: string;
      current_price: number;
    }[]
  >(
    'coins/markets',
    {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 50,
      page: 1,
      sparkline: false,
    },
    30,
  );

  return data.map((coin) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    thumb: coin.image,
    currentPrice: coin.current_price,
  }));
}

async function getInitialOhlcData(coinId: string): Promise<OHLCData[]> {
  try {
    const { days } = PERIOD_CONFIG['daily'];
    return await fetcher<OHLCData[]>(
      `coins/${coinId}/ohlc`,
      { vs_currency: 'usd', days, precision: 'full' },
      60,
    );
  } catch {
    return [];
  }
}

export default async function TradePage() {
  // Fetch coins list and the first coin's OHLC data in parallel so the
  // chart has data ready the moment the page is rendered — no client-side
  // loading delay on the initial view.
  const [coins, initialOhlcData] = await Promise.all([
    getTradeableCoins(),
    // Bitcoin is always #1 by market cap; pre-fetching it covers the
    // default selected coin without needing a sequential dependency.
    getInitialOhlcData('bitcoin'),
  ]);

  return (
    <main className="trade-page">
      <div className="main-container">
        <div className="trade-page__intro">
          <h1 className="trade-page__heading">Paper Trading</h1>
          <p className="trade-page__sub">
            Simulate trades with <strong>$10,000</strong> virtual balance. No real money involved.
          </p>
        </div>

        <TradingPanel coins={coins} initialOhlcData={initialOhlcData} />
      </div>
    </main>
  );
}
