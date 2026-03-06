'use client';

import { useTradingStore } from '@/lib/trading-store';
import { cn, formatCurrency } from '@/lib/utils';

type PortfolioProps = {
  livePrices: Record<string, number>;
};

const INITIAL_BALANCE = 10_000;

export const Portfolio = ({ livePrices }: PortfolioProps) => {
  const { balance, portfolio, calculatePortfolioValue, resetPortfolio } = useTradingStore();

  const holdingsValue = calculatePortfolioValue(livePrices);
  const totalValue = balance + holdingsValue;
  const pnl = totalValue - INITIAL_BALANCE;
  const pnlPercent = (pnl / INITIAL_BALANCE) * 100;
  const isProfit = pnl >= 0;

  const activeHoldings = Object.values(portfolio).filter((h) => h.amount > 0);

  const handleReset = () => {
    if (confirm('Reset your portfolio? This will clear all trades and restore $10,000.')) {
      resetPortfolio();
    }
  };

  return (
    <div className="portfolio">
      <div className="portfolio__header">
        <h2 className="portfolio__title">Portfolio</h2>
        <button className="portfolio__reset" onClick={handleReset}>
          Reset
        </button>
      </div>

      {/* Summary cards */}
      <div className="portfolio__summary">
        <div className="portfolio__card">
          <span className="portfolio__card-label">Total Value</span>
          <span className="portfolio__card-value">{formatCurrency(totalValue)}</span>
        </div>

        <div className="portfolio__card">
          <span className="portfolio__card-label">Cash Balance</span>
          <span className="portfolio__card-value">{formatCurrency(balance)}</span>
        </div>

        <div className="portfolio__card">
          <span className="portfolio__card-label">Holdings</span>
          <span className="portfolio__card-value">{formatCurrency(holdingsValue)}</span>
        </div>

        <div className={cn('portfolio__card', isProfit ? 'is-profit' : 'is-loss')}>
          <span className="portfolio__card-label">Total P&L</span>
          <span className="portfolio__card-value">
            {isProfit ? '+' : ''}
            {formatCurrency(pnl)} ({pnlPercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Holdings table */}
      {activeHoldings.length > 0 ? (
        <div className="portfolio__holdings">
          <table className="portfolio__table">
            <thead>
              <tr>
                <th>Coin</th>
                <th>Amount</th>
                <th>Avg. Buy</th>
                <th>Current</th>
                <th>Value</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              {activeHoldings.map((entry) => {
                const currentPrice = livePrices[entry.coinId] ?? 0;
                const value = entry.amount * currentPrice;
                const costBasis = entry.amount * entry.avgBuyPrice;
                const entryPnl = value - costBasis;
                const entryPnlPct = costBasis > 0 ? (entryPnl / costBasis) * 100 : 0;
                const isEntryProfit = entryPnl >= 0;

                return (
                  <tr key={entry.coinId}>
                    <td className="portfolio__coin">{entry.symbol}</td>
                    <td>{entry.amount.toFixed(6)}</td>
                    <td>{formatCurrency(entry.avgBuyPrice, 2)}</td>
                    <td>{currentPrice > 0 ? formatCurrency(currentPrice, 2) : '—'}</td>
                    <td>{formatCurrency(value)}</td>
                    <td className={cn(isEntryProfit ? 'text-green-400' : 'text-red-400')}>
                      {isEntryProfit ? '+' : ''}
                      {formatCurrency(entryPnl)} ({entryPnlPct.toFixed(1)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="portfolio__empty">No holdings yet. Start by buying a coin above.</p>
      )}
    </div>
  );
};
