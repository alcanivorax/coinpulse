'use client';

import { useState, useCallback } from 'react';
import { useTradingStore } from '@/lib/trading-store';
import { cn, formatCurrency } from '@/lib/utils';

type OrderFormProps = {
  selectedCoin: TradeableCoin;
  livePrice: number | null;
};

type Tab = 'buy' | 'sell';

export const OrderForm = ({ selectedCoin, livePrice }: OrderFormProps) => {
  const [tab, setTab] = useState<Tab>('buy');
  const [amountStr, setAmountStr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { balance, portfolio, buyCoin, sellCoin } = useTradingStore();

  const price = livePrice ?? selectedCoin.currentPrice;
  const amount = parseFloat(amountStr) || 0;
  const total = amount * price;

  const ownedEntry = portfolio[selectedCoin.id];
  const ownedAmount = ownedEntry?.amount ?? 0;

  const setQuickAmount = useCallback(
    (fraction: number) => {
      if (tab === 'buy') {
        const maxAffordable = balance / price;
        setAmountStr((maxAffordable * fraction).toFixed(6));
      } else {
        setAmountStr((ownedAmount * fraction).toFixed(6));
      }
      setError(null);
    },
    [tab, balance, price, ownedAmount],
  );

  const handleSubmit = () => {
    setError(null);
    setSuccessMsg(null);

    if (!amountStr || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const err =
      tab === 'buy'
        ? buyCoin(selectedCoin.id, selectedCoin.symbol, amount, price)
        : sellCoin(selectedCoin.id, selectedCoin.symbol, amount, price);

    if (err) {
      setError(err);
    } else {
      const action = tab === 'buy' ? 'Bought' : 'Sold';
      setSuccessMsg(
        `${action} ${amount.toFixed(6)} ${selectedCoin.symbol.toUpperCase()} for ${formatCurrency(total)}`,
      );
      setAmountStr('');
    }
  };

  return (
    <div className="order-form">
      {/* Tabs */}
      <div className="order-form__tabs">
        <button
          className={cn('order-form__tab', { 'is-active is-buy': tab === 'buy' })}
          onClick={() => {
            setTab('buy');
            setError(null);
            setSuccessMsg(null);
            setAmountStr('');
          }}
        >
          Buy
        </button>
        <button
          className={cn('order-form__tab', { 'is-active is-sell': tab === 'sell' })}
          onClick={() => {
            setTab('sell');
            setError(null);
            setSuccessMsg(null);
            setAmountStr('');
          }}
        >
          Sell
        </button>
      </div>

      <div className="order-form__body">
        {/* Context info */}
        <div className="order-form__context">
          {tab === 'buy' ? (
            <span>
              Available: <strong>{formatCurrency(balance)}</strong>
            </span>
          ) : (
            <span>
              Holdings:{' '}
              <strong>
                {ownedAmount.toFixed(6)} {selectedCoin.symbol.toUpperCase()}
              </strong>
            </span>
          )}
          <span>
            Price: <strong>{formatCurrency(price, 2)}</strong>
          </span>
        </div>

        {/* Amount input */}
        <div className="order-form__field">
          <label className="order-form__label">Amount ({selectedCoin.symbol.toUpperCase()})</label>
          <input
            type="number"
            className="order-form__input"
            placeholder="0.00000000"
            value={amountStr}
            min="0"
            step="any"
            onChange={(e) => {
              setAmountStr(e.target.value);
              setError(null);
              setSuccessMsg(null);
            }}
          />
        </div>

        {/* Quick % buttons */}
        <div className="order-form__quick">
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <button key={f} className="order-form__quick-btn" onClick={() => setQuickAmount(f)}>
              {f * 100}%
            </button>
          ))}
        </div>

        {/* Total */}
        <div className="order-form__total">
          <span>Total</span>
          <strong>{amount > 0 ? formatCurrency(total) : '—'}</strong>
        </div>

        {/* Feedback */}
        {error && <p className="order-form__error">{error}</p>}
        {successMsg && <p className="order-form__success">{successMsg}</p>}

        {/* Submit */}
        <button
          className={cn('order-form__submit', tab === 'buy' ? 'is-buy' : 'is-sell')}
          onClick={handleSubmit}
        >
          {tab === 'buy'
            ? `Buy ${selectedCoin.symbol.toUpperCase()}`
            : `Sell ${selectedCoin.symbol.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
};
