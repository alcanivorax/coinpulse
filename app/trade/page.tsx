import { fetcher } from '@/lib/coingecko.actions';
import { TradingPanel } from '@/components/trade/TradingPanel';

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
      per_page: 10,
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

export default async function TradePage() {
  const coins = await getTradeableCoins();

  return (
    <main className="trade-page">
      <div className="main-container">
        <div className="trade-page__intro">
          <h1 className="trade-page__heading">Paper Trading</h1>
          <p className="trade-page__sub">
            Simulate trades with <strong>$10,000</strong> virtual balance. No real money involved.
          </p>
        </div>

        <TradingPanel coins={coins} />
      </div>
    </main>
  );
}
