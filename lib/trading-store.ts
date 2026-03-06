import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const INITIAL_BALANCE = 10_000;

export const useTradingStore = create<TradingStore>()(
  persist(
    (set, get) => ({
      balance: INITIAL_BALANCE,
      portfolio: {},
      orders: [],

      buyCoin: (coinId, symbol, amount, price) => {
        const { balance, portfolio } = get();
        const total = amount * price;

        if (total > balance) return 'Insufficient balance';
        if (amount <= 0) return 'Amount must be greater than 0';

        const existing = portfolio[coinId];
        const prevAmount = existing?.amount ?? 0;
        const prevAvg = existing?.avgBuyPrice ?? 0;

        // Weighted average buy price
        const newAvgBuyPrice =
          prevAmount === 0
            ? price
            : (prevAvg * prevAmount + price * amount) / (prevAmount + amount);

        const order: Order = {
          id: crypto.randomUUID(),
          type: 'buy',
          symbol: symbol.toUpperCase(),
          coinId,
          amount,
          price,
          total,
          timestamp: Date.now(),
        };

        set((state) => ({
          balance: state.balance - total,
          portfolio: {
            ...state.portfolio,
            [coinId]: {
              symbol: symbol.toUpperCase(),
              coinId,
              amount: prevAmount + amount,
              avgBuyPrice: newAvgBuyPrice,
            },
          },
          orders: [order, ...state.orders],
        }));

        return null;
      },

      sellCoin: (coinId, symbol, amount, price) => {
        const { portfolio } = get();
        const existing = portfolio[coinId];

        if (!existing || existing.amount <= 0) return "You don't own this coin";
        if (amount > existing.amount) return 'Insufficient holdings';
        if (amount <= 0) return 'Amount must be greater than 0';

        const total = amount * price;
        const remainingAmount = existing.amount - amount;

        const order: Order = {
          id: crypto.randomUUID(),
          type: 'sell',
          symbol: symbol.toUpperCase(),
          coinId,
          amount,
          price,
          total,
          timestamp: Date.now(),
        };

        set((state) => ({
          balance: state.balance + total,
          portfolio: {
            ...state.portfolio,
            [coinId]: {
              ...existing,
              amount: remainingAmount,
            },
          },
          orders: [order, ...state.orders],
        }));

        return null;
      },

      calculatePortfolioValue: (prices) => {
        const { portfolio } = get();
        return Object.values(portfolio).reduce((total, entry) => {
          const price = prices[entry.coinId] ?? 0;
          return total + entry.amount * price;
        }, 0);
      },

      resetPortfolio: () => {
        set({ balance: INITIAL_BALANCE, portfolio: {}, orders: [] });
      },
    }),
    {
      name: 'trading-simulation-store',
      partialize: (state) => ({
        balance: state.balance,
        portfolio: state.portfolio,
        orders: state.orders,
      }),
    },
  ),
);
